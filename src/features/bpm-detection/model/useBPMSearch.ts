import { useState, useCallback } from 'react';

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  bpm: number;
}

interface UseBPMSearchReturn {
  detectedBpm: number | null;
  songInfo: string | null;
  searchTitle: string | null;
  isSearching: boolean;
  error: string | null;
  searchByUrl: (videoUrl: string) => Promise<void>;
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

    // Timeout after 10 seconds
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
 * Remove common YouTube suffixes like (Official Video), [MV], lyrics, etc.
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
    .replace(/\|\s*.*$/, '') // Remove everything after |
    .replace(/\s+/g, ' ')
    .trim();
}

export function useBPMSearch(): UseBPMSearchReturn {
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [songInfo, setSongInfo] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByUrl = useCallback(async (videoUrl: string) => {
    setIsSearching(true);
    setError(null);
    setDetectedBpm(null);
    setSongInfo(null);
    setSearchTitle(null);

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

      // Step 2: Search Deezer for the track
      const searchResult = await jsonpFetch<{ data: Array<{ id: number; title: string; artist: { name: string } }> }>(
        `https://api.deezer.com/search?q=${encodeURIComponent(cleanedTitle)}&limit=1`
      );

      if (!searchResult.data || searchResult.data.length === 0) {
        setError(`"${cleanedTitle}" 검색 결과가 없습니다.`);
        setIsSearching(false);
        return;
      }

      const track = searchResult.data[0];

      // Step 3: Get full track details (includes BPM)
      const trackDetail = await jsonpFetch<DeezerTrack>(
        `https://api.deezer.com/track/${track.id}`
      );

      if (trackDetail.bpm && trackDetail.bpm > 0) {
        setDetectedBpm(trackDetail.bpm);
        setSongInfo(`${trackDetail.artist.name} - ${trackDetail.title}`);
      } else {
        setError(`BPM 정보가 없습니다: ${track.artist.name} - ${track.title}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'BPM 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    detectedBpm,
    songInfo,
    searchTitle,
    isSearching,
    error,
    searchByUrl,
  };
}
