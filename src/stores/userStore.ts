import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchProgress, WatchlistItem, MangaProgress, AniListUser, Lang, Theme, AccentColor, ToastMessage } from '@/types';

interface UserStore {
  // Préférences
  defaultLang:   Lang;
  autoNext:      boolean;
  autoSkipIntro: boolean;
  volume:        number;
  theme:         Theme;
  accentColor:   AccentColor;

  // Auth AniList
  anilistToken:  string | null;
  anilistUser:   AniListUser | null;

  // Watchlist anime
  watchlist:     WatchlistItem[];

  // Historique anime
  history:       WatchProgress[];

  // Progression manga
  mangaProgress: MangaProgress[];
  mangaBookmarks: string[]; // IDs des mangas en marque-page

  // Toasts
  toasts: ToastMessage[];

  // Actions préférences
  setLang:        (lang: Lang) => void;
  setAutoNext:    (v: boolean) => void;
  setAutoSkip:    (v: boolean) => void;
  setVolume:      (v: number) => void;
  setTheme:       (t: Theme) => void;
  setAccentColor: (c: AccentColor) => void;

  // AniList
  setAnilistAuth: (token: string, user: AniListUser) => void;
  logoutAnilist:  () => void;

  // Watchlist
  addToWatchlist:      (item: WatchlistItem) => void;
  removeFromWatchlist: (tmdbId: number) => void;
  isInWatchlist:       (tmdbId: number) => boolean;

  // Historique
  saveProgress:        (p: WatchProgress) => void;
  getProgress:         (tmdbId: number, episode: number, season: number) => WatchProgress | undefined;
  getAnimeProgress:    (tmdbId: number) => WatchProgress | undefined;
  clearProgress:       (tmdbId: number) => void;
  getContinueWatching: () => WatchProgress[];

  // Stats
  getStats: () => { totalMinutes: number; totalEpisodes: number; totalAnime: number; totalMangaChapters: number };

  // Manga
  saveMangaProgress:   (p: MangaProgress) => void;
  getMangaProgress:    (mangaId: string) => MangaProgress | undefined;
  toggleMangaBookmark: (mangaId: string) => void;
  isMangaBookmarked:   (mangaId: string) => boolean;

  // Toasts
  addToast:    (t: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      defaultLang:    'vostfr',
      autoNext:       true,
      autoSkipIntro:  true,
      volume:         80,
      theme:          'dark',
      accentColor:    'red',
      anilistToken:   null,
      anilistUser:    null,
      watchlist:      [],
      history:        [],
      mangaProgress:  [],
      mangaBookmarks: [],
      toasts:         [],

      setLang:        (lang)    => set({ defaultLang: lang }),
      setAutoNext:    (v)       => set({ autoNext: v }),
      setAutoSkip:    (v)       => set({ autoSkipIntro: v }),
      setVolume:      (volume)  => set({ volume }),
      setTheme:       (theme)   => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),

      setAnilistAuth: (token, user) => set({ anilistToken: token, anilistUser: user }),
      logoutAnilist:  () => set({ anilistToken: null, anilistUser: null }),

      addToWatchlist: (item) =>
        set(s => {
          if (s.watchlist.some(w => w.tmdbId === item.tmdbId)) return s;
          return { watchlist: [{ ...item, addedAt: Date.now() }, ...s.watchlist] };
        }),
      removeFromWatchlist: (tmdbId) =>
        set(s => ({ watchlist: s.watchlist.filter(w => w.tmdbId !== tmdbId) })),
      isInWatchlist: (tmdbId) => get().watchlist.some(w => w.tmdbId === tmdbId),

      saveProgress: (p) =>
        set(s => {
          const same = (x: WatchProgress) => x.tmdbId === p.tmdbId && x.episode === p.episode && x.season === p.season;
          return { history: [{ ...p, updatedAt: Date.now() }, ...s.history.filter(h => !same(h))].slice(0, 200) };
        }),
      getProgress: (tmdbId, episode, season) =>
        get().history.find(h => h.tmdbId === tmdbId && h.episode === episode && h.season === season),
      getAnimeProgress: (tmdbId) =>
        get().history.find(h => h.tmdbId === tmdbId),
      clearProgress: (tmdbId) =>
        set(s => ({ history: s.history.filter(h => h.tmdbId !== tmdbId) })),
      getContinueWatching: () => {
        const seen = new Set<number>();
        return get().history
          .filter(h => h.progress > 2 && h.progress < 92)
          .filter(h => { if (seen.has(h.tmdbId)) return false; seen.add(h.tmdbId); return true; })
          .slice(0, 12);
      },

      getStats: () => {
        const h = get().history;
        const totalMinutes = Math.round(h.reduce((acc, x) => acc + (x.time / 60), 0));
        const totalEpisodes = h.length;
        const totalAnime = new Set(h.map(x => x.tmdbId)).size;
        const totalMangaChapters = get().mangaProgress.length;
        return { totalMinutes, totalEpisodes, totalAnime, totalMangaChapters };
      },

      saveMangaProgress: (p) =>
        set(s => ({
          mangaProgress: [
            { ...p, updatedAt: Date.now() },
            ...s.mangaProgress.filter(x => x.mangaId !== p.mangaId),
          ].slice(0, 200),
        })),
      getMangaProgress: (mangaId) =>
        get().mangaProgress.find(p => p.mangaId === mangaId),
      toggleMangaBookmark: (mangaId) =>
        set(s => ({
          mangaBookmarks: s.mangaBookmarks.includes(mangaId)
            ? s.mangaBookmarks.filter(id => id !== mangaId)
            : [mangaId, ...s.mangaBookmarks],
        })),
      isMangaBookmarked: (mangaId) =>
        get().mangaBookmarks.includes(mangaId),

      addToast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set(s => ({ toasts: [...s.toasts, { ...t, id }] }));
        setTimeout(() => get().removeToast(id), t.duration ?? 4000);
      },
      removeToast: (id) =>
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
    }),
    {
      name: 'novastream-user-v5',
      partialize: (s) => ({
        defaultLang: s.defaultLang, autoNext: s.autoNext,
        autoSkipIntro: s.autoSkipIntro, volume: s.volume,
        theme: s.theme, accentColor: s.accentColor,
        anilistToken: s.anilistToken, anilistUser: s.anilistUser,
        watchlist: s.watchlist, history: s.history,
        mangaProgress: s.mangaProgress, mangaBookmarks: s.mangaBookmarks,
      }),
    }
  )
);
