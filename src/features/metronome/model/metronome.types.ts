export type TimeSignature = '4/4' | '3/4' | '6/8' | '2/4';

// Subdivision: 1 = quarter, 2 = eighth, 4 = sixteenth
export type Subdivision = 1 | 2 | 4;

export const TIME_SIGNATURE_BEATS: Record<TimeSignature, number> = {
  '4/4': 4,
  '3/4': 3,
  '6/8': 6,
  '2/4': 2,
};

export interface MetronomeState {
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  volume: number;
  timeSignature: TimeSignature;
  subdivision: Subdivision;
}

export interface MetronomeControls {
  start: () => void;
  stop: () => void;
  toggle: () => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  setTimeSignature: (ts: TimeSignature) => void;
  setSubdivision: (sub: Subdivision) => void;
}

export interface UseMetronomeReturn extends MetronomeState, MetronomeControls {}

export const METRONOME_CONSTANTS = {
  MIN_BPM: 30,
  MAX_BPM: 300,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
  SCHEDULE_AHEAD_TIME: 0.1,
  SCHEDULER_INTERVAL: 25,
  // Beat 1: high pitch, loud, longer
  ACCENT_FREQ: 1500,
  ACCENT_DURATION: 0.08,
  ACCENT_VOLUME: 1.0,
  // Other beats: lower pitch, softer, shorter
  NORMAL_FREQ: 800,
  NORMAL_DURATION: 0.04,
  NORMAL_VOLUME: 0.5,
} as const;
