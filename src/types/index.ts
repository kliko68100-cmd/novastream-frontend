// ── AniList ───────────────────────────────────────────────────────

export interface AniListMedia {
  id: number; idMal?: number;
  title: { romaji?: string; english?: string; native?: string; userPreferred?: string };
  description?: string;
  coverImage: { large?: string; medium?: string; extraLarge?: string; color?: string };
  bannerImage?: string;
  genres: string[];
  averageScore?: number; popularity?: number; episodes?: number; duration?: number;
  status?: string; season?: string; seasonYear?: number; format?: string; isAdult?: boolean;
  startDate?: { year?: number; month?: number; day?: number };
  nextAiringEpisode?: { airingAt: number; episode: number };
  studios?: { nodes: { name: string; isAnimationStudio: boolean }[] };
  relations?: { edges: { relationType: string; node: AniListMedia }[] };
  recommendations?: { nodes: { mediaRecommendation: AniListMedia }[] };
  streamingEpisodes?: { title: string; thumbnail: string; url: string }[];
  trailer?: { id: string; site: string };
  tags?: { name: string; rank: number }[];
}

export interface AniListPage {
  pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean };
  media: AniListMedia[];
}

export interface AniListUser {
  id: number;
  name: string;
  avatar?: { large?: string; medium?: string };
  bannerImage?: string;
  statistics?: {
    anime?: { count: number; minutesWatched: number; episodesWatched: number };
    manga?: { count: number; chaptersRead: number };
  };
}

// ── Sources vidéo ─────────────────────────────────────────────────

export interface IframeSource { name: string; url: string; }

export interface ResolvedSources {
  type: 'animesama' | 'hls' | 'iframe';
  lang: 'vf' | 'vostfr' | 'vo';
  iframes: IframeSource[];
  fallback?: IframeSource[];
  sources?: { url: string; isM3U8: boolean; quality?: string }[];
  subtitles?: { url: string; label: string; lang: string }[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  headers?: Record<string, string>;
}

// ── Manga ─────────────────────────────────────────────────────────

export interface MangaItem {
  id: string; title: string; description: string; cover: string | null;
  status?: string; year?: number; lastChapter?: string;
  genres: string[]; type: 'manga' | 'webtoon' | 'manhua'; authors?: string[];
}

export interface MangaChapter {
  id: string; number: string; title: string; pages: number; date: string; group: string;
}

// ── User / Store ──────────────────────────────────────────────────

export interface WatchlistItem {
  tmdbId: number; type: 'tv' | 'movie';
  title: string; poster: string | null; backdrop: string | null;
  score: number; addedAt: number; genres: string[];
}

export interface WatchProgress {
  tmdbId: number; episode: number; season: number;
  time: number; duration: number; progress: number;
  lang: Lang; title: string; poster: string | null;
  type: 'tv' | 'movie'; updatedAt: number;
}

export interface MangaProgress {
  mangaId: string; chapterId: string; chapterNumber: string;
  page: number; totalPages: number; title: string; cover: string | null;
  updatedAt: number;
}

export interface ToastMessage {
  id: string; type: 'success' | 'error' | 'info' | 'warning';
  message: string; duration?: number;
}

export type Lang = 'vf' | 'vostfr' | 'vo';
export type Theme = 'dark' | 'darker' | 'amoled';
export type AccentColor = 'red' | 'blue' | 'purple' | 'green' | 'orange';
