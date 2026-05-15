import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimeDetails, useSeason, useAniListSync } from '@/hooks/useAnime';
import { useUserStore } from '@/stores/userStore';
import { img, formatDate, statusLabel } from '@/lib/api';
import { stripHtml, truncate, cn } from '@/lib/utils';
import { AnimeCard } from '@/components/cards/AnimeCard';
import { EpisodeSkeleton } from '@/components/ui/Skeleton';
import type { Lang } from '@/types';

export default function AnimePage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const tmdbId        = Number(id);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [expanded,       setExpanded]       = useState(false);
  const [selectedLang,   setSelectedLang]   = useState<Lang>('vostfr');

  const { data: details, isLoading } = useAnimeDetails(tmdbId);
  const { data: seasonData, isLoading: seasonLoading } = useSeason(tmdbId, selectedSeason);

  const isInWatchlist      = useUserStore(s => s.isInWatchlist);
  const addToWatchlist     = useUserStore(s => s.addToWatchlist);
  const removeFromWatchlist = useUserStore(s => s.removeFromWatchlist);
  const inList             = isInWatchlist(tmdbId);

  const backdrop = img.backdrop(details?.backdrop_path, 'original');
  const poster   = img.poster(details?.poster_path, 'w500');
  const overview = details?.overview ? stripHtml(details.overview) : '';

  const handleWatch = (episode = 1) => {
    navigate(`/watch/${tmdbId}?ep=${episode}&season=${selectedSeason}&lang=${selectedLang}`);
  };

  const handleWatchlist = () => {
    if (inList) {
      removeFromWatchlist(tmdbId);
    } else if (details) {
      addToWatchlist({
        tmdbId,
        type:     'tv',
        title:    details.name,
        poster:   details.poster_path,
        backdrop: details.backdrop_path,
        score:    details.vote_average,
        addedAt:  Date.now(),
        genres:   details.genres?.map(g => g.name),
      });
    }
  };

  const LANGS: { value: Lang; label: string }[] = [
    { value: 'vostfr', label: 'VOSTFR' },
    { value: 'vf',     label: 'VF' },
    { value: 'vo',     label: 'VO (EN)' },
  ];

  if (isLoading) return <AnimePageSkeleton />;
  if (!details) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center text-nova-muted">
      Anime introuvable
    </div>
  );

  return (
    <div className="min-h-screen bg-nova-bg">
      {/* Hero backdrop */}
      <div className="relative h-[55vh] min-h-[380px] overflow-hidden">
        {backdrop && (
          <img src={backdrop} alt="" className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-nova-bg via-nova-bg/50 to-nova-bg/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-nova-bg/80 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-4 md:left-10 flex items-center gap-2 px-3 py-1.5
            bg-black/30 backdrop-blur rounded-full text-white text-sm font-medium
            hover:bg-black/50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Retour
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-10 -mt-44 relative z-10 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-8">

          {/* Poster column */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-48 md:w-full max-w-[280px]"
            >
              {poster && (
                <img
                  src={poster}
                  alt={details.name}
                  className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10"
                />
              )}
            </motion.div>

            {/* Score */}
            <div className="flex items-center gap-3 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(star => (
                    <svg key={star} className={cn('w-4 h-4', star <= Math.round(details.vote_average / 2) ? 'text-nova-gold' : 'text-nova-border')} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-nova-gold text-lg font-black">{details.vote_average.toFixed(1)}/10</span>
                <span className="text-nova-muted text-xs">Note TMDB</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="w-full space-y-2 text-sm">
              {[
                { label: 'Statut',   value: statusLabel(details.status ?? '') },
                { label: 'Saisons',  value: details.number_of_seasons ? `${details.number_of_seasons} saison${details.number_of_seasons > 1 ? 's' : ''}` : null },
                { label: 'Épisodes', value: details.number_of_episodes ? `${details.number_of_episodes} épisodes` : null },
                { label: 'Durée',    value: details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min/ép` : null },
                { label: 'Début',    value: formatDate(details.first_air_date) },
              ].filter(s => s.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-nova-muted text-xs">{label}</span>
                  <span className="text-nova-text text-xs font-semibold text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>

            {/* Studios */}
            {details.networks?.length ? (
              <div className="w-full">
                <p className="text-nova-muted text-xs mb-1.5">Diffusé sur</p>
                <div className="flex flex-wrap gap-2">
                  {details.networks.map(n => (
                    <span key={n.id} className="text-xs bg-nova-bg3 border border-nova-border rounded-md px-2 py-1 text-nova-text2">
                      {n.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Info column */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {details.genres?.map(g => (
                  <span key={g.id} className="px-3 py-1 bg-nova-bg3 border border-nova-border rounded-full text-xs font-medium text-nova-text2">
                    {g.name}
                  </span>
                ))}
                {details.status === 'Returning Series' && (
                  <span className="px-3 py-1 bg-nova-success/20 border border-nova-success/40 rounded-full text-xs font-bold text-nova-success">
                    En cours
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-nova-text leading-tight mb-1">
                {details.name}
              </h1>
              {details.original_name !== details.name && (
                <p className="text-nova-muted text-sm mb-4">{details.original_name}</p>
              )}

              {/* Overview */}
              <div className="mb-6">
                <p className={cn('text-nova-text2 text-sm md:text-base leading-relaxed', !expanded && 'line-clamp-4')}>
                  {overview}
                </p>
                {overview.length > 300 && (
                  <button
                    onClick={() => setExpanded(v => !v)}
                    className="text-nova-accent text-xs font-semibold mt-1 hover:underline"
                  >
                    {expanded ? 'Voir moins ↑' : 'Voir plus ↓'}
                  </button>
                )}
              </div>

              {/* Lang selector */}
              <div className="flex gap-2 mb-5">
                {LANGS.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setSelectedLang(l.value)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-bold transition-all border',
                      selectedLang === l.value
                        ? 'bg-nova-accent border-nova-accent text-white shadow-lg shadow-nova-accent/30'
                        : 'bg-transparent border-nova-border text-nova-muted hover:text-nova-text hover:border-nova-text/30'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-8">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleWatch(1)}
                  className="flex items-center gap-2 px-8 py-3.5 bg-nova-accent rounded-full
                    text-white font-bold shadow-lg shadow-nova-accent/30 hover:bg-nova-accent/90 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  Regarder · Ép. 1
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleWatchlist}
                  className={cn(
                    'flex items-center gap-2 px-8 py-3.5 rounded-full font-bold border transition-all',
                    inList
                      ? 'bg-nova-accent/10 border-nova-accent text-nova-accent'
                      : 'bg-nova-bg2 border-nova-border text-nova-text hover:border-nova-text/50'
                  )}
                >
                  {inList ? (
                    <><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Dans ma liste</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Ma liste</>
                  )}
                </motion.button>
              </div>

              {/* Seasons & Episodes */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-nova-text">Épisodes</h2>
                  {details.number_of_seasons && details.number_of_seasons > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                      {Array.from({ length: details.number_of_seasons }, (_, i) => i + 1).map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedSeason(s)}
                          className={cn(
                            'shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                            s === selectedSeason
                              ? 'bg-nova-accent text-white'
                              : 'bg-nova-bg2 text-nova-muted hover:text-nova-text border border-nova-border'
                          )}
                        >
                          S{s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {seasonLoading ? (
                  <EpisodeSkeleton count={12} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                    {seasonData?.episodes?.map(ep => (
                      <motion.button
                        key={ep.episode_number}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        onClick={() => handleWatch(ep.episode_number)}
                        className="group text-left rounded-xl overflow-hidden border border-nova-border
                          hover:border-nova-accent/50 transition-all bg-nova-bg2 hover:bg-nova-bg3"
                      >
                        <div className="relative aspect-video overflow-hidden bg-nova-bg3">
                          {ep.still_path ? (
                            <img
                              src={img.still(ep.still_path, 'w185') ?? ''}
                              alt={ep.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-3xl font-black text-nova-border">{ep.episode_number}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-nova-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg">
                              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-bold text-nova-text truncate">{ep.name}</p>
                          <p className="text-[10px] text-nova-muted">Ép. {ep.episode_number}{ep.runtime ? ` · ${ep.runtime}min` : ''}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recommendations */}
        {details.recommendations && details.recommendations.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-nova-text mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-nova-accent rounded-full" />
              Tu pourrais aussi aimer
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8">
              {details.recommendations.slice(0, 16).map(r => (
                <AnimeCard key={r.id} anime={r} compact />
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {details.credits?.cast && details.credits.cast.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-nova-text mb-5 flex items-center gap-2">
              <span className="w-1 h-6 bg-nova-purple rounded-full" />
              Doublage / Cast
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
              {details.credits.cast.slice(0, 12).map(c => (
                <div key={c.id} className="shrink-0 w-24 text-center">
                  <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-nova-bg3 mb-2">
                    {c.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                        alt={c.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-nova-muted text-2xl">👤</div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-nova-text truncate">{c.name}</p>
                  <p className="text-[10px] text-nova-muted truncate">{c.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnimePageSkeleton() {
  return (
    <div className="min-h-screen bg-nova-bg animate-pulse">
      <div className="h-[55vh] bg-nova-bg2" />
      <div className="max-w-screen-xl mx-auto px-4 md:px-10 -mt-44 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        <div className="h-80 bg-nova-bg3 rounded-2xl" />
        <div className="space-y-4 pt-8">
          <div className="h-12 bg-nova-bg3 rounded-xl w-3/4" />
          <div className="h-4 bg-nova-bg3 rounded w-1/2" />
          <div className="h-20 bg-nova-bg3 rounded-xl" />
          <div className="flex gap-3">
            <div className="h-12 w-40 bg-nova-bg3 rounded-full" />
            <div className="h-12 w-40 bg-nova-bg3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
