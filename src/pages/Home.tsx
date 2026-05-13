import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HeroBanner } from '@/components/home/HeroBanner';
import { AnimeRow } from '@/components/home/AnimeRow';
import { AnimeCard } from '@/components/cards/AnimeCard';
import { HeroSkeleton, RowSkeleton } from '@/components/ui/Skeleton';
import { useTrending, usePopular, useTopRated, useOnAir, useAniListTrending, useAniListSeasonal } from '@/hooks/useAnime';
import { useUserStore } from '@/stores/userStore';
import type { TMDBAnime } from '@/types';

export default function Home() {
  const { data: trending, isLoading: trendingLoading } = useTrending();
  const { data: popular,  isLoading: popularLoading  } = usePopular();
  const { data: topRated, isLoading: topRatedLoading } = useTopRated();
  const { data: onAir,    isLoading: onAirLoading    } = useOnAir();
  const { data: seasonal }                             = useAniListSeasonal();

  const history      = useUserStore(s => s.history);
  const continueList = useUserStore(s => s.getContinueWatching)();
  const watchlist    = useUserStore(s => s.watchlist);

  // Filtrage : ne garder que les anime (genre animation)
  const filterAnime = (items: TMDBAnime[] = []) =>
    items.filter(i => i.genre_ids?.includes(16) || i.original_name);

  const heroItems    = useMemo(() => filterAnime(trending?.results).slice(0, 8), [trending]);
  const popularItems = useMemo(() => filterAnime(popular?.results),  [popular]);
  const topItems     = useMemo(() => filterAnime(topRated?.results), [topRated]);
  const onAirItems   = useMemo(() => filterAnime(onAir?.results),    [onAir]);

  // Reconstruit les TMDBAnime depuis l'historique pour "Continue Watching"
  const continueAnimes: TMDBAnime[] = continueList
    .map(p => ({
      id: p.tmdbId, name: p.title, original_name: p.title,
      poster_path: p.poster, backdrop_path: null,
      overview: '', vote_average: 0, first_air_date: '', genre_ids: [16],
    }));

  // Watchlist items as TMDBAnime
  const watchlistAnimes: TMDBAnime[] = watchlist
    .slice(0, 12)
    .map(w => ({
      id: w.tmdbId, name: w.title, original_name: w.title,
      poster_path: w.poster, backdrop_path: w.backdrop,
      overview: '', vote_average: w.score, first_air_date: '', genre_ids: [16],
    }));

  return (
    <div className="min-h-screen bg-nova-bg">
      {/* Hero */}
      {trendingLoading ? (
        <HeroSkeleton />
      ) : (
        <HeroBanner items={heroItems} />
      )}

      {/* Content */}
      <div className="relative z-10 -mt-16 space-y-10 pb-32">

        {/* Continue Watching */}
        {continueList.length > 0 && (
          <section>
            <AnimeRow
              title="Continuer à regarder"
              items={continueAnimes}
              progress={continueList}
            />
          </section>
        )}

        {/* En cours de diffusion */}
        <section>
          {onAirLoading ? (
            <RowSkeleton />
          ) : (
            <AnimeRow
              title="🔴 En cours de diffusion"
              items={onAirItems}
              loading={onAirLoading}
              viewAllHref="/anime?sort=on_air"
            />
          )}
        </section>

        {/* Saisonnier AniList */}
        {seasonal?.results?.length > 0 && (
          <section>
            <SectionHeader
              title={`Saison ${seasonLabel(seasonal.season)} ${seasonal.year}`}
              subtitle="Les sorties de cette saison"
            />
            <div className="px-4 md:px-10 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
              {seasonal.results.slice(0, 16).map((media: any) => (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                >
                  {/* AniList card → convertit en format TMDB-like */}
                  <AniListCard media={media} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Populaires */}
        {popularLoading ? (
          <RowSkeleton />
        ) : (
          <AnimeRow
            title="🔥 Populaires en ce moment"
            items={popularItems}
            loading={popularLoading}
            viewAllHref="/anime?sort=popular"
          />
        )}

        {/* Top notés */}
        {topRatedLoading ? (
          <RowSkeleton />
        ) : (
          <AnimeRow
            title="⭐ Les mieux notés"
            items={topItems}
            loading={topRatedLoading}
            showRank
            viewAllHref="/anime?sort=top_rated"
          />
        )}

        {/* Ma liste */}
        {watchlistAnimes.length > 0 && (
          <AnimeRow
            title="📋 Ma liste"
            items={watchlistAnimes}
            viewAllHref="/watchlist"
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-composants ────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4 md:px-10 mb-4">
      <h2 className="text-base md:text-lg font-bold text-nova-text flex items-center gap-2">
        <span className="w-1 h-5 bg-nova-purple rounded-full inline-block" />
        {title}
      </h2>
      {subtitle && <p className="text-xs text-nova-muted mt-0.5 ml-3">{subtitle}</p>}
    </div>
  );
}

function AniListCard({ media }: { media: any }) {
  // Convertit AniList media en format compatible AnimeCard
  // On utilise l'ID AniList pour la navigation
  const fakeAnime: TMDBAnime = {
    id: media.id, // Note: utilise anilist ID ici
    name: media.title.userPreferred ?? media.title.romaji,
    original_name: media.title.native,
    overview: media.description ?? '',
    poster_path: null, // On utilise coverImage directement
    backdrop_path: null,
    vote_average: (media.averageScore ?? 0) / 10,
    first_air_date: media.startDate?.year ? `${media.startDate.year}-01-01` : '',
    genre_ids: [16],
  };

  return (
    <div className="relative group cursor-pointer" onClick={() => window.location.href = `/anime/${media.id}`}>
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-nova-card">
        {media.coverImage?.large && (
          <img
            src={media.coverImage.large}
            alt={fakeAnime.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ borderTop: media.coverImage.color ? `3px solid ${media.coverImage.color}` : undefined }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="mt-1.5 text-xs font-semibold text-nova-text truncate">{fakeAnime.name}</p>
      {media.nextAiringEpisode && (
        <p className="text-[10px] text-nova-accent">
          Ép. {media.nextAiringEpisode.episode} dans{' '}
          {Math.ceil((media.nextAiringEpisode.airingAt * 1000 - Date.now()) / 86_400_000)}j
        </p>
      )}
    </div>
  );
}

function seasonLabel(season?: string): string {
  const map: Record<string, string> = { WINTER: 'Hiver', SPRING: 'Printemps', SUMMER: 'Été', FALL: 'Automne' };
  return map[season ?? ''] ?? season ?? '';
}
