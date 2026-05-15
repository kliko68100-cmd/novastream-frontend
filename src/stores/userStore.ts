import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchProgress, WatchlistItem, AniListUser, Lang, ToastMessage } from '@/types';

interface UserStore {
  // Préférences
  defaultLang:   Lang;
  autoNext:      boolean;
  autoSkipIntro: boolean;
  volume:        number;

  // Auth AniList
  anilistToken:  string | null;
  anilistUser:   AniListUser | null;

  // Watchlist
  watchlist:     WatchlistItem[];

  // Historique
  history:       WatchProgress[];

  // Toasts
  toasts:        ToastMessage[];

  // Actions
  setLang:       (lang: Lang) => void;
  setAutoNext:   (v: boolean) => void;
  setAutoSkip:   (v: boolean) => void;
  setVolume:     (v: number) => void;
  setAnilistAuth:(token: string, user: AniListUser) => void;
  logoutAnilist: () => void;

  addToWatchlist:     (item: WatchlistItem) => void;
  removeFromWatchlist:(tmdbId: number) => void;
  isInWatchlist:      (tmdbId: number) => boolean;

  saveProgress:   (p: WatchProgress) => void;
  getProgress:    (tmdbId: number, episode: number, season: number) => WatchProgress | undefined;
  clearProgress:  (tmdbId: number) => void;
  getContinueWatching: () => WatchProgress[];

  addToast:    (t: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // ── Defaults ─────────────────────────────────────────────────
      defaultLang:   'vostfr',
      autoNext:      true,
      autoSkipIntro: true,
      volume:        80,

      anilistToken:  null,
      anilistUser:   null,

      watchlist:     [],
      history:       [],
      toasts:        [],

      // ── Préférences ───────────────────────────────────────────────
      setLang:     (lang)   => set({ defaultLang: lang }),
      setAutoNext: (v)      => set({ autoNext: v }),
      setAutoSkip: (v)      => set({ autoSkipIntro: v }),
      setVolume:   (volume) => set({ volume }),

      // ── AniList auth ──────────────────────────────────────────────
      setAnilistAuth: (token, user) => set({ anilistToken: token, anilistUser: user }),
      logoutAnilist:  () => set({ anilistToken: null, anilistUser: null }),

      // ── Watchlist ─────────────────────────────────────────────────
      addToWatchlist: (item) =>
        set(s => {
          if (s.watchlist.some(w => w.tmdbId === item.tmdbId)) return s;
          return { watchlist: [{ ...item, addedAt: Date.now() }, ...s.watchlist] };
        }),

      removeFromWatchlist: (tmdbId) =>
        set(s => ({ watchlist: s.watchlist.filter(w => w.tmdbId !== tmdbId) })),

      isInWatchlist: (tmdbId) => get().watchlist.some(w => w.tmdbId === tmdbId),

      // ── Historique / progression ──────────────────────────────────
      saveProgress: (p) =>
        set(s => {
          const key = (x: WatchProgress) => x.tmdbId === p.tmdbId && x.episode === p.episode && x.season === p.season;
          const rest = s.history.filter(h => !key(h));
          // Garde max 100 entrées
          return { history: [{ ...p, updatedAt: Date.now() }, ...rest].slice(0, 100) };
        }),

      getProgress: (tmdbId, episode, season) =>
        get().history.find(h => h.tmdbId === tmdbId && h.episode === episode && h.season === season),

      clearProgress: (tmdbId) =>
        set(s => ({ history: s.history.filter(h => h.tmdbId !== tmdbId) })),

      getContinueWatching: () => {
        const history = get().history;
        // Déduplique par tmdbId (garde le plus récent), filtre les finis (>90%)
        const seen = new Set<number>();
        return history
          .filter(h => h.progress < 90 && h.progress > 0)
          .filter(h => { if (seen.has(h.tmdbId)) return false; seen.add(h.tmdbId); return true; })
          .slice(0, 12);
      },

      // ── Toasts ───────────────────────────────────────────────────
      addToast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set(s => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => get().removeToast(id), t.duration ?? 4000);
      },

      removeToast: (id) =>
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    }),
    {
      name: 'novastream-user-v4',
      partialize: (s) => ({
        defaultLang:   s.defaultLang,
        autoNext:      s.autoNext,
        autoSkipIntro: s.autoSkipIntro,
        volume:        s.volume,
        anilistToken:  s.anilistToken,
        anilistUser:   s.anilistUser,
        watchlist:     s.watchlist,
        history:       s.history,
      }),
    }
  )
);
