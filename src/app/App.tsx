import { useState, useCallback, useRef, useEffect } from 'react';
import { YouTubePlayer } from '@/features/youtube-player';
import { MetronomeControl } from '@/features/metronome';
import { TapBPM } from '@/features/bpm-detection';
import { SyncControl } from '@/features/sync-control';
import { BPMSearch } from '@/features/bpm-detection';
import { PlayerState } from '@/features/youtube-player';

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMetronomeOnly, setIsMetronomeOnly] = useState(false);
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
    // When YouTube starts playing, start the metronome
    if (state === PlayerState.PLAYING && isPlaying) {
      metronomeControlsRef.current?.start();
    } else if (state === PlayerState.PAUSED) {
      metronomeControlsRef.current?.stop();
    } else if (state === PlayerState.ENDED) {
      metronomeControlsRef.current?.stop();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleVideoLoaded = useCallback((url: string) => {
    setVideoUrl(url);
  }, []);

  const handlePlayTogether = useCallback(() => {
    setIsPlaying(true);
    setIsMetronomeOnly(false);
    youtubeControlsRef.current?.play();
  }, []);

  const handleMetronomeOnly = useCallback(() => {
    setIsPlaying(true);
    setIsMetronomeOnly(true);
    metronomeControlsRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    metronomeControlsRef.current?.stop();
    if (!isMetronomeOnly) {
      youtubeControlsRef.current?.pause();
    }
    setIsPlaying(false);
    setIsMetronomeOnly(false);
  }, [isMetronomeOnly]);

  const handleStop = useCallback(() => {
    metronomeControlsRef.current?.stop();
    if (!isMetronomeOnly) {
      youtubeControlsRef.current?.stop();
    }
    setIsPlaying(false);
    setIsMetronomeOnly(false);
  }, [isMetronomeOnly]);

  const handleBpmDetected = useCallback((bpm: number) => {
    metronomeControlsRef.current?.setBpm(bpm);
  }, []);

  // Keyboard shortcut: Space to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (isPlaying) {
          handlePause();
        } else {
          handlePlayTogether();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handlePause, handlePlayTogether]);

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <header className="text-center space-y-1 pb-2">
          <h1 className="text-2xl font-mono font-bold tracking-tight text-text-primary">
            DRUM METRONOME
          </h1>
          <p className="text-xs text-text-muted tracking-widest uppercase">
            YouTube + Metronome Sync
          </p>
        </header>

        {/* YouTube Player Section */}
        <YouTubePlayer
          youtubeRef={handleYoutubeRef}
          onStateChange={handleYoutubeStateChange}
          onVideoLoaded={handleVideoLoaded}
        />

        {/* BPM Search by Song Title */}
        <BPMSearch videoUrl={videoUrl} onBpmDetected={handleBpmDetected} />

        {/* Metronome and Tap BPM Section */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
          <MetronomeControl metronomeRef={handleMetronomeRef} />
          <TapBPM onBpmDetected={handleBpmDetected} />
        </div>

        {/* Sync Control Section */}
        <SyncControl
          isPlaying={isPlaying}
          isMetronomeOnly={isMetronomeOnly}
          onPlayTogether={handlePlayTogether}
          onMetronomeOnly={handleMetronomeOnly}
          onPause={handlePause}
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
    </div>
  );
}

export default App;
