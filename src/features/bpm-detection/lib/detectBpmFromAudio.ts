import MusicTempo from 'music-tempo';

export interface BpmResult {
  bpm: number;
  confidence: number;
}

/**
 * Detect BPM from an audio ArrayBuffer using OfflineAudioContext + music-tempo.
 * Returns BPM clamped to 30-300 range with confidence score.
 */
export async function detectBpmFromAudio(audioData: ArrayBuffer): Promise<BpmResult> {
  // Decode audio data
  const audioContext = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await audioContext.decodeAudioData(audioData);

  // Resample to mono 44100Hz for consistent analysis
  const duration = Math.min(audioBuffer.duration, 30); // Max 30 seconds
  const sampleRate = 44100;
  const offlineCtx = new OfflineAudioContext(1, duration * sampleRate, sampleRate);

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const channelData = renderedBuffer.getChannelData(0);

  // Use music-tempo for BPM detection
  const mt = new MusicTempo(channelData);
  let bpm = Math.round(mt.tempo);
  const beats: number[] = mt.beats;

  // Calculate confidence based on beat consistency
  let confidence = 0.85; // Default confidence
  if (beats.length >= 4) {
    const intervals: number[] = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i] - beats[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, iv) => sum + Math.pow(iv - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const coeffOfVariation = stdDev / avgInterval;

    // Lower variation = higher confidence
    confidence = Math.max(0.5, Math.min(0.99, 1 - coeffOfVariation));
  }

  // Clamp BPM to reasonable range
  if (bpm > 200) {
    // Try halving - many songs detected at double tempo
    const halved = Math.round(bpm / 2);
    if (halved >= 60 && halved <= 180) {
      bpm = halved;
      confidence *= 0.9; // Slightly lower confidence for halved BPM
    }
  }

  bpm = Math.max(30, Math.min(300, bpm));

  return {
    bpm,
    confidence: Math.round(confidence * 100) / 100,
  };
}
