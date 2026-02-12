import { useState, useCallback, useRef, useEffect } from 'react';

interface TapBPMProps {
  onBpmDetected: (bpm: number) => void;
}

export function TapBPM({ onBpmDetected }: TapBPMProps) {
  const [detectedBpm, setDetectedBpm] = useState<number | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [isTapping, setIsTapping] = useState(false);
  const tapsRef = useRef<number[]>([]);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTaps = useCallback(() => {
    tapsRef.current = [];
    setTapCount(0);
    setDetectedBpm(null);
    setIsTapping(false);
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapsRef.current.push(now);
    setIsTapping(true);

    if (tapsRef.current.length > 8) {
      tapsRef.current.shift();
    }

    setTapCount(tapsRef.current.length);

    if (tapsRef.current.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < tapsRef.current.length; i++) {
        intervals.push(tapsRef.current[i] - tapsRef.current[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      setDetectedBpm(bpm);
      onBpmDetected(bpm);
    }

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = setTimeout(resetTaps, 2000);
  }, [onBpmDetected, resetTaps]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-3 flex items-center gap-3">
      <button
        onClick={handleTap}
        className="shrink-0 w-14 h-14 rounded-xl border-2 border-surface-border text-text-secondary font-mono text-xs font-bold uppercase tracking-wider hover:border-accent active:bg-accent active:text-black active:scale-90 transition-all select-none"
      >
        TAP
      </button>
      <div className="flex-1 min-w-0">
        {detectedBpm !== null ? (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-accent">{detectedBpm}</span>
            <span className="text-[11px] text-text-muted">BPM</span>
            <span className="text-[10px] text-text-muted ml-auto">{tapCount} taps</span>
          </div>
        ) : (
          <span className="text-xs text-text-muted">
            {isTapping ? '계속 탭하세요...' : '박자에 맞춰 탭'}
          </span>
        )}
      </div>
    </div>
  );
}
