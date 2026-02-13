declare module 'music-tempo' {
  class MusicTempo {
    tempo: number;
    beats: number[];
    constructor(audioData: Float32Array, params?: Record<string, unknown>);
  }
  export default MusicTempo;
}
