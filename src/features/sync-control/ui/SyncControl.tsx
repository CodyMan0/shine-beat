interface SyncControlProps {
  isPlaying: boolean;
  onToggle: () => void;
  onStop: () => void;
}

export function SyncControl({
  isPlaying,
  onToggle,
  onStop,
}: SyncControlProps) {
  return (
    <div className="bg-surface rounded-xl border border-surface-border p-5">
      <div className="flex items-center gap-3">
        {/* Main Toggle Button */}
        <button
          onClick={onToggle}
          className={`flex-1 py-3 sm:py-4 font-bold rounded-lg transition-all text-base sm:text-lg ${
            isPlaying
              ? 'bg-surface border border-accent text-accent hover:bg-surface-hover'
              : 'bg-accent text-black hover:brightness-110'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPlaying ? 'bg-accent' : 'bg-black/30'
              }`}
              style={
                isPlaying
                  ? {
                      boxShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                      animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    }
                  : undefined
              }
            />
            {isPlaying ? '일시정지' : '메트로놈 실행'}
          </span>
        </button>

        {/* Stop Button */}
        {isPlaying && (
          <button
            onClick={onStop}
            className="py-3 sm:py-4 px-4 sm:px-5 bg-surface border border-surface-border text-text-secondary rounded-lg hover:bg-surface-hover hover:text-text-primary transition-all font-medium"
          >
            정지
          </button>
        )}
      </div>
    </div>
  );
}
