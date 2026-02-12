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
  const [hasVideo, setHasVideo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { containerRef, play, pause, stop, setVolume, volume, isReady, loadVideo, error } =
    useYouTubePlayer({ onStateChange });

  // Expose controls to parent via ref callback
  const exposedRef = useRef(youtubeRef);
  exposedRef.current = youtubeRef;

  useEffect(() => {
    exposedRef.current?.({ play, pause, stop });
  }, [play, pause, stop]);

  const handleLoadVideo = useCallback(() => {
    if (!url.trim()) return;
    const success = loadVideo(url.trim());
    if (success) {
      setHasVideo(true);
      onVideoLoaded?.(url.trim());
    }
  }, [url, loadVideo, onVideoLoaded]);

  // Auto-detect paste and load
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && (pasted.includes('youtube.com') || pasted.includes('youtu.be'))) {
      setTimeout(() => {
        const success = loadVideo(pasted.trim());
        if (success) {
          setHasVideo(true);
          onVideoLoaded?.(pasted.trim());
        }
      }, 0);
    }
  }, [loadVideo, onVideoLoaded]);

  return (
    <div className="bg-surface rounded-xl border border-surface-border overflow-hidden">
      {/* Video Area */}
      <div className="relative aspect-video bg-black/30">
        {/* YouTube Player (always mounted but hidden when no video) */}
        <div
          ref={containerRef}
          className={`w-full h-full ${hasVideo ? 'block' : 'hidden'}`}
        />

        {/* Placeholder - shown before video load */}
        {!hasVideo && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {/* YouTube Icon */}
            <svg className="w-12 h-12 text-white/10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>

            {/* URL Input */}
            <div className="w-full max-w-sm px-6">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
                onPaste={handlePaste}
                placeholder="YouTube URL 붙여넣기"
                className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.08] text-white text-sm text-center rounded-lg placeholder:text-white/20 focus:border-accent/50 focus:bg-white/[0.08] focus:outline-none transition-all"
              />
            </div>

            <p className="text-[11px] text-white/15 font-mono">
              URL 입력 후 Enter 또는 붙여넣기로 자동 로드
            </p>
          </div>
        )}
      </div>

      {/* Controls - only visible after video loaded */}
      {hasVideo && (
        <div className="p-4 space-y-3">
          {/* Change URL */}
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
              onPaste={handlePaste}
              placeholder="다른 영상 URL"
              className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] text-white text-sm rounded-lg placeholder:text-white/20 focus:border-accent/50 focus:outline-none transition-all"
            />
            <button
              onClick={handleLoadVideo}
              disabled={!url.trim() || !isReady}
              className="shrink-0 px-3 py-1.5 text-xs bg-white/[0.06] border border-white/[0.08] text-white/60 rounded-lg hover:bg-white/[0.1] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              변경
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z" />
            </svg>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-[11px] text-white/40 font-mono w-8 text-right shrink-0">{Math.round(volume)}%</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-4 pb-4">
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 px-3 py-2 rounded-lg">{error}</div>
        </div>
      )}
    </div>
  );
}
