import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMangaPopular, useMangaLatest, useMangaSearch } from '@/hooks/useManga';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { MangaItem } from '@/types';

const SORTS = [
  { value: 'popular', label: '🔥 Populaires' },
  { value: 'latest',  label: '🆕 Nouveautés'  },
];

const TYPES = [
  { value: 'all',     label: 'Tout'    },
  { value: 'manga',   label: '🇯🇵 Manga'   },
  { value: 'webtoon', label: '🌐 Webtoon' },
  { value: 'manhua',  label: '🇨🇳 Manhua'  },
];

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller',
];

export default function MangaCatalog() {
  const navigate = useNavigate();
  const [sort,      setSort]      = useState('popular');
  const [type,      setType]      = useState('all');
  const [search,    setSearch]    = useState('');
  const [searchQ,   setSearchQ]   = useState('');
  const [genre,     setGenre]     = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const mangaBookmarks    = useUserStore(s => s.mangaBookmarks);
  const getMangaProgress  = useUserStore(s => s.getMangaProgress);

  const { data: popularData, isLoading: popLoading } = useMangaPopular();
  const { data: latestData,  isLoading: latLoading  } = useMangaLatest();
  const { data: searchData,  isLoading: searchLoading } = useMangaSearch(searchQ);

  const isLoading = searchQ ? searchLoading : sort === 'popular' ? popLoading : latLoading;
  const raw: MangaItem[] = searchQ
    ? (searchData?.results ?? [])
    : sort === 'popular' ? (popularData?.results ?? []) : (latestData?.results ?? []);

  const items = raw.filter(m => {
    if (type !== 'all' && m.type !== type) return false;
    if (genre && !m.genres?.includes(genre)) return false;
    return true;
  });

  // Favoris en haut si on est sur populaire
  const bookmarkedItems = items.filter(m => mangaBookmarks.includes(m.id));
  const otherItems      = items.filter(m => !mangaBookmarks.includes(m.id));
  const displayItems    = sort === 'popular' && !searchQ && bookmarkedItems.length > 0
    ? [...bookmarkedItems, ...otherItems]
    : items;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQ(search.trim());
    setGenre('');
  };

  return (
    <div className="min-h-screen bg-nova-bg pb-32">
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-nova-bg/95 backdrop-blur-md border-b border-nova-border">
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 py-3 space-y-2">
          {/* Barre de recherche */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un manga, webtoon..."
              className="flex-1 bg-nova-bg2 border border-nova-border rounded-full px-4 py-2.5
                text-nova-text text-sm placeholder:text-nova-muted focus:outline-none
                focus:border-nova-accent transition-colors" />
            {searchQ ? (
              <button type="button" onClick={() => { setSearch(''); setSearchQ(''); }}
                className="px-4 py-2 bg-nova-bg2 border border-nova-border rounded-full text-nova-muted text-sm hover:text-nova-text">
                ✕
              </button>
            ) : (
              <>
                <button type="submit"
                  className="px-4 py-2 bg-nova-accent rounded-full text-white text-sm font-bold hover:bg-nova-accent/90">
                  Chercher
                </button>
                <button type="button" onClick={() => setShowFilters(v => !v)}
                  className={cn('px-3 py-2 rounded-full text-sm font-bold border transition-all',
                    showFilters || genre
                      ? 'bg-nova-accent/20 border-nova-accent text-nova-accent'
                      : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text')}>
                  ⚙ Filtres{genre ? ' ●' : ''}
                </button>
              </>
            )}
          </form>

          {/* Sort + Type */}
          {!searchQ && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {SORTS.map(s => (
                <button key={s.value} onClick={() => setSort(s.value)}
                  className={cn('shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
                    sort === s.value
                      ? 'bg-nova-accent border-nova-accent text-white'
                      : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text')}>
                  {s.label}
                </button>
              ))}
              <div className="w-px bg-nova-border shrink-0" />
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)}
                  className={cn('shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
                    type === t.value
                      ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                      : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text')}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Filtres genres */}
          {showFilters && !searchQ && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              <button onClick={() => setGenre('')}
                className={cn('shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all',
                  !genre ? 'bg-nova-accent border-nova-accent text-white' : 'bg-nova-bg2 border-nova-border text-nova-muted')}>
                Tous genres
              </button>
              {GENRES.map(g => (
                <button key={g} onClick={() => setGenre(genre === g ? '' : g)}
                  className={cn('shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all',
                    genre === g
                      ? 'bg-nova-accent border-nova-accent text-white'
                      : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text')}>
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Favoris section */}
      {!searchQ && bookmarkedItems.length > 0 && sort === 'popular' && (
        <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-6 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-nova-accent rounded-full" />
            <span className="text-sm font-black text-nova-text">🔖 Mes favoris</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
            {bookmarkedItems.map(m => (
              <MangaCard key={m.id} manga={m} progress={getMangaProgress(m.id)} onClick={() => navigate(`/manga/${m.id}`)} compact />
            ))}
          </div>
        </div>
      )}

      {/* Grid principal */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-10 pt-4">
        {searchQ && (
          <p className="text-nova-muted text-sm mb-4">
            {isLoading ? 'Recherche...' : `${displayItems.length} résultats pour "${searchQ}"`}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {Array.from({length: 18}).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-nova-bg2 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-nova-muted">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-semibold">Aucun manga trouvé</p>
            {genre && (
              <button onClick={() => setGenre('')} className="mt-3 text-sm text-nova-accent hover:underline">
                Effacer le filtre genre
              </button>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {(searchQ ? displayItems : otherItems).map((m, i) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                <MangaCard manga={m} progress={getMangaProgress(m.id)} onClick={() => navigate(`/manga/${m.id}`)} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function MangaCard({ manga, progress, onClick, compact }: {
  manga: MangaItem;
  progress: any;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <div onClick={onClick}
      className={cn('cursor-pointer group', compact ? 'shrink-0 w-32' : '')}>
      <div className={cn('rounded-xl overflow-hidden bg-nova-bg2 relative', compact ? 'aspect-[2/3]' : 'aspect-[2/3]')}>
        {manga.cover
          ? <img src={manga.cover} alt={manga.title} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
        }
        {/* Badge type */}
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5
          rounded-md bg-black/70 text-white/90 backdrop-blur-sm">
          {manga.type === 'webtoon' ? '🌐' : manga.type === 'manhua' ? '🇨🇳' : '🇯🇵'}
        </span>
        {/* Progression */}
        {progress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
            <div className="h-full bg-nova-accent"
              style={{ width: `${Math.round((parseInt(progress.chapterNumber) / (parseInt(manga.lastChapter ?? '1') || 1)) * 100)}%` }} />
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs font-semibold text-nova-text truncate">{manga.title}</p>
      {manga.lastChapter && <p className="text-[10px] text-nova-muted">Ch.{manga.lastChapter}</p>}
    </div>
  );
}
