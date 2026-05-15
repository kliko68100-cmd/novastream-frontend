import axios from 'axios';
import type { TMDBAnime, Season, Episode, ResolvedSources, AniListMedia } from '@/types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: BASE,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

// Retry automatique sur timeout/503
api.interceptors.response.use(
  r => r,
  async err => {
    const config = err.config;
    if (!config || config._retried) return Promise.reject(err);
    const status = err.response?.status;
    if (status === 503 || err.code === 'ECONNABORTED') {
      config._retried = true;
      await sleep(1500);
      return api(config);
    }
    return Promise.reject(err);
  }
);

// ── Catalog ───────────────────────────────────────────────────────

export const catalog = {
  trending:    (page = 1) => api.get('/trending', { params: { page } }).then(r => r.data),
  popular:     (page = 1) => api.get('/anime/popular', { params: { page } }).then(r => r.data),
  topRated:    (page = 1) => api.get('/anime/toprated', { params: { page } }).then(r => r.data),
  onAir:       (page = 1) => api.get('/anime/onair', { params: { page } }).then(r => r.data),

  details: (id: number): Promise<TMDBAnime> =>
    api.get(`/anime/details/${id}`).then(r => r.data),

  season: (showId: number, season: number): Promise<Season> =>
    api.get(`/anime/season/${showId}/${season}`).then(r => r.data),

  episode: (showId: number, season: number, ep: number): Promise<Episode> =>
    api.get(`/anime/episode/${showId}/${season}/${ep}`).then(r => r.data),

  search: (q: string, page = 1) =>
    api.get('/search', { params: { q, page } }).then(r => r.data),

  discover: (params: Record<string, any>) =>
    api.get('/discover', { params }).then(r => r.data),

  genres: () =>
    api.get('/genres').then(r => r.data),

  recommendations: (id: number) =>
    api.get(`/anime/details/${id}`).then(r => r.data.recommendations ?? []),
};

// ── AniList ───────────────────────────────────────────────────────

export const anilistApi = {
  trending: (page = 1) =>
    api.get('/anilist/trending', { params: { page } }).then(r => r.data),

  seasonal: (year?: number, season?: string, page = 1) =>
    api.get('/anilist/seasonal', { params: { year, season, page } }).then(r => r.data),

  media: (id: number): Promise<AniListMedia> =>
    api.get(`/anilist/${id}`).then(r => r.data),

  byMal: (malId: number): Promise<AniListMedia> =>
    api.get(`/anilist/mal/${malId}`).then(r => r.data),

  search: (q: string, page = 1) =>
    api.get('/anilist/search', { params: { q, page } }).then(r => r.data),

  skipTimes: (malId: number, episode: number, episodeLength?: number) =>
    api.get(`/skiptimes/${malId}/${episode}`, { params: { episodeLength } }).then(r => r.data),
};

// ── Sources ───────────────────────────────────────────────────────

export const sources = {
  resolve: (params: {
    tmdbId: number;
    episode?: number;
    season?: number;
    lang?: 'vf' | 'vostfr' | 'vo';
    provider?: string;
    episodeLength?: number;
    title?: string;
  }): Promise<ResolvedSources> =>
    api.get('/sources', { params, timeout: 30_000 }).then(r => r.data),

  episodes: (tmdbId: number, provider = 'HiAnime') =>
    api.get('/sources/episodes', { params: { tmdbId, provider } }).then(r => r.data),

  mapping: (tmdbId: number) =>
    api.get('/sources/mapping', { params: { tmdbId } }).then(r => r.data),
};

// ── Proxy ─────────────────────────────────────────────────────────

export const proxy = {
  m3u8Url: (originalUrl: string, referer?: string): string => {
    const encoded = btoa(originalUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return `${BASE}/proxy/m3u8?url=${encoded}${referer ? `&ref=${encodeURIComponent(referer)}` : ''}`;
  },

  subtitleUrl: (originalUrl: string): string =>
    `${BASE}/proxy/subtitle?url=${encodeURIComponent(originalUrl)}`,
};

// ── Sync AniList ──────────────────────────────────────────────────

export const sync = {
  exchangeToken: (code: string, redirectUri: string) =>
    api.post('/sync/anilist/token', { code, redirectUri }).then(r => r.data),

  user: (token: string) =>
    api.get('/sync/anilist/user', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),

  list: (userId: number, status: string, token?: string) =>
    api.get(`/sync/anilist/list/${status}`, {
      params: { userId },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(r => r.data),

  updateEntry: (data: { mediaId: number; status: string; progress: number; score?: number }, token: string) =>
    api.put('/sync/anilist/entry', data, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.data),
};

// ── Image helpers ─────────────────────────────────────────────────

export const img = {
  poster:   (path: string | null, size: 'w185' | 'w342' | 'w500' | 'w780' = 'w500') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,

  backdrop: (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,

  still:    (path: string | null, size: 'w92' | 'w185' | 'w300' = 'w300') =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : null,

  anilist:  (url: string | null | undefined) => url ?? null,
};

// ── Utils ─────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export function formatScore(score: number | undefined): string {
  if (!score) return 'N/A';
  return (score / 10).toFixed(1);
}

export function formatDate(date: string | undefined): string {
  if (!date) return 'Inconnu';
  return new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: 'long' }).format(new Date(date));
}

export function formatDuration(minutes: number | undefined): string {
  if (!minutes) return '';
  return `${minutes} min`;
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    RELEASING: 'En cours',
    FINISHED: 'Terminé',
    NOT_YET_RELEASED: 'À venir',
    CANCELLED: 'Annulé',
    HIATUS: 'En pause',
    'Returning Series': 'En cours',
    'Ended': 'Terminé',
    'In Production': 'En production',
  };
  return map[status] ?? status;
}

// ── Manga ─────────────────────────────────────────────────────────

export const manga = {
  popular:  (page = 1) => api.get('/manga/popular',  { params: { page } }).then(r => r.data),
  latest:   (page = 1) => api.get('/manga/latest',   { params: { page } }).then(r => r.data),
  search:   (q: string, page = 1) => api.get('/manga/search', { params: { q, page } }).then(r => r.data),
  details:  (id: string) => api.get(`/manga/${id}`).then(r => r.data),
  chapters: (id: string, page = 1) => api.get(`/manga/${id}/chapters`, { params: { page } }).then(r => r.data),
  pages:    (chapterId: string) => api.get(`/manga/chapter/${chapterId}/pages`).then(r => r.data),
};
