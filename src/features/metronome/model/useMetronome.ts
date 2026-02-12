import { useState, useRef, useCallback, useEffect } from 'react';
import {
  UseMetronomeReturn,
  METRONOME_CONSTANTS,
  TimeSignature,
  TIME_SIGNATURE_BEATS,
  Subdivision,
} from './metronome.types';

const {
  MIN_BPM,
  MAX_BPM,
  MIN_VOLUME,
  MAX_VOLUME,
  SCHEDULE_AHEAD_TIME,
  SCHEDULER_INTERVAL,
} = METRONOME_CONSTANTS;

// Volume boost: master gain multiplier so 100% is loud enough
const VOLUME_BOOST = 3.0;

export const useMetronome = (): UseMetronomeReturn => {
  const [bpm, setBpmState] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.5);
  const [timeSignature, setTimeSignatureState] = useState<TimeSignature>('4/4');
  const [subdivision, setSubdivisionState] = useState<Subdivision>(1);

  // Refs for Web Audio API and scheduling
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentSubBeatRef = useRef<number>(0); // tracks sub-beats (total = beats * subdivision)
  const schedulerIdRef = useRef<number | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timeSignatureRef = useRef<TimeSignature>('4/4');
  const bpmRef = useRef<number>(120);
  const subdivisionRef = useRef<Subdivision>(1);
  const schedulerFnRef = useRef<(() => void) | null>(null);

  // Initialize AudioContext eagerly on first user interaction
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();

      // Create gain node for volume control (boosted so 100% is loud)
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = volume * VOLUME_BOOST;
    }
    return audioContextRef.current;
  }, [volume]);

  // Pre-warm AudioContext on first click anywhere (avoids cold start on play)
  useEffect(() => {
    const warmUp = () => {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      document.removeEventListener('pointerdown', warmUp);
    };
    document.addEventListener('pointerdown', warmUp);
    return () => document.removeEventListener('pointerdown', warmUp);
  }, [getAudioContext]);

  // Calculate seconds per beat (reads from ref for real-time updates)
  const getSecondPerBeat = useCallback((): number => {
    return 60.0 / bpmRef.current;
  }, []);

  // Schedule a single beep note
  // subBeat is the index within total sub-beats (beats * subdivision)
  const scheduleNote = useCallback(
    (subBeat: number, time: number) => {
      const ctx = getAudioContext();
      const masterGain = gainNodeRef.current;

      if (!masterGain) return;

      const sub = subdivisionRef.current;
      const isMainBeat = subBeat % sub === 0;
      const mainBeatIndex = Math.floor(subBeat / sub);
      const isAccent = subBeat === 0;

      let freq: number;
      let duration: number;
      let noteVol: number;

      if (isAccent) {
        // Beat 1: highest pitch, loudest
        freq = 1500;
        duration = 0.06;
        noteVol = 1.0;
      } else if (isMainBeat) {
        // Other main beats: medium
        freq = 800;
        duration = 0.03;
        noteVol = 0.4;
      } else {
        // Sub-beats (8th, 16th): softest, shortest
        freq = 1200;
        duration = 0.02;
        noteVol = 0.2;
      }

      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.frequency.value = freq;
      osc.type = 'sine';

      // Connect: oscillator -> noteGain -> masterGain -> destination
      osc.connect(noteGain);
      noteGain.connect(masterGain);

      // Envelope: sharp attack, quick decay
      noteGain.gain.setValueAtTime(noteVol, time);
      noteGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.start(time);
      osc.stop(time + duration);

      // Update visual beat indicator only on main beats
      if (isMainBeat) {
        const updateDelay = (time - ctx.currentTime) * 1000;
        if (updateDelay >= 0) {
          setTimeout(() => {
            setCurrentBeat(mainBeatIndex);
          }, updateDelay);
        }
      }
    },
    [getAudioContext]
  );

  // Scheduler function - look ahead and schedule notes
  // Stored in ref so setInterval always calls the latest version
  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    const currentTime = ctx.currentTime;

    // Schedule all notes that need to play before next interval
    while (nextNoteTimeRef.current < currentTime + SCHEDULE_AHEAD_TIME) {
      scheduleNote(currentSubBeatRef.current, nextNoteTimeRef.current);

      // Advance to next sub-beat (reads from refs for real-time updates)
      const sub = subdivisionRef.current;
      const totalSubBeats = TIME_SIGNATURE_BEATS[timeSignatureRef.current] * sub;
      const secondsPerSubBeat = getSecondPerBeat() / sub;
      nextNoteTimeRef.current += secondsPerSubBeat;
      currentSubBeatRef.current = (currentSubBeatRef.current + 1) % totalSubBeats;
    }
  }, [getAudioContext, scheduleNote, getSecondPerBeat]);

  // Keep schedulerFnRef in sync with latest scheduler
  schedulerFnRef.current = scheduler;

  // Start the metronome
  const start = useCallback(() => {
    if (isPlaying) return;

    const ctx = getAudioContext();
    // Ensure AudioContext is running (may be suspended)
    if (ctx.state === 'suspended') ctx.resume();

    // Reset to beat 0 and schedule first note immediately (no offset)
    currentSubBeatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime;

    setIsPlaying(true);
    setCurrentBeat(0);

    // Run scheduler immediately for first note, then on interval
    schedulerFnRef.current?.();
    schedulerIdRef.current = window.setInterval(() => {
      schedulerFnRef.current?.();
    }, SCHEDULER_INTERVAL);
  }, [isPlaying, getAudioContext]);

  // Stop the metronome
  const stop = useCallback(() => {
    if (!isPlaying) return;

    setIsPlaying(false);
    setCurrentBeat(0);

    // Clear scheduler
    if (schedulerIdRef.current !== null) {
      clearInterval(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }
  }, [isPlaying]);

  // Toggle play/stop
  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  // Set BPM with validation (updates ref for real-time scheduler access)
  const setBpm = useCallback(
    (newBpm: number) => {
      const clampedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
      bpmRef.current = clampedBpm;
      setBpmState(clampedBpm);
    },
    []
  );

  // Set volume with validation
  const setVolume = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(MIN_VOLUME, Math.min(MAX_VOLUME, newVolume));
      setVolumeState(clampedVolume);

      // Update gain node if it exists (apply boost)
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = clampedVolume * VOLUME_BOOST;
      }
    },
    []
  );

  // Set time signature with validation
  const setTimeSignature = useCallback(
    (newTimeSignature: TimeSignature) => {
      setTimeSignatureState(newTimeSignature);
      timeSignatureRef.current = newTimeSignature;

      // Reset beat to 0 if playing
      if (isPlaying) {
        currentSubBeatRef.current = 0;
        setCurrentBeat(0);
      }
    },
    [isPlaying]
  );

  // Set subdivision
  const setSubdivision = useCallback(
    (newSubdivision: Subdivision) => {
      setSubdivisionState(newSubdivision);
      subdivisionRef.current = newSubdivision;

      if (isPlaying) {
        currentSubBeatRef.current = 0;
        setCurrentBeat(0);
      }
    },
    [isPlaying]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop scheduler
      if (schedulerIdRef.current !== null) {
        clearInterval(schedulerIdRef.current);
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    bpm,
    isPlaying,
    currentBeat,
    volume,
    timeSignature,
    subdivision,
    start,
    stop,
    toggle,
    setBpm,
    setVolume,
    setTimeSignature,
    setSubdivision,
  };
};
