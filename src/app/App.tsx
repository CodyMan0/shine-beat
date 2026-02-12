import { useState, useCallback, useRef, useEffect } from 'react';
import { YouTubePlayer } from '@/features/youtube-player';
import { MetronomeControl } from '@/features/metronome';
import { TapBPM } from '@/features/bpm-detection';
import { SyncControl } from '@/features/sync-control';
import { BPMSearch } from '@/features/bpm-detection';
import { PlayerState } from '@/features/youtube-player';
import { useVisitorTracking, useVisitorCount } from '@/features/analytics';
import { FeedbackForm } from '@/features/feedback';

function App() {
  useVisitorTracking();
  const visitorCount = useVisitorCount();

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const youtubeControlsRef = useRef<{
    play: () => void;
    pause: () => void;
    stop: () => void;
  } | null>(null);

  const metronomeControlsRef = useRef<{
    start: () => void;
    stop: () => void;
    toggle: () => void;
    isPlaying: boolean;
    setBpm: (bpm: number) => void;
  } | null>(null);

  const handleYoutubeRef = useCallback((controls: {
    play: () => void;
    pause: () => void;
    stop: () => void;
  }) => {
    youtubeControlsRef.current = controls;
  }, []);

  const handleMetronomeRef = useCallback((controls: {
    start: () => void;
    stop: () => void;
    toggle: () => void;
    isPlaying: boolean;
    setBpm: (bpm: number) => void;
  }) => {
    metronomeControlsRef.current = controls;
  }, []);

  const handleYoutubeStateChange = useCallback((state: number) => {
    if (state === PlayerState.ENDED) {
      metronomeControlsRef.current?.stop();
      setIsPlaying(false);
    }
  }, []);

  const handleVideoLoaded = useCallback((url: string) => {
    setVideoUrl(url);
  }, []);

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      metronomeControlsRef.current?.stop();
      setIsPlaying(false);
    } else {
      metronomeControlsRef.current?.start();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    metronomeControlsRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const handleBpmDetected = useCallback((bpm: number) => {
    metronomeControlsRef.current?.setBpm(bpm);
  }, []);

  // Keyboard shortcut: Space to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  return (
    <div className="min-h-screen py-4 px-3 sm:py-6 sm:px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <header className="text-center space-y-2 pb-2">
          <h1 className="text-2xl sm:text-3xl font-mono font-extrabold tracking-tight">
            <span className="text-accent">Shine</span>
            <span className="text-text-primary">Beat</span>
          </h1>
          <p className="text-[11px] text-text-muted tracking-[0.25em] uppercase font-mono">
            Drum Practice Metronome
          </p>
          {visitorCount !== null && (
            <p className="text-[11px] text-text-muted font-mono">
              <span className="text-accent font-bold">{visitorCount.toLocaleString()}</span> musicians practiced
            </p>
          )}
        </header>

        {/* YouTube Player Section */}
        <YouTubePlayer
          youtubeRef={handleYoutubeRef}
          onStateChange={handleYoutubeStateChange}
          onVideoLoaded={handleVideoLoaded}
        />

        {/* BPM Search by Song Title */}
        <BPMSearch videoUrl={videoUrl} onBpmDetected={handleBpmDetected} />

        {/* Metronome Section */}
        <MetronomeControl metronomeRef={handleMetronomeRef} />

        {/* Tap BPM */}
        <TapBPM onBpmDetected={handleBpmDetected} />

        {/* Sync Control Section */}
        <SyncControl
          isPlaying={isPlaying}
          onToggle={handleToggle}
          onStop={handleStop}
        />

        {/* Keyboard Hint */}
        <div className="text-center text-xs text-text-muted">
          <kbd className="px-2 py-0.5 bg-surface border border-surface-border rounded text-text-secondary font-mono text-[11px]">
            Space
          </kbd>{' '}
          재생/일시정지
        </div>
      </div>

      {/* Floating Feedback Form */}
      <FeedbackForm />
    </div>
  );
}

export default App;
