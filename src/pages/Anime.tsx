import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInfinitePopular, useTopRated, useOnAir, useTrending } from '@/hooks/useAnime';
import { AnimeCard } from '@/components/cards/AnimeCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { TMDBAnime } from '@/types';

const SORTS = [
  { value: 'popular',   label: '🔥 Populaires' },
  { value: 'top_rated', label: '⭐ Mieux notés' },
  { value: 'on_air',    label: '🔴 En cours' },
  { value: 'trending',  label: '📈 Tendances' },
];

export default function AnimeCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSort = searchParams.get('sort') ?? 'popular';
  const [sort, setSort] = useState(initialSort);

  // Sync sort with URL param
  useEffect(() => {
    setSearchParams(sort !== 'popular' ? { sort } : {}, { replace: true });
  }, [sort]);

  // Only popular supports infinite scroll for now
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: infLoading,
  } = useInfinitePopular();

  const { data: topRatedData, isLoading: topLoading }  = useTopRated();
  const { data: onAirData,    isLoading: onAirLoading } = useOnAir();
  const { data: trendingData, isLoading: trendLoading } = useTrending();

  const loaderRef = useInfiniteScroll(fetchNextPage, hasNextPage ?? false);

  const isLoading = sort === 'popular'   ? infLoading
                  : sort === 'top_rated' ? topLoading
                  : sort === 'on_air'    ? onAirLoading
                  : trendLoading;

  // Flatten pages for infinite popular
  const popularItems: TMDBAnime[] = infiniteData?.pages.flatMap(p => p.results ?? []) ?? [];

  const items: TMDBAnime[] =
    sort === 'popular'   ? popularItems
    : sort === 'top_rated' ? (topRatedData?.results ?? [])
    : sort === 'on_air'    ? (onAirData?.results    ?? [])
    :                        (trendingData?.results  ?? []);

  return (
    <div className="min-h-screen bg-nova-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-nova-bg/90 backdrop-blur-md border-b border-nova-border">
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-4 flex items-center gap-4 overflow-x-auto scrollbar-none">
          <h1 className="shrink-0 text-lg font-black text-nova-text mr-2">Catalogue</h1>
          {SORTS.map(s => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                sort === s.value
                  ? 'bg-nova-accent border-nova-accent text-white shadow-lg shadow-nova-accent/30'
                  : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text hover:border-nova-text/30'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {Array.from({ length: 21 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-nova-muted">
            <p className="text-4xl mb-3">🎌</p>
            <p className="font-semibold">Aucun anime trouvé</p>
          </div>
        ) : (
          <motion.div
            key={sort}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
          >
            {items.map((anime, i) => (
              <motion.div
                key={`${anime.id}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
              >
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Infinite scroll loader (popular only) */}
        {sort === 'popular' && (
          <>
            <div ref={loaderRef} className="h-10" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-6">
                <div className="w-8 h-8 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
