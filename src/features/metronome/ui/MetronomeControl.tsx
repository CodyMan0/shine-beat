import { useMetronome } from '../model/useMetronome';
import { TimeSignature, TIME_SIGNATURE_BEATS, Subdivision } from '../model/metronome.types';

const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '6/8', '2/4'];
const SUBDIVISIONS: { value: Subdivision; label: string }[] = [
  { value: 1, label: '♩' },
  { value: 2, label: '♪' },
  { value: 4, label: '♬' },
];

interface MetronomeControlProps {
  metronomeRef?: (controls: {
    start: () => void;
    stop: () => void;
    toggle: () => void;
    isPlaying: boolean;
    setBpm: (bpm: number) => void;
  }) => void;
}

export function MetronomeControl({ metronomeRef }: MetronomeControlProps) {
  const { bpm, isPlaying, currentBeat, volume, timeSignature, subdivision, start, stop, toggle, setBpm, setVolume, setTimeSignature, setSubdivision } =
    useMetronome();

  // Expose controls to parent
  if (metronomeRef) {
    metronomeRef({ start, stop, toggle, isPlaying, setBpm });
  }

  const handleBpmChange = (value: number) => {
    const clampedValue = Math.max(30, Math.min(300, value));
    setBpm(clampedValue);
  };

  const incrementBpm = () => handleBpmChange(bpm + 1);
  const decrementBpm = () => handleBpmChange(bpm - 1);

  const beatsCount = TIME_SIGNATURE_BEATS[timeSignature];

  return (
    <div className="bg-surface rounded-xl border border-surface-border p-5">
      <div className="space-y-6">
        {/* Time Signature & Subdivision Selector */}
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5">
            {TIME_SIGNATURES.map((ts) => (
              <button
                key={ts}
                onClick={() => setTimeSignature(ts)}
                className={`px-2 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  timeSignature === ts
                    ? 'bg-accent text-black'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {ts}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-surface-border" />
          <div className="flex items-center gap-1.5">
            {SUBDIVISIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSubdivision(value)}
                className={`w-9 h-9 text-lg font-medium rounded-lg transition-colors ${
                  subdivision === value
                    ? 'bg-accent text-black'
                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* BPM Display and Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={decrementBpm}
            className="w-12 h-12 bg-surface border border-surface-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors text-xl font-semibold"
          >
            −
          </button>

          <div className="text-center">
            <input
              type="number"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              min="30"
              max="300"
              className="w-32 font-mono font-extrabold text-5xl sm:text-6xl text-accent text-center bg-transparent border-none focus:outline-none appearance-none"
            />
            <div className="text-xs text-text-muted font-mono mt-1">BPM</div>
          </div>

          <button
            onClick={incrementBpm}
            className="w-12 h-12 bg-surface border border-surface-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors text-xl font-semibold"
          >
            +
          </button>
        </div>

        {/* BPM Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="30"
            max="300"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Beat Indicator - dynamic based on time signature */}
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: beatsCount }, (_, beat) => (
            <div
              key={beat}
              className={`rounded-full transition-all ${
                beat === 0
                  ? `w-6 h-6 ${currentBeat === beat ? 'bg-accent shadow-[0_0_12px_rgba(251,191,36,0.6)] beat-active' : 'bg-surface-border'}`
                  : `w-4 h-4 ${currentBeat === beat ? 'bg-accent shadow-[0_0_8px_rgba(251,191,36,0.5)] beat-active' : 'bg-surface-border'}`
              }`}
            />
          ))}
        </div>

        {/* Volume Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-text-muted uppercase tracking-wider">Volume</label>
            <span className="text-sm text-text-primary font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
