import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { AnimeCard } from '@/components/cards/AnimeCard';
import type { TMDBAnime } from '@/types';

export default function Watchlist() {
  const watchlist          = useUserStore(s => s.watchlist);
  const removeFromWatchlist = useUserStore(s => s.removeFromWatchlist);

  const animes: TMDBAnime[] = watchlist.map(w => ({
    id: w.tmdbId, name: w.title, original_name: w.title,
    overview: '', poster_path: w.poster, backdrop_path: w.backdrop,
    vote_average: w.score, first_air_date: '', genre_ids: [16],
  }));

  return (
    <div className="min-h-screen bg-nova-bg pt-20 pb-32 px-4 md:px-10">
      <div className="max-w-screen-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-black text-nova-text">Ma liste</h1>
            <p className="text-nova-muted text-sm mt-1">{watchlist.length} anime{watchlist.length > 1 ? 's' : ''} sauvegardé{watchlist.length > 1 ? 's' : ''}</p>
          </div>
        </motion.div>

        {animes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-7xl mb-6">📋</p>
            <p className="text-nova-text font-bold text-xl mb-2">Ta liste est vide</p>
            <p className="text-nova-muted text-sm mb-8 max-w-sm">
              Ajoute des animes à ta liste pour les retrouver facilement
            </p>
            <Link
              to="/"
              className="px-8 py-3 bg-nova-accent rounded-full text-white font-bold hover:bg-nova-accent/90 transition-colors"
            >
              Découvrir des animes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8">
            {animes.map((anime, i) => (
              <motion.div
                key={anime.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.04, 0.5) }}
                layout
              >
                <AnimeCard anime={anime} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
