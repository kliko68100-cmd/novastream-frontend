import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { img, formatScore } from '@/lib/api';
import { useUserStore } from '@/stores/userStore';
import { truncate, stripHtml, epLabel } from '@/lib/utils';
import type { TMDBAnime, WatchProgress } from '@/types';

// ── AnimeCard ─────────────────────────────────────────────────────

interface CardProps {
  anime:    TMDBAnime;
  progress?: WatchProgress;
  compact?: boolean;
  rank?:    number;
}

export function AnimeCard({ anime, progress, compact, rank }: CardProps) {
  const [hovered,   setHovered]   = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const navigate = useNavigate();
  const cardRef  = useRef<HTMLDivElement>(null);

  const poster = img.poster(anime.poster_path, 'w342');

  return (
    <div
      ref={cardRef}
      className="relative group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/anime/${anime.id}`)}
    >
      {/* Rank badge */}
      {rank !== undefined && (
        <div className="absolute -left-2 top-2 z-10 w-8 h-8 bg-nova-accent rounded-full flex items-center justify-center shadow-lg">
          <span className="text-xs font-black text-white">{rank + 1}</span>
        </div>
      )}

      {/* Card image */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-nova-card">
        {poster ? (
          <img
            src={poster}
            alt={anime.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500
              group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-nova-bg3">
            <span className="text-nova-muted text-4xl">🎬</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-nova-accent/90 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>

        {/* Score badge */}
        {anime.vote_average > 0 && !compact && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
            <svg className="w-3 h-3 text-nova-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span className="text-xs font-bold text-white">{anime.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Progress bar */}
        {progress && progress.progress > 0 && progress.progress < 95 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <motion.div
              className="h-full bg-nova-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* Continue badge */}
        {progress && (
          <div className="absolute bottom-2 left-2 text-[10px] bg-nova-accent/90 text-white rounded px-1.5 py-0.5 font-semibold">
            {epLabel(progress.season, progress.episode)}
          </div>
        )}
      </div>

      {/* Title below */}
      {!compact && (
        <div className="mt-2 px-0.5">
          <p className="text-xs font-semibold text-nova-text truncate leading-tight">
            {anime.name}
          </p>
          {anime.first_air_date && (
            <p className="text-[10px] text-nova-muted mt-0.5">
              {anime.first_air_date.slice(0, 4)}
            </p>
          )}
        </div>
      )}

      {/* Hover card (desktop only) */}
      <AnimatePresence>
        {hovered && !compact && (
          <HoverCard anime={anime} cardRef={cardRef} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── HoverCard Netflix style ───────────────────────────────────────

function HoverCard({ anime, cardRef }: { anime: TMDBAnime; cardRef: React.RefObject<HTMLDivElement> }) {
  const navigate = useNavigate();
  const addToWatchlist    = useUserStore(s => s.addToWatchlist);
  const removeFromWatchlist = useUserStore(s => s.removeFromWatchlist);
  const isInWatchlist     = useUserStore(s => s.isInWatchlist);
  const inList = isInWatchlist(anime.id);

  const backdrop = img.backdrop(anime.backdrop_path, 'w780');
  const overview = truncate(stripHtml(anime.overview ?? ''), 120);

  // Détection position (dépasse à droite?)
  const rect     = cardRef.current?.getBoundingClientRect();
  const toRight  = !rect || rect.left < window.innerWidth * 0.6;

  const handleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inList) {
      removeFromWatchlist(anime.id);
    } else {
      addToWatchlist({
        tmdbId: anime.id, type: 'tv', title: anime.name,
        poster: anime.poster_path, backdrop: anime.backdrop_path,
        score: anime.vote_average, addedAt: Date.now(),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.15 }}
      onClick={e => { e.stopPropagation(); navigate(`/anime/${anime.id}`); }}
      className={`absolute z-30 w-64 rounded-xl overflow-hidden shadow-2xl shadow-black/60
        border border-nova-border bg-nova-card cursor-pointer
        hidden md:block
        ${toRight ? 'left-0' : 'right-0'} top-0`}
      style={{ transform: 'scale(1.08)', transformOrigin: toRight ? 'top left' : 'top right' }}
    >
      {/* Backdrop */}
      <div className="relative aspect-video overflow-hidden">
        {backdrop ? (
          <img src={backdrop} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-nova-bg3" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-nova-card via-transparent to-transparent" />

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-nova-bg ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-bold text-sm text-nova-text leading-tight">{anime.name}</p>
          <button
            onClick={handleWatchlist}
            className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all
              ${inList
                ? 'bg-nova-accent border-nova-accent text-white'
                : 'border-nova-border text-nova-text2 hover:border-nova-text'
              }`}
          >
            {inList
              ? <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>
              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            }
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 mb-2 text-[11px] flex-wrap">
          <span className="flex items-center gap-0.5 text-nova-gold font-bold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {anime.vote_average.toFixed(1)}
          </span>
          {anime.first_air_date && (
            <span className="text-nova-muted">{anime.first_air_date.slice(0, 4)}</span>
          )}
          {anime.number_of_seasons && (
            <span className="text-nova-muted">{anime.number_of_seasons} S</span>
          )}
        </div>

        {/* Genres */}
        {anime.genre_ids && (
          <div className="flex flex-wrap gap-1 mb-2">
            {anime.genre_ids.slice(0, 3).map(id => (
              <span key={id} className="text-[10px] px-2 py-0.5 bg-nova-border rounded-full text-nova-text2">
                {GENRE_MAP[id] ?? id}
              </span>
            ))}
          </div>
        )}

        {/* Overview */}
        {overview && (
          <p className="text-[11px] text-nova-text2 leading-relaxed line-clamp-3">{overview}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Genre map (TMDB IDs) ──────────────────────────────────────────

const GENRE_MAP: Record<number, string> = {
  16: 'Animation', 28: 'Action', 35: 'Comédie', 18: 'Drame',
  10765: 'Sci-Fi', 9648: 'Mystère', 14: 'Fantastique', 27: 'Horreur',
  10749: 'Romance', 12: 'Aventure', 878: 'Science-Fiction', 53: 'Thriller',
};
