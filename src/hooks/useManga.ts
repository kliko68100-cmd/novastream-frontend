import { useQuery } from '@tanstack/react-query';
import { mangadex } from '@/lib/api';

export const useMangaPopular  = (page = 1) => useQuery({ queryKey: ['manga','popular',page],  queryFn: () => mangadex.popular(page),  staleTime: 10*60_000 });
export const useMangaLatest   = (page = 1) => useQuery({ queryKey: ['manga','latest',page],   queryFn: () => mangadex.latest(page),   staleTime: 5*60_000  });
export const useMangaSearch   = (q: string, page = 1) => useQuery({ queryKey: ['manga','search',q,page], queryFn: () => mangadex.search(q,page), enabled: q.length > 1, staleTime: 60_000 });
export const useMangaDetails  = (id: string) => useQuery({ queryKey: ['manga','details',id],  queryFn: () => mangadex.details(id),  enabled: !!id, staleTime: 60*60_000 });
export const useMangaChapters = (id: string, page = 1) => useQuery({ queryKey: ['manga','chapters',id,page], queryFn: () => mangadex.chapters(id,page), enabled: !!id, staleTime: 5*60_000 });
export const useMangaPages    = (chId: string) => useQuery({ queryKey: ['manga','pages',chId], queryFn: () => mangadex.pages(chId), enabled: !!chId, staleTime: 60*60_000 });
