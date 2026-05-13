import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInfiniteSearch } from '@/hooks/useAnime';
import { AnimeCard } from '@/components/cards/AnimeCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { debounce } from '@/lib/utils';
import type { TMDBAnime } from '@/types';

const GENRES = [
  { id: 16,    name: 'Animation' },
  { id: 28,    name: 'Action' },
  { id: 35,    name: 'Comédie' },
  { id: 18,    name: 'Drame' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 9648,  name: 'Mystère' },
  { id: 10749, name: 'Romance' },
  { id: 12,    name: 'Aventure' },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';

  const [inputVal,  setInputVal]  = useState(initialQ);
  const [query,     setQuery]     = useState(initialQ);
  const [genreFilter, setGenreFilter] = useState<number | null>(null);

  const debouncedSearch = debounce((v: string) => setQuery(v), 400);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteSearch(query);

  const sentinelRef = useInfiniteScroll({
    onLoadMore: fetchNextPage,
    hasMore:    hasNextPage ?? false,
    loading:    isFetchingNextPage,
  });

  const allResults: TMDBAnime[] = data?.pages.flatMap((p: any) => p.results ?? []) ?? [];
  const filtered = genreFilter
    ? allResults.filter(a => a.genre_ids?.includes(genreFilter))
    : allResults;

  const handleInput = (v: string) => {
    setInputVal(v);
    debouncedSearch(v);
    if (v) setSearchParams({ q: v }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const totalPages  = data?.pages[0]?.total_pages ?? 0;
  const totalResults = data?.pages[0]?.total_results ?? 0;

  return (
    <div className="min-h-screen bg-nova-bg pt-20 pb-32 px-4 md:px-10">
      <div className="max-w-screen-xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-nova-text mb-6">
            {query ? `Résultats pour "${query}"` : 'Rechercher un anime'}
          </h1>

          {/* Search input */}
          <div className="relative max-w-2xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nova-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={inputVal}
              onChange={e => handleInput(e.target.value)}
              placeholder="Naruto, One Piece, Attack on Titan..."
              autoFocus
              className="w-full bg-nova-bg2 border border-nova-border rounded-2xl pl-12 pr-12 py-4
                text-nova-text text-base placeholder:text-nova-muted
                focus:outline-none focus:ring-2 focus:ring-nova-accent/50 focus:border-nova-accent/50
                transition-all"
            />
            {inputVal && (
              <button
                onClick={() => handleInput('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-nova-muted hover:text-nova-text transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </motion.div>

        {/* Genre filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-6">
          <button
            onClick={() => setGenreFilter(null)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
              !genreFilter
                ? 'bg-nova-accent border-nova-accent text-white'
                : 'border-nova-border text-nova-muted hover:text-nova-text'
            }`}
          >
            Tous
          </button>
          {GENRES.map(g => (
            <button
              key={g.id}
              onClick={() => setGenreFilter(f => f === g.id ? null : g.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                genreFilter === g.id
                  ? 'bg-nova-accent border-nova-accent text-white'
                  : 'border-nova-border text-nova-muted hover:text-nova-text'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Results count */}
        {query && !isLoading && (
          <p className="text-nova-muted text-sm mb-4">
            {totalResults.toLocaleString('fr-FR')} résultats
            {genreFilter ? ` (${filtered.length} après filtre)` : ''}
          </p>
        )}

        {/* Results grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {Array.from({ length: 21 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {filtered.map((anime, i) => (
                <motion.div
                  key={`${anime.id}-${i}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-6">
              {isFetchingNextPage && (
                <div className="w-8 h-8 rounded-full border-4 border-nova-accent/30 border-t-nova-accent animate-spin" />
              )}
              {!hasNextPage && filtered.length > 0 && (
                <p className="text-nova-muted text-sm">Tous les résultats affichés</p>
              )}
            </div>
          </>
        ) : query && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-6xl mb-6">🔍</p>
            <p className="text-nova-text font-bold text-xl mb-2">Aucun résultat</p>
            <p className="text-nova-muted text-sm max-w-sm">
              Essaie un autre titre, le nom original en japonais ou en romaji
            </p>
          </div>
        ) : !query ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-6xl mb-6">🎌</p>
            <p className="text-nova-text font-bold text-xl mb-2">Recherche un anime</p>
            <p className="text-nova-muted text-sm">Entre le titre en français, anglais ou japonais</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
