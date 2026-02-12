import { useState, useCallback, useEffect, useRef } from 'react';
import { useYouTubePlayer } from '../model/useYouTubePlayer';

interface YouTubePlayerProps {
  onStateChange?: (state: number) => void;
  onVideoLoaded?: (url: string) => void;
  youtubeRef?: (controls: {
    play: () => void;
    pause: () => void;
    stop: () => void;
  }) => void;
}

export function YouTubePlayer({ onStateChange, onVideoLoaded, youtubeRef }: YouTubePlayerProps) {
  const [url, setUrl] = useState('');

  const { containerRef, play, pause, stop, setVolume, volume, isReady, loadVideo, error } =
    useYouTubePlayer({ onStateChange });

  // Expose controls to parent via ref callback (only when controls change)
  const exposedRef = useRef(youtubeRef);
  exposedRef.current = youtubeRef;

  useEffect(() => {
    exposedRef.current?.({ play, pause, stop });
  }, [play, pause, stop]);

  const handleLoadVideo = useCallback(() => {
    if (!url.trim()) return;
    const success = loadVideo(url.trim());
    if (success) {
      onVideoLoaded?.(url.trim());
    }
  }, [url, loadVideo, onVideoLoaded]);

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-5">
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">YouTube Player</h2>

      <div className="space-y-4">
        {/* URL Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
            placeholder="YouTube URL 입력"
            className="flex-1 px-4 py-2 bg-surface border border-surface-border text-text-primary rounded-lg placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <button
            onClick={handleLoadVideo}
            disabled={!url.trim() || !isReady}
            className="shrink-0 px-4 sm:px-6 py-2 bg-accent text-black font-semibold rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            로드
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 px-4 py-2 rounded-lg">{error}</div>
        )}

        {/* YouTube Player Embed Area */}
        <div className="aspect-video bg-black/50 rounded-lg overflow-hidden">
          <div ref={containerRef} className="w-full h-full" />
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-secondary">볼륨</label>
            <span className="text-xs text-text-primary font-mono">{Math.round(volume)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            disabled={!isReady}
            className="w-full h-2 bg-surface-border rounded-lg appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
