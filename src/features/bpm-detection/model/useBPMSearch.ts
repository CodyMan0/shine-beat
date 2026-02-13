import { useState, useCallback } from 'react';
import { fetchSavedBpm, saveSongBpm, voteOnBpm } from '../api/songBpmApi';
import { detectBpmFromAudio } from '../lib/detectBpmFromAudio';
import type { BpmSource } from '../ui/BPMFeedback';

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  bpm: number;
}

export interface UseBPMSearchReturn {
  detectedBpm: number | null;
  songInfo: string | null;
  searchTitle: string | null;
  isSearching: boolean;
  isAnalyzingAudio: boolean;
  error: string | null;
  confidence: number | null;
  bpmSource: BpmSource | null;
  isVerified: boolean;
  voteCount: number;
  searchByUrl: (videoUrl: string) => Promise<void>;
  submitVote: (videoUrl: string, isUpvote: boolean, correctedBpm?: number) => Promise<void>;
}

/**
 * JSONP fetch for Deezer API (bypasses CORS)
 */
function jsonpFetch<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `deezer_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    (window as unknown as Record<string, unknown>)[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    script.src = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to fetch from Deezer API'));
    };

    setTimeout(() => {
      cleanup();
      reject(new Error('Deezer API request timed out'));
    }, 10000);

    document.head.appendChild(script);
  });
}

/**
 * Fetch YouTube video title via oEmbed API
 */
async function fetchVideoTitle(videoUrl: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null;
  }
}

/**
 * Clean up video title for better search results
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\(Official\s*(Music\s*)?Video\)/gi, '')
    .replace(/\(Official\s*Audio\)/gi, '')
    .replace(/\[Official\s*(Music\s*)?Video\]/gi, '')
    .replace(/\[MV\]/gi, '')
    .replace(/\(MV\)/gi, '')
    .replace(/\(Lyrics?\)/gi, '')
    .replace(/\[Lyrics?\]/gi, '')
    .replace(/\(가사\)/gi, '')
    .replace(/Official\s*MV/gi, '')
    .replace(/M\/V/gi, '')
    .replace(/\|\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Attempt BPM detection via audio proxy + client-side analysis
 */
async function analyzeAudioBpm(videoUrl: string): Promise<{ bpm: number; confidence: number } | null> {
  try {
    const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(videoUrl)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength < 1000) return null;

    const result = await detectBpmFromAudio(arrayBuffer);
    return result;
  } catch {
    return null;
  }
}

export function useBPMSearch(): UseBPMSearchReturn {
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [songInfo, setSongInfo] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [bpmSource, setBpmSource] = useState<BpmSource | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [voteCount, setVoteCount] = useState(0);

  const searchByUrl = useCallback(async (videoUrl: string) => {
    setIsSearching(true);
    setIsAnalyzingAudio(false);
    setError(null);
    setDetectedBpm(null);
    setSongInfo(null);
    setSearchTitle(null);
    setConfidence(null);
    setBpmSource(null);
    setIsVerified(false);
    setVoteCount(0);

    try {
      // Step 1: Get video title from YouTube
      const title = await fetchVideoTitle(videoUrl);
      if (!title) {
        setError('영상 제목을 가져올 수 없습니다.');
        setIsSearching(false);
        return;
      }

      const cleanedTitle = cleanTitle(title);
      setSearchTitle(cleanedTitle);

      // Step 2: Check Supabase cache (verified BPM prioritized)
      const savedData = await fetchSavedBpm(videoUrl);
      if (savedData) {
        setDetectedBpm(savedData.bpm);
        setIsVerified(savedData.verified);
        setVoteCount(savedData.vote_count);
        setBpmSource(savedData.verified ? 'verified' : 'community');
        setSongInfo(savedData.verified ? '검증된 BPM' : '저장된 BPM (커뮤니티)');
        setIsSearching(false);
        return;
      }

      // Step 3: Search Deezer for the track
      try {
        const searchResult = await jsonpFetch<{
          data: Array<{ id: number; title: string; artist: { name: string } }>;
        }>(`https://api.deezer.com/search?q=${encodeURIComponent(cleanedTitle)}&limit=1`);

        if (searchResult.data && searchResult.data.length > 0) {
          const track = searchResult.data[0];
          const trackDetail = await jsonpFetch<DeezerTrack>(
            `https://api.deezer.com/track/${track.id}`,
          );

          if (trackDetail.bpm && trackDetail.bpm > 0) {
            setDetectedBpm(trackDetail.bpm);
            setSongInfo(`${trackDetail.artist.name} - ${trackDetail.title}`);
            setBpmSource('deezer');
            setConfidence(0.95);
            saveSongBpm(videoUrl, cleanedTitle, trackDetail.bpm);
            setIsSearching(false);
            return;
          }
        }
      } catch {
        // Deezer failed, continue to audio analysis
      }

      // Step 4: Audio analysis fallback
      setIsAnalyzingAudio(true);
      setSongInfo('오디오 분석 중...');

      const audioResult = await analyzeAudioBpm(videoUrl);
      setIsAnalyzingAudio(false);

      if (audioResult) {
        setDetectedBpm(audioResult.bpm);
        setConfidence(audioResult.confidence);
        setBpmSource('audio');
        setSongInfo(`오디오 분석 (${Math.round(audioResult.confidence * 100)}% 신뢰도)`);
        saveSongBpm(videoUrl, cleanedTitle, audioResult.bpm);
        setIsSearching(false);
        return;
      }

      // Step 5: All methods failed — show manual input
      setError(`"${cleanedTitle}" BPM을 찾을 수 없습니다. 직접 입력해 주세요.`);
    } catch (err) {
      setIsAnalyzingAudio(false);
      setError(err instanceof Error ? err.message : 'BPM 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const submitVote = useCallback(
    async (videoUrl: string, isUpvote: boolean, correctedBpm?: number) => {
      const result = await voteOnBpm(videoUrl, isUpvote, correctedBpm);
      if (result.success) {
        setVoteCount(result.newVoteCount);
        if (result.newVoteCount >= 3) {
          setIsVerified(true);
          setBpmSource('verified');
        }
        if (correctedBpm) {
          setDetectedBpm(correctedBpm);
          setIsVerified(false);
          setBpmSource('community');
          setVoteCount(0);
        }
      }
    },
    [],
  );

  return {
    detectedBpm,
    songInfo,
    searchTitle,
    isSearching,
    isAnalyzingAudio,
    error,
    confidence,
    bpmSource,
    isVerified,
    voteCount,
    searchByUrl,
    submitVote,
  };
}
