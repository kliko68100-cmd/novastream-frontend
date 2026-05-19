import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({ baseURL: API_BASE, timeout: 15_000 });

// ── AniList GraphQL — appelé DIRECTEMENT depuis le navigateur ──────

const ANILIST_URL = 'https://graphql.anilist.co';

const MEDIA_FIELDS = `
  id idMal
  title { romaji english native userPreferred }
  description(asHtml: false)
  coverImage { large medium extraLarge color }
  bannerImage
  genres
  averageScore popularity episodes duration
  status season seasonYear format isAdult
  nextAiringEpisode { airingAt episode }
  startDate { year month day }
  tags { name rank }
  studios(isMain: true) { nodes { name isAnimationStudio } }
  trailer { id site }
  externalLinks { url site type }
`;

async function gql<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json() as { data: T; errors?: any[] };
  if (json.errors?.length) throw new Error(json.errors[0]?.message);
  return json.data;
}

export const anilist = {
  trending: (page = 1) => gql<any>(`
    query($page:Int){ Page(page:$page,perPage:24){
      pageInfo{total currentPage lastPage hasNextPage}
      media(type:ANIME,sort:TRENDING_DESC,isAdult:false){${MEDIA_FIELDS}}
    }}`, { page }).then(d => d.Page),

  popular: (page = 1) => gql<any>(`
    query($page:Int){ Page(page:$page,perPage:24){
      pageInfo{total currentPage lastPage hasNextPage}
      media(type:ANIME,sort:POPULARITY_DESC,isAdult:false){${MEDIA_FIELDS}}
    }}`, { page }).then(d => d.Page),

  topRated: (page = 1) => gql<any>(`
    query($page:Int){ Page(page:$page,perPage:24){
      pageInfo{total currentPage lastPage hasNextPage}
      media(type:ANIME,sort:SCORE_DESC,isAdult:false,averageScore_greater:70){${MEDIA_FIELDS}}
    }}`, { page }).then(d => d.Page),

  seasonal: (year: number, season: string, page = 1) => gql<any>(`
    query($page:Int,$year:Int,$season:MediaSeason){
      Page(page:$page,perPage:30){
        pageInfo{total currentPage lastPage hasNextPage}
        media(type:ANIME,season:$season,seasonYear:$year,sort:POPULARITY_DESC,isAdult:false){${MEDIA_FIELDS}}
      }}`, { page, year, season }).then(d => d.Page),

  details: (id: number) => gql<any>(`
    query($id:Int){ Media(id:$id,type:ANIME){
      ${MEDIA_FIELDS}
      relations{ edges{ relationType node{
        id title{romaji userPreferred} coverImage{large medium} format status averageScore
      }}}
      recommendations(perPage:6){ nodes{ mediaRecommendation{
        id title{romaji userPreferred} coverImage{large medium} averageScore format
      }}}
      streamingEpisodes{ title thumbnail url }
    }}`, { id }).then(d => d.Media),

  search: (query: string, page = 1) => gql<any>(`
    query($search:String,$page:Int){ Page(page:$page,perPage:20){
      pageInfo{total currentPage lastPage}
      media(search:$search,type:ANIME,isAdult:false,sort:SEARCH_MATCH){${MEDIA_FIELDS}}
    }}`, { search: query, page }).then(d => d.Page),
};

// ── MangaDex — appelé DIRECTEMENT depuis le navigateur ────────────

const MD_URL = 'https://api.mangadex.org';

