interface SyncControlProps {
  isPlaying: boolean;
  isMetronomeOnly: boolean;
  onPlayTogether: () => void;
  onMetronomeOnly: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function SyncControl({
  isPlaying,
  isMetronomeOnly,
  onPlayTogether,
  onMetronomeOnly,
  onPause,
  onStop,
}: SyncControlProps) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-5">
      <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-4">동기화 제어</h2>

      <div className="space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isPlaying ? 'bg-accent' : 'bg-text-muted'
            }`}
            style={
              isPlaying
                ? {
                    boxShadow: '0 0 12px rgba(251, 191, 36, 0.6)',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }
                : undefined
            }
          />
          <span className="text-sm font-medium text-text-primary">
            {isPlaying
              ? isMetronomeOnly
                ? '메트로놈만 재생 중'
                : '재생 중'
              : '정지됨'}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPlayTogether}
            disabled={isPlaying}
            className="py-4 bg-accent text-black font-bold rounded-lg hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-lg"
          >
            함께 재생
          </button>

          <button
            onClick={onMetronomeOnly}
            disabled={isPlaying}
            className="py-4 bg-surface border border-accent text-accent font-bold rounded-lg hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all text-lg"
          >
            메트로놈만
          </button>

          <button
            onClick={onPause}
            disabled={!isPlaying}
            className="py-3 bg-surface border border-surface-border text-text-primary rounded-lg hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            일시정지
          </button>

          <button
            onClick={onStop}
            disabled={!isPlaying}
            className="py-3 bg-surface border border-surface-border text-text-primary rounded-lg hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
          >
            정지
          </button>
        </div>
      </div>
    </div>
  );
}
