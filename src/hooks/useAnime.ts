import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { anilist, sources } from '@/lib/api';
import type { Lang } from '@/types';

const getCurrentSeason = () => {
  const m = new Date().getMonth();
  if (m < 3)  return 'WINTER';
  if (m < 6)  return 'SPRING';
  if (m < 9)  return 'SUMMER';
  return 'FALL';
};

export const useTrending   = (page = 1) => useQuery({ queryKey: ['trending', page],  queryFn: () => anilist.trending(page),  staleTime: 5*60_000 });
export const usePopular    = (page = 1) => useQuery({ queryKey: ['popular', page],   queryFn: () => anilist.popular(page),   staleTime: 5*60_000 });
export const useTopRated   = (page = 1) => useQuery({ queryKey: ['toprated', page],  queryFn: () => anilist.topRated(page),  staleTime: 10*60_000 });
export const useAnimeDetails = (id: number | null) => useQuery({
  queryKey: ['anime', 'details', id],
  queryFn:  () => anilist.details(id!),
  enabled:  !!id,
  staleTime: 30*60_000,
});

export const useSeasonal = (year?: number, season?: string) => {
  const y = year ?? new Date().getFullYear();
  const s = season ?? getCurrentSeason();
  return useQuery({
    queryKey: ['seasonal', y, s],
    queryFn:  () => anilist.seasonal(y, s),
    staleTime: 10*60_000,
  });
};

export const useInfiniteAnime = (sort: string) => useInfiniteQuery({
  queryKey: ['infinite', sort],
  queryFn:  ({ pageParam = 1 }) => {
    if (sort === 'trending')  return anilist.trending(pageParam);
    if (sort === 'top_rated') return anilist.topRated(pageParam);
    if (sort === 'seasonal')  return anilist.seasonal(new Date().getFullYear(), getCurrentSeason(), pageParam);
    return anilist.popular(pageParam);
  },
  getNextPageParam: (last: any) =>
    last.pageInfo?.hasNextPage ? (last.pageInfo.currentPage + 1) : undefined,
  initialPageParam: 1,
  staleTime: 5*60_000,
});

export const useSearch = (query: string, page = 1) => useQuery({
  queryKey: ['search', query, page],
  queryFn:  () => anilist.search(query, page),
  enabled:  query.length > 1,
  staleTime: 60_000,
});

export const useSources = (params: {
  anilistId: number | null;
  episode:   number;
  season:    number;
  lang:      Lang;
  title?:    string;
  titleEn?:  string;
}) => useQuery({
  queryKey: ['sources', params.anilistId, params.episode, params.season, params.lang],
  queryFn:  () => sources.resolve({
    anilistId: params.anilistId!,
    episode:   params.episode,
    season:    params.season,
    lang:      params.lang,
    title:     params.title,
    titleEn:   params.titleEn,
  }),
  enabled:   !!params.anilistId,
  staleTime: 30*60_000,
  retry:     1,
});