async function mdFetch(path: string, params: Record<string, any> = {}) {
  const url = new URL(`${MD_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach(i => url.searchParams.append(k, String(i)));
    else url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'NovaStream/5.0' },
  });
  if (!res.ok) throw new Error(`MangaDex ${res.status}`);
  return res.json();
}

function mdCoverUrl(manga: any): string | null {
  const cover = manga.relationships?.find((r: any) => r.type === 'cover_art');
  if (!cover?.attributes?.fileName) return null;
  return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`;
}

function mdTitle(manga: any): string {
  const t = manga.attributes?.title ?? {};
  return t.fr ?? t.en ?? t['ja-ro'] ?? Object.values(t)[0] ?? 'Sans titre';
}

function mdFormat(manga: any) {
  return {
    id:          manga.id,
    title:       mdTitle(manga),
    description: manga.attributes?.description?.fr ?? manga.attributes?.description?.en ?? '',
    cover:       mdCoverUrl(manga),
    status:      manga.attributes?.status,
    year:        manga.attributes?.year,
    lastChapter: manga.attributes?.lastChapter,
    genres:      (manga.attributes?.tags ?? [])
      .filter((t: any) => t.attributes?.group === 'genre')
      .map((t: any) => t.attributes?.name?.en ?? ''),
    type: manga.attributes?.originalLanguage === 'ko' ? 'webtoon'
         : manga.attributes?.originalLanguage === 'zh' ? 'manhua'
         : 'manga',
    authors: (manga.relationships ?? [])
      .filter((r: any) => r.type === 'author')
      .map((r: any) => r.attributes?.name)
      .filter(Boolean),
  };
}

const MD_PARAMS_BASE = {
  'availableTranslatedLanguage[]': 'fr',
  'includes[]': ['cover_art', 'author'],
  hasAvailableChapters: 'true',
  'contentRating[]': ['safe', 'suggestive'],
};

export const mangadex = {
  popular: async (page = 1) => {
    const d = await mdFetch('/manga', { ...MD_PARAMS_BASE, limit: 24, offset: (page-1)*24, 'order[followedCount]': 'desc' });
    return { results: (d.data ?? []).map(mdFormat), total: d.total, page };
  },
  latest: async (page = 1) => {
    const d = await mdFetch('/manga', { ...MD_PARAMS_BASE, limit: 24, offset: (page-1)*24, 'order[updatedAt]': 'desc' });
    return { results: (d.data ?? []).map(mdFormat), total: d.total, page };
  },
  search: async (q: string, page = 1) => {
    const d = await mdFetch('/manga', { ...MD_PARAMS_BASE, title: q, limit: 20, offset: (page-1)*20 });
    return { results: (d.data ?? []).map(mdFormat), total: d.total, page };
  },
  details: async (id: string) => {
    const d = await mdFetch(`/manga/${id}`, { 'includes[]': ['cover_art', 'author', 'artist'] });
    return mdFormat(d.data);
  },
  chapters: async (mangaId: string, page = 1) => {
    const d = await mdFetch('/chapter', {
      manga: mangaId,
      'translatedLanguage[]': 'fr',
      limit: 100,
      offset: (page-1)*100,
      'order[chapter]': 'asc',
      'includes[]': ['scanlation_group'],
    });
    return {
      chapters: (d.data ?? []).map((ch: any) => ({
        id:     ch.id,
        number: ch.attributes.chapter,
        title:  ch.attributes.title ?? `Chapitre ${ch.attributes.chapter}`,
        pages:  ch.attributes.pages,
        date:   ch.attributes.publishAt,
        group:  ch.relationships?.find((r: any) => r.type === 'scanlation_group')?.attributes?.name ?? '',
      })),
      total: d.total,
      page,
    };
  },
  pages: async (chapterId: string) => {
    const d = await mdFetch(`/at-home/server/${chapterId}`);
    const base = d.baseUrl;
    const hash = d.chapter.hash;
    return {
      pages:    (d.chapter.data ?? []).map((f: string) => `${base}/data/${hash}/${f}`),
      pagesLow: (d.chapter.dataSaver ?? []).map((f: string) => `${base}/data-saver/${hash}/${f}`),
      total:    d.chapter.data?.length ?? 0,
    };
  },
};

// ── Backend API — sources vidéo uniquement ────────────────────────

export const sources = {
  resolve: (params: {
    anilistId: number;
    episode?:  number;
    season?:   number;
    lang?:     'vf' | 'vostfr' | 'vo';
    title?:    string;
    titleEn?:  string;
  }) => api.get('/sources', { params }).then(r => r.data),

  animeSamaRelay: (url: string) =>
    api.get('/sources/animesama/relay', { params: { url } }).then(r => r.data),
};

// ── Proxy helpers ─────────────────────────────────────────────────

export const proxy = {
  m3u8Url:     (url: string, ref?: string) =>
    `${API_BASE}/proxy/m3u8?url=${btoa(url)}&ref=${encodeURIComponent(ref ?? '')}`,
  subtitleUrl: (url: string) =>
    `${API_BASE}/proxy/subtitle?url=${encodeURIComponent(url)}`,
};

// ── Sync AniList (backend) ────────────────────────────────────────
export const sync = {
  anilist: (token: string) => api.post('/sync/anilist', { token }).then(r => r.data),
  status:  () => api.get('/sync/status').then(r => r.data),
};
