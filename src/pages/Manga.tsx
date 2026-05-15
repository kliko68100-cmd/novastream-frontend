import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { manga } from '@/lib/api';

const SORTS = [
  { value: 'popular', label: '🔥 Populaires' },
  { value: 'latest',  label: '🆕 Dernières MAJ' },
];

const TYPES = [
  { value: 'all',     label: 'Tout' },
  { value: 'manga',   label: 'Manga' },
  { value: 'webtoon', label: 'Webtoon' },
  { value: 'manhua',  label: 'Manhua' },
];

export default function MangaCatalog() {
  const [sort, setSort]     = useState('popular');
  const [type, setType]     = useState('all');
  const [search, setSearch] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const navigate = useNavigate();

  const { data: popularData, isLoading: popLoading } = useQuery({
    queryKey: ['manga', 'popular'],
    queryFn:  () => manga.popular(),
    enabled:  sort === 'popular' && !searchQ,
  });
  const { data: latestData, isLoading: latLoading } = useQuery({
    queryKey: ['manga', 'latest'],
    queryFn:  () => manga.latest(),
    enabled:  sort === 'latest' && !searchQ,
  });
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['manga', 'search', searchQ],
    queryFn:  () => manga.search(searchQ),
    enabled:  !!searchQ,
  });

  const isLoading = searchQ ? searchLoading : sort === 'popular' ? popLoading : latLoading;
  const raw = searchQ ? searchData?.results : sort === 'popular' ? popularData?.results : latestData?.results;
  const items = (raw ?? []).filter((m: any) => type === 'all' || m.type === type);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQ(search.trim());
  };

  return (
    <div className="min-h-screen bg-nova-bg pb-32">
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-nova-bg/90 backdrop-blur-md border-b border-nova-border">
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-3 space-y-3">
          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un manga, webtoon..."
              className="flex-1 bg-nova-bg2 border border-nova-border rounded-full px-4 py-2
                text-nova-text text-sm placeholder:text-nova-muted focus:outline-none
                focus:border-nova-accent transition-colors"
            />
            <button type="submit"
              className="px-4 py-2 bg-nova-accent rounded-full text-white text-sm font-bold hover:bg-nova-accent/90">
              Rechercher
            </button>
            {searchQ && (
              <button type="button" onClick={() => { setSearch(''); setSearchQ(''); }}
                className="px-4 py-2 bg-nova-bg2 border border-nova-border rounded-full text-nova-muted text-sm hover:text-nova-text">
                ✕
              </button>
            )}
          </form>

          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {!searchQ && SORTS.map(s => (
              <button key={s.value} onClick={() => setSort(s.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  sort === s.value
                    ? 'bg-nova-accent border-nova-accent text-white'
                    : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text'
                }`}>
                {s.label}
              </button>
            ))}
            <div className="w-px bg-nova-border shrink-0 mx-1" />
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  type === t.value
                    ? 'bg-nova-purple/20 border-nova-purple text-nova-purple'
                    : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-nova-bg2 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-nova-muted">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-semibold">Aucun manga trouvé</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {items.map((m: any, i: number) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                onClick={() => navigate(`/manga/${m.id}`)}
                className="cursor-pointer group">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-nova-bg2 relative">
                  {m.cover
                    ? <img src={m.cover} alt={m.title} loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Badge type */}
                  <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md
                    bg-black/60 text-white/90 backdrop-blur-sm">
                    {m.type === 'webtoon' ? '🌐 Webtoon' : m.type === 'manhua' ? '🇨🇳 Manhua' : '🇯🇵 Manga'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-nova-text truncate">{m.title}</p>
                {m.lastChapter && (
                  <p className="text-[10px] text-nova-muted">Ch. {m.lastChapter}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
