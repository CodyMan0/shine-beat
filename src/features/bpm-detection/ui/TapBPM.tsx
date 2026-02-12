import { useState, useCallback, useRef, useEffect } from 'react';

interface TapBPMProps {
  onBpmDetected: (bpm: number) => void;
}

export function TapBPM({ onBpmDetected }: TapBPMProps) {
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const tapsRef = useRef<number[]>([]);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTaps = useCallback(() => {
    tapsRef.current = [];
    setTapCount(0);
    setDetectedBpm(null);
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapsRef.current.push(now);

    // Keep only the last 8 taps
    if (tapsRef.current.length > 8) {
      tapsRef.current.shift();
    }

    setTapCount(tapsRef.current.length);

    // Need at least 2 taps to calculate BPM
    if (tapsRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapsRef.current.length; i++) {
        intervals.push(tapsRef.current[i] - tapsRef.current[i - 1]);
      }

      // Calculate average interval in milliseconds
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

      // Convert to BPM (60000 ms per minute)
      const bpm = Math.round(60000 / avgInterval);

      setDetectedBpm(bpm);
      onBpmDetected(bpm);
    }

    // Clear existing reset timer
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    // Set new reset timer (2 seconds of no tapping)
    resetTimerRef.current = setTimeout(resetTaps, 2000);
  }, [onBpmDetected, resetTaps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-5">
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">Tap Tempo</h2>

      <div className="space-y-4">
        <button
          onClick={handleTap}
          className="w-full py-12 bg-surface border-2 border-surface-border text-text-primary rounded-xl hover:border-accent active:bg-accent active:text-black active:scale-95 transition-all text-2xl font-semibold"
        >
          Tap BPM
        </button>

        <div className="text-center space-y-2">
          {detectedBpm !== null ? (
            <>
              <div className="text-3xl font-mono font-bold text-accent">{detectedBpm}</div>
              <div className="text-xs text-text-muted">
                감지된 BPM ({tapCount} taps)
              </div>
            </>
          ) : (
            <div className="text-xs text-text-muted">
              박자에 맞춰 버튼을 탭하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
