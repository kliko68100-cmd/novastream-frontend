import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSearch } from '@/hooks/useAnime';
import { AnimeCard } from '@/components/cards/AnimeCard';
import type { AniListMedia } from '@/types';

export default function Search() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(sp.get('q') ?? '');
  const [submitted, setSubmitted] = useState(sp.get('q') ?? '');

  const { data, isLoading } = useSearch(submitted);
  const results: AniListMedia[] = data?.media ?? [];

  useEffect(() => { setSubmitted(sp.get('q') ?? ''); setQuery(sp.get('q') ?? ''); }, [sp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-nova-bg pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-8 pb-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
            placeholder="Rechercher un anime..."
            className="flex-1 bg-nova-bg2 border border-nova-border rounded-full px-5 py-3
              text-nova-text placeholder:text-nova-muted focus:outline-none focus:border-nova-accent transition-colors" />
          <button type="submit" className="px-6 py-3 bg-nova-accent rounded-full text-white font-bold hover:bg-nova-accent/90">
            Rechercher
          </button>
        </form>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-10">
        {submitted && (
          <p className="text-nova-muted text-sm mb-4">
            {isLoading ? 'Recherche...' : `${results.length} résultats pour "${submitted}"`}
          </p>
        )}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({length:12}).map((_,i) => <div key={i} className="aspect-[2/3] bg-nova-bg2 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {results.map((anime, i) => (
              <motion.div key={anime.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
