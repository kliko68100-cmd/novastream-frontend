// ── TMDB Types ────────────────────────────────────────────────────

export interface TMDBAnime {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  number_of_episodes?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  external_ids?: { mal_id?: number; tvdb_id?: number; imdb_id?: string };
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  similar?: { results: TMDBAnime[] };
  recommendations?: TMDBAnime[];
  seasons?: Season[];
  networks?: { id: number; name: string; logo_path: string }[];
}

export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
  runtime: number | null;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface Video {
  key: string;
  site: string;
  type: string;
  name: string;
}

// ── AniList Types ─────────────────────────────────────────────────

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    romaji: string;
    english?: string;
    native: string;
    userPreferred: string;
  };
  description?: string;
  coverImage: { large: string; medium: string; color?: string };
  bannerImage?: string;
  genres: string[];
  averageScore?: number;
  popularity?: number;
  episodes?: number;
  duration?: number;
  status: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
  seasonYear?: number;
  format?: string;
  studios?: { nodes: Studio[] };
  tags?: { name: string; rank: number }[];
  trailer?: { id: string; site: string };
  nextAiringEpisode?: { airingAt: number; episode: number };
  streamingEpisodes?: { title: string; thumbnail: string; url: string }[];
  recommendations?: { nodes: { mediaRecommendation: AniListMedia }[] };
  startDate?: { year?: number; month?: number; day?: number };
  isAdult: boolean;
}

export interface Studio {
  id: number;
  name: string;
  isAnimationStudio: boolean;
}

// ── Player Types ──────────────────────────────────────────────────

export interface VideoSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export interface Subtitle {
  url: string;
  lang: string;
  label: string;
  isDefault?: boolean;
}

export interface SkipTimes {
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
}

export interface ResolvedSources {
  providerId: string;
  providerName: string;
  sources: VideoSource[];
  subtitles: Subtitle[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  headers?: Record<string, string>;
  lang: 'vf' | 'vostfr' | 'vo';
  episode?: {
    id: string;
    number: number;
    title?: string;
    image?: string;
  };
  mapping?: {
    malId?: number;
    anilistId?: number;
    providerAnimeId: string;
    availableProviders: string[];
  };
}

// ── Progress / Watchlist ──────────────────────────────────────────

export interface WatchProgress {
  tmdbId: number;
  type: 'tv' | 'movie';
  title: string;
  poster: string | null;
  episode: number;
  season: number;
  currentTime: number;
  duration: number;
  progress: number; // 0-100
  updatedAt: number;
  lang: 'vf' | 'vostfr' | 'vo';
}

export interface WatchlistItem {
  tmdbId: number;
  type: 'tv' | 'movie';
  title: string;
  poster: string | null;
  backdrop: string | null;
  score: number;
  addedAt: number;
  genres?: string[];
}

// ── AniList User ──────────────────────────────────────────────────

export interface AniListUser {
  id: number;
  name: string;
  avatar: { large: string };
  statistics: {
    anime: { count: number; minutesWatched: number; episodesWatched: number };
  };
}

export interface AniListListEntry {
  id: number;
  status: 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';
  progress: number;
  score?: number;
  media: AniListMedia;
}

// ── UI Types ──────────────────────────────────────────────────────

export type Lang = 'vf' | 'vostfr' | 'vo';
export type Theme = 'dark' | 'light';
export type NavSection = 'home' | 'anime' | 'search' | 'profile' | 'watchlist';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
