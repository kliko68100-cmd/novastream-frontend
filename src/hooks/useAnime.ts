import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { catalog, anilistApi, sources as sourcesApi, sync } from '@/lib/api';
import { useUserStore } from '@/stores/userStore';
import type { Lang } from '@/types';

// ── Catalog hooks ─────────────────────────────────────────────────

export const useTrending = (page = 1) =>
  useQuery({ queryKey: ['trending', page], queryFn: () => catalog.trending(page), staleTime: 3 * 60_000 });

export const usePopular = (page = 1) =>
  useQuery({ queryKey: ['popular', page], queryFn: () => catalog.popular(page) });

export const useTopRated = (page = 1) =>
  useQuery({ queryKey: ['topRated', page], queryFn: () => catalog.topRated(page) });

export const useOnAir = (page = 1) =>
  useQuery({ queryKey: ['onAir', page], queryFn: () => catalog.onAir(page), staleTime: 2 * 60_000 });

export const useAnimeDetails = (id: number | null) =>
  useQuery({
    queryKey: ['animeDetails', id],
    queryFn:  () => catalog.details(id!),
    enabled:  !!id,
    staleTime: 10 * 60_000,
  });

export const useSeason = (showId: number | null, season: number) =>
  useQuery({
    queryKey: ['season', showId, season],
    queryFn:  () => catalog.season(showId!, season),
    enabled:  !!showId && season > 0,
    staleTime: 30 * 60_000,
  });

export const useSearch = (query: string) =>
  useQuery({
    queryKey: ['search', query],
    queryFn:  () => catalog.search(query),
    enabled:  query.length >= 2,
    staleTime: 60_000,
  });

// ── Infinite scroll hooks ─────────────────────────────────────────

export const useInfinitePopular = () =>
  useInfiniteQuery({
    queryKey: ['popular', 'infinite'],
    queryFn:  ({ pageParam }) => catalog.popular(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) =>
      last.total_pages > (lastPageParam as number) ? (lastPageParam as number) + 1 : undefined,
  });

export const useInfiniteSearch = (query: string) =>
  useInfiniteQuery({
    queryKey: ['search', 'infinite', query],
    queryFn:  ({ pageParam }) => catalog.search(query, pageParam as number),
    initialPageParam: 1,
    enabled:  query.length >= 2,
    getNextPageParam: (last, _, lastPageParam) =>
      last.total_pages > (lastPageParam as number) ? (lastPageParam as number) + 1 : undefined,
  });

// ── AniList hooks ─────────────────────────────────────────────────

export const useAniListTrending = (page = 1) =>
  useQuery({ queryKey: ['anilist', 'trending', page], queryFn: () => anilistApi.trending(page) });

export const useAniListSeasonal = (year?: number, season?: string) =>
  useQuery({
    queryKey: ['anilist', 'seasonal', year, season],
    queryFn:  () => anilistApi.seasonal(year, season),
    staleTime: 60 * 60_000,
  });

export const useSkipTimes = (malId?: number, episode?: number, episodeLength?: number) =>
  useQuery({
    queryKey: ['skipTimes', malId, episode],
    queryFn:  () => anilistApi.skipTimes(malId!, episode!, episodeLength),
    enabled:  !!malId && !!episode,
    staleTime: 24 * 60 * 60_000,
  });

// ── Sources hook ──────────────────────────────────────────────────

export const useSources = (params: {
  tmdbId:  number | null;
  episode: number;
  season:  number;
  lang:    Lang;
  provider?: string;
  title?:    string;
}) =>
  useQuery({
    queryKey: ['sources', params.tmdbId, params.episode, params.season, params.lang, params.provider],
    queryFn:  () => sourcesApi.resolve({
      tmdbId:   params.tmdbId!,
      episode:  params.episode,
      season:   params.season,
      lang:     params.lang,
      provider: params.provider,
      title:    params.title,
    }),
    enabled:   !!params.tmdbId,
    staleTime: 30 * 60_000,
    retry:     2,
  });

export const useProviderEpisodes = (tmdbId: number | null, provider = 'HiAnime') =>
  useQuery({
    queryKey: ['providerEpisodes', tmdbId, provider],
    queryFn:  () => sourcesApi.episodes(tmdbId!, provider),
    enabled:  !!tmdbId,
    staleTime: 30 * 60_000,
  });

// ── AniList Sync hooks ────────────────────────────────────────────

export const useAniListSync = () => {
  const { anilistToken, anilistUser } = useUserStore();
  const setAnilistAuth = useUserStore(s => s.setAnilistAuth);
  const addToast       = useUserStore(s => s.addToast);

  const updateEntry = useMutation({
    mutationFn: (data: { mediaId: number; status: string; progress: number; score?: number }) => {
      if (!anilistToken) throw new Error('Non connecté à AniList');
      return sync.updateEntry(data, anilistToken);
    },
    onSuccess: () => addToast({ type: 'success', message: 'AniList mis à jour ✓' }),
    onError:   () => addToast({ type: 'error',   message: 'Erreur sync AniList' }),
  });

  return { anilistUser, anilistToken, updateEntry };
};
