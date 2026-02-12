import { useEffect, useRef, useState, useCallback } from 'react';
import { PlayerState } from './youtube.types';
import type { YouTubePlayer, PlayerEvent } from './youtube.types';
import { extractVideoId } from '../api/youtube';

interface UseYouTubePlayerOptions {
  onReady?: () => void;
  onStateChange?: (state: PlayerState) => void;
  onError?: (error: number) => void;
}

interface UseYouTubePlayerReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  loadVideo: (url: string) => boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  seekTo: (seconds: number) => void;
  isReady: boolean;
  isPlaying: boolean;
  playerState: PlayerState;
  volume: number;
  currentTime: number;
  duration: number;
  error: string | null;
}

// Global flag to track if YouTube API script is loading/loaded
let isYouTubeAPILoading = false;
let isYouTubeAPILoaded = false;
const apiLoadCallbacks: Array<() => void> = [];

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isYouTubeAPILoaded && window.YT && window.YT.Player) {
      resolve();
      return;
    }

    if (isYouTubeAPILoading) {
      apiLoadCallbacks.push(() => resolve());
      return;
    }

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      isYouTubeAPILoading = true;
      apiLoadCallbacks.push(() => resolve());
      return;
    }

    isYouTubeAPILoading = true;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    tag.onerror = () => {
      isYouTubeAPILoading = false;
      reject(new Error('Failed to load YouTube IFrame API'));
    };

    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      isYouTubeAPILoaded = true;
      isYouTubeAPILoading = false;
      apiLoadCallbacks.forEach(callback => callback());
      apiLoadCallbacks.length = 0;
      resolve();
    };
  });
}

export function useYouTubePlayer(options: UseYouTubePlayerOptions = {}): UseYouTubePlayerReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerDivRef = useRef<HTMLDivElement | null>(null);
  const playerInstanceRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerState, setPlayerState] = useState<PlayerState>(PlayerState.UNSTARTED);
  const [volume, setVolumeState] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store callbacks in refs to avoid re-creating player on callback changes
  const onReadyRef = useRef(options.onReady);
  const onStateChangeRef = useRef(options.onStateChange);
  const onErrorRef = useRef(options.onError);

  onReadyRef.current = options.onReady;
  onStateChangeRef.current = options.onStateChange;
  onErrorRef.current = options.onError;

  // Initialize YouTube API and player - runs only ONCE
  useEffect(() => {
    let mounted = true;

    const initPlayer = async () => {
      try {
        await loadYouTubeAPI();

        if (!mounted || !containerRef.current) return;

        // Create a dedicated div for the player inside the container
        const playerDiv = document.createElement('div');
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(playerDiv);
        playerDivRef.current = playerDiv;

        playerInstanceRef.current = new window.YT.Player(playerDiv, {
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            playsinline: 1,
          },
          events: {
            onReady: (event: PlayerEvent) => {
              if (!mounted) return;
              setIsReady(true);
              setVolumeState(event.target.getVolume());
              onReadyRef.current?.();
            },
            onStateChange: (event: PlayerEvent) => {
              if (!mounted) return;
              const state = event.data as PlayerState;
              setPlayerState(state);
              setIsPlaying(state === PlayerState.PLAYING);
              onStateChangeRef.current?.(state);

              if (state !== PlayerState.UNSTARTED) {
                const dur = event.target.getDuration();
                if (dur > 0) setDuration(dur);
              }
            },
            onError: (event: PlayerEvent) => {
              if (!mounted) return;
              const errorCode = event.data;
              const errorMessages: Record<number, string> = {
                2: 'Invalid video ID',
                5: 'HTML5 player error',
                100: 'Video not found or private',
                101: 'Video embedding not allowed',
                150: 'Video embedding not allowed',
              };
              setError(errorMessages[errorCode] || `Unknown error (${errorCode})`);
              onErrorRef.current?.(errorCode);
            },
          },
        });
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize YouTube player');
        }
      }
    };

    initPlayer();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.destroy();
        } catch {
          // Ignore errors during cleanup
        }
      }
    };
  }, []); // No dependencies - initialize only once

  // Update current time while playing
  useEffect(() => {
    if (isPlaying && playerInstanceRef.current) {
      intervalRef.current = setInterval(() => {
        if (playerInstanceRef.current) {
          try {
            setCurrentTime(playerInstanceRef.current.getCurrentTime());
          } catch {
            // Ignore
          }
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const loadVideo = useCallback((url: string): boolean => {
    if (!playerInstanceRef.current) {
      setError('Player not initialized');
      return false;
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Invalid YouTube URL or video ID');
      return false;
    }

    try {
      setError(null);
      playerInstanceRef.current.loadVideoById(videoId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
      return false;
    }
  }, []);

  const play = useCallback(() => {
    if (!playerInstanceRef.current) return;
    try {
      playerInstanceRef.current.playVideo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play video');
    }
  }, []);

  const pause = useCallback(() => {
    if (!playerInstanceRef.current) return;
    try {
      playerInstanceRef.current.pauseVideo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pause video');
    }
  }, []);

  const stop = useCallback(() => {
    if (!playerInstanceRef.current) return;
    try {
      playerInstanceRef.current.stopVideo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop video');
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (!playerInstanceRef.current) return;
    try {
      const clampedVolume = Math.max(0, Math.min(100, vol));
      playerInstanceRef.current.setVolume(clampedVolume);
      setVolumeState(clampedVolume);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set volume');
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (!playerInstanceRef.current) return;
    try {
      playerInstanceRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seek');
    }
  }, []);

  return {
    containerRef,
    loadVideo,
    play,
    pause,
    stop,
    setVolume,
    seekTo,
    isReady,
    isPlaying,
    playerState,
    volume,
    currentTime,
    duration,
    error,
  };
}
