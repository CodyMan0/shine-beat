// YouTube IFrame API type definitions
// Reference: https://developers.google.com/youtube/iframe_api_reference

export enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

export interface YouTubePlayer {
  loadVideoById(videoId: string, startSeconds?: number): void;
  cueVideoById(videoId: string, startSeconds?: number): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): PlayerState;
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
}

export interface PlayerOptions {
  height?: string | number;
  width?: string | number;
  videoId?: string;
  playerVars?: PlayerVars;
  events?: PlayerEvents;
}

export interface PlayerVars {
  autoplay?: 0 | 1;
  cc_lang_pref?: string;
  cc_load_policy?: 1;
  color?: 'red' | 'white';
  controls?: 0 | 1;
  disablekb?: 0 | 1;
  enablejsapi?: 0 | 1;
  end?: number;
  fs?: 0 | 1;
  hl?: string;
  iv_load_policy?: 1 | 3;
  list?: string;
  listType?: 'playlist' | 'search' | 'user_uploads';
  loop?: 0 | 1;
  modestbranding?: 1;
  origin?: string;
  playlist?: string;
  playsinline?: 0 | 1;
  rel?: 0 | 1;
  start?: number;
  widget_referrer?: string;
}

export interface PlayerEvents {
  onReady?: (event: PlayerEvent) => void;
  onStateChange?: (event: PlayerEvent) => void;
  onPlaybackQualityChange?: (event: PlayerEvent) => void;
  onPlaybackRateChange?: (event: PlayerEvent) => void;
  onError?: (event: PlayerEvent) => void;
  onApiChange?: (event: PlayerEvent) => void;
}

export interface PlayerEvent {
  target: YouTubePlayer;
  data: number;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: PlayerOptions
      ) => YouTubePlayer;
      PlayerState: typeof PlayerState;
      loaded: number;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
