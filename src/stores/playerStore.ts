import { create } from 'zustand';
import type { ResolvedSources, Lang } from '@/types';

interface PlayerStore {
  // Contexte
  tmdbId:      number | null;
  season:      number;
  episode:     number;
  totalEps:    number;
  lang:        Lang;
  provider:    string;

  // Sources
  sources:     ResolvedSources | null;
  loading:     boolean;
  error:       string | null;

  // État playback
  currentTime: number;
  duration:    number;
  paused:      boolean;
  volume:      number;
  muted:       boolean;
  fullscreen:  boolean;

  // Features
  showControls:    boolean;
  showSkipIntro:   boolean;
  showNextEpisode: boolean;
  nextEpisodeCountdown: number;

  // Actions
  setContext:    (tmdbId: number, season: number, episode: number, totalEps: number) => void;
  setSources:    (s: ResolvedSources | null) => void;
  setLoading:    (v: boolean) => void;
  setError:      (e: string | null) => void;
  setLang:       (l: Lang) => void;
  setProvider:   (p: string) => void;

  setCurrentTime: (t: number) => void;
  setDuration:    (d: number) => void;
  setPaused:      (v: boolean) => void;
  setVolume:      (v: number) => void;
  setMuted:       (v: boolean) => void;
  setFullscreen:  (v: boolean) => void;

  setShowControls:      (v: boolean) => void;
  setShowSkipIntro:     (v: boolean) => void;
  setShowNextEpisode:   (v: boolean) => void;
  setNextEpisodeCountdown: (n: number) => void;

  nextEpisode: () => void;
  prevEpisode: () => void;
  reset:       () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  tmdbId:      null,
  season:      1,
  episode:     1,
  totalEps:    0,
  lang:        'vostfr',
  provider:    'HiAnime',

  sources:     null,
  loading:     false,
  error:       null,

  currentTime: 0,
  duration:    0,
  paused:      true,
  volume:      80,
  muted:       false,
  fullscreen:  false,

  showControls:        true,
  showSkipIntro:       false,
  showNextEpisode:     false,
  nextEpisodeCountdown: 5,

  setContext:   (tmdbId, season, episode, totalEps) => set({ tmdbId, season, episode, totalEps }),
  setSources:   (sources) => set({ sources }),
  setLoading:   (loading) => set({ loading }),
  setError:     (error)   => set({ error }),
  setLang:      (lang)    => set({ lang }),
  setProvider:  (provider) => set({ provider }),

  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration:    (duration)    => set({ duration }),
  setPaused:      (paused)      => set({ paused }),
  setVolume:      (volume)      => set({ volume }),
  setMuted:       (muted)       => set({ muted }),
  setFullscreen:  (fullscreen)  => set({ fullscreen }),

  setShowControls:         (v) => set({ showControls: v }),
  setShowSkipIntro:        (v) => set({ showSkipIntro: v }),
  setShowNextEpisode:      (v) => set({ showNextEpisode: v }),
  setNextEpisodeCountdown: (n) => set({ nextEpisodeCountdown: n }),

  nextEpisode: () => {
    const { episode, totalEps } = get();
    if (episode < totalEps) set({ episode: episode + 1, sources: null });
  },

  prevEpisode: () => {
    const { episode } = get();
    if (episode > 1) set({ episode: episode - 1, sources: null });
  },

  reset: () => set({
    sources: null, loading: false, error: null,
    currentTime: 0, duration: 0, paused: true,
    showSkipIntro: false, showNextEpisode: false,
  }),
}));
