import { useRef } from 'react';
import { motion } from 'framer-motion';
import { AnimeCard } from '@/components/cards/AnimeCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import type { TMDBAnime, WatchProgress } from '@/types';

interface Props {
  title:      string;
  items?:     TMDBAnime[];
  loading?:   boolean;
  progress?:  WatchProgress[];
  showRank?:  boolean;
  skeletonCount?: number;
  viewAllHref?: string;
}

export function AnimeRow({
  title,
  items,
  loading,
  progress,
  showRank,
  skeletonCount = 8,
  viewAllHref,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <section className="relative group/row">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4 md:px-10">
        <motion.h2
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-base md:text-lg font-bold text-nova-text flex items-center gap-2"
        >
          <span className="w-1 h-5 bg-nova-accent rounded-full inline-block" />
          {title}
        </motion.h2>
        {viewAllHref && (
          <a
            href={viewAllHref}
            className="text-xs text-nova-accent hover:text-nova-accent/80 font-semibold transition-colors
              opacity-0 group-hover/row:opacity-100 transition-all"
          >
            Voir tout →
          </a>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Arrow left */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center
            bg-gradient-to-r from-nova-bg to-transparent
            opacity-0 group-hover/row:opacity-100 transition-opacity
            hover:from-nova-bg2"
          aria-label="Défiler à gauche"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-10 pb-4 pt-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => (
                <div key={i} className="shrink-0 w-[120px] sm:w-[140px] md:w-[160px]">
                  <CardSkeleton />
                </div>
              ))
            : items?.map((anime, i) => (
                <div key={anime.id} className="shrink-0 w-[120px] sm:w-[140px] md:w-[160px]">
                  <AnimeCard
                    anime={anime}
                    progress={progress?.find(p => p.tmdbId === anime.id)}
                    rank={showRank ? i : undefined}
                  />
                </div>
              ))}
        </div>

        {/* Arrow right */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center
            bg-gradient-to-l from-nova-bg to-transparent
            opacity-0 group-hover/row:opacity-100 transition-opacity
            hover:from-nova-bg2"
          aria-label="Défiler à droite"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>
    </section>
  );
}
