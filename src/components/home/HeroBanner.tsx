import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { img, formatScore, statusLabel } from '@/lib/api';
import { useUserStore } from '@/stores/userStore';
import { stripHtml, truncate, randomItem } from '@/lib/utils';
import type { TMDBAnime } from '@/types';

interface Props {
  items: TMDBAnime[];
  autoplay?: boolean;
}

export function HeroBanner({ items, autoplay = true }: Props) {
  const [index,     setIndex]     = useState(0);
  const [muted,     setMuted]     = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef    = useRef<HTMLVideoElement>(null);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate    = useNavigate();

  const addToWatchlist    = useUserStore(s => s.addToWatchlist);
  const removeFromWatchlist = useUserStore(s => s.removeFromWatchlist);
  const isInWatchlist     = useUserStore(s => s.isInWatchlist);

  const current = items[index];

  // Auto-avance toutes les 12 secondes
  useEffect(() => {
    if (!autoplay || items.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
      setVideoReady(false);
    }, 12_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length, autoplay]);

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const resume = () => {
    if (!autoplay || items.length < 2) return;
    timerRef.current = setInterval(() => {
      setIndex(i => (i + 1) % items.length);
      setVideoReady(false);
    }, 12_000);
  };

  if (!current) return null;

  const backdrop   = img.backdrop(current.backdrop_path, 'original');
  const poster     = img.poster(current.poster_path, 'w342');
  const inList     = isInWatchlist(current.id);
  const overview   = truncate(stripHtml(current.overview ?? ''), 200);
  const trailer    = current.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

  const handleWatch = () => navigate(`/anime/${current.id}`);

  const handleWatchlist = () => {
    if (inList) {
      removeFromWatchlist(current.id);
    } else {
      addToWatchlist({
        tmdbId:   current.id,
        type:     'tv',
        title:    current.name,
        poster:   current.poster_path,
        backdrop: current.backdrop_path,
        score:    current.vote_average,
        addedAt:  Date.now(),
        genres:   current.genre_ids?.map(String),
      });
    }
  };

  return (
    <div
      className="relative w-full h-[85vh] min-h-[560px] max-h-[900px] overflow-hidden select-none"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-nova-bg via-nova-bg/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-nova-bg via-transparent to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-nova-bg to-transparent" />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id + '-content'}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute bottom-20 left-6 right-6 md:left-16 md:right-auto md:max-w-xl lg:max-w-2xl"
        >
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {current.vote_average >= 8 && (
              <span className="px-2 py-0.5 bg-nova-gold/20 border border-nova-gold/40 text-nova-gold text-xs font-bold rounded-full">
                TOP NOTÉ
              </span>
            )}
            {current.status && (
              <span className="px-2 py-0.5 bg-nova-accent/20 border border-nova-accent/40 text-nova-accent text-xs font-semibold rounded-full">
                {statusLabel(current.status)}
              </span>
            )}
            <span className="flex items-center gap-1 text-nova-gold text-sm font-bold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {current.vote_average.toFixed(1)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-3 drop-shadow-2xl">
            {current.name}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4 text-sm text-nova-text2">
            <span>{current.first_air_date?.slice(0, 4)}</span>
            {current.number_of_seasons && <span>· {current.number_of_seasons} saison{current.number_of_seasons > 1 ? 's' : ''}</span>}
            {current.genres?.slice(0, 3).map(g => (
              <span key={g.id} className="text-nova-text2">· {g.name}</span>
            ))}
          </div>

          {/* Overview */}
          {overview && (
            <p className="text-nova-text2 text-sm md:text-base leading-relaxed mb-6 max-w-lg">
              {overview}
            </p>
          )}

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleWatch}
              className="flex items-center gap-2 px-7 py-3.5 bg-nova-accent hover:bg-nova-accent/90
                text-white font-bold rounded-full shadow-lg shadow-nova-accent/30 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Regarder
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleWatchlist}
              className={`flex items-center gap-2 px-7 py-3.5 border font-bold rounded-full transition-all
                ${inList
                  ? 'bg-nova-accent/20 border-nova-accent text-nova-accent'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                }`}
            >
              {inList ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
                  En liste
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  Ma liste
                </>
              )}
            </motion.button>

            {/* Détails */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/anime/${current.id}`)}
              className="hidden sm:flex items-center gap-2 px-6 py-3.5 bg-white/10 border border-white/20
                text-white font-semibold rounded-full hover:bg-white/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
              </svg>
              Détails
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Carousel indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-6 md:left-16 flex gap-2">
          {items.slice(0, 8).map((_, i) => (
            <button
              key={i}
              onClick={() => { setIndex(i); pause(); resume(); }}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-6 h-2 bg-nova-accent'
                  : 'w-2 h-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Poster (mobile hidden, tablet visible) */}
      {poster && (
        <motion.div
          key={current.id + '-poster'}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-20 right-6 hidden lg:block"
        >
          <img
            src={poster}
            alt={current.name}
            className="w-40 xl:w-48 rounded-xl shadow-2xl ring-1 ring-white/10"
          />
        </motion.div>
      )}
    </div>
  );
}
