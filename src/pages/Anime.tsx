import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInfiniteAnime, useSearch } from '@/hooks/useAnime';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { AniListMedia } from '@/types';

const SORTS = [
  { value: 'popular',   label: '🔥 Populaires' },
  { value: 'top_rated', label: '⭐ Mieux notés' },
  { value: 'trending',  label: '📈 Tendances'  },
  { value: 'seasonal',  label: '🌸 Saison'     },
];

function getTitle(m: AniListMedia) {
  return m.title.userPreferred ?? m.title.romaji ?? m.title.english ?? '';
}

export default function AnimeCatalog() {
  const navigate = useNavigate();
  const [sort, setSort]     = useState('popular');
  const [search, setSearch] = useState('');
  const [searchQ, setSearchQ] = useState('');

  const { data: infiniteData, fetchNextPage, hasNextPage, isLoading } = useInfiniteAnime(sort);
  const { data: searchData, isLoading: searchLoading } = useSearch(searchQ);
  const loaderRef = useInfiniteScroll(fetchNextPage, !!hasNextPage);

  const items: AniListMedia[] = searchQ
    ? (searchData?.media ?? [])
    : (infiniteData?.pages.flatMap((p: any) => p.media ?? []) ?? []);

  const loading = searchQ ? searchLoading : isLoading;

  return (
    <div className="min-h-screen bg-nova-bg pb-32">
      <div className="sticky top-0 z-30 bg-nova-bg/90 backdrop-blur-md border-b border-nova-border">
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-3 space-y-2">
          <form onSubmit={e => { e.preventDefault(); setSearchQ(search.trim()); }} className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un anime..."
              className="flex-1 bg-nova-bg2 border border-nova-border rounded-full px-4 py-2
                text-nova-text text-sm placeholder:text-nova-muted focus:outline-none focus:border-nova-accent" />
            {searchQ
              ? <button type="button" onClick={() => { setSearch(''); setSearchQ(''); }}
                  className="px-4 py-2 bg-nova-bg2 border border-nova-border rounded-full text-nova-muted text-sm">✕</button>
              : <button type="submit" className="px-4 py-2 bg-nova-accent rounded-full text-white text-sm font-bold">Rechercher</button>
            }
          </form>
          {!searchQ && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {SORTS.map(s => (
                <button key={s.value} onClick={() => setSort(s.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    sort === s.value
                      ? 'bg-nova-accent border-nova-accent text-white'
                      : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-6">
        {loading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {Array.from({length:21}).map((_,i) => <div key={i} className="aspect-[2/3] bg-nova-bg2 rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-nova-muted">
            <p className="text-4xl mb-3">🎌</p>
            <p className="font-semibold">Aucun anime trouvé</p>
          </div>
        ) : (
          <motion.div key={sort} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {items.map((m, i) => (
              <motion.div key={`${m.id}-${i}`}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => navigate(`/anime/${m.id}`)}
                className="cursor-pointer group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-nova-bg2 relative">
                  {m.coverImage.large
                    ? <img src={m.coverImage.large} alt={getTitle(m)} loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full bg-nova-bg2" />}
                  {m.averageScore && (
                    <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] font-bold text-yellow-400">
                      ★ {(m.averageScore/10).toFixed(1)}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-nova-text truncate">{getTitle(m)}</p>
                {m.seasonYear && <p className="text-[10px] text-nova-muted">{m.seasonYear}</p>}
              </motion.div>
            ))}
          </motion.div>
        )}
        {!searchQ && <div ref={loaderRef} className="h-10" />}
      </div>
    </div>
  );
}
