import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { EpisodeSkeleton } from '@/components/ui/Skeleton';
import { useAnimeDetails, useSeason, useSources, useAniListSync } from '@/hooks/useAnime';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { img, statusLabel } from '@/lib/api';
import { epLabel, stripHtml, truncate, cn } from '@/lib/utils';
import type { Lang } from '@/types';

export default function Watch() {
  const { id }            = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate          = useNavigate();
  const tmdbId            = Number(id);

  const initialEp     = Number(params.get('ep'))     || 1;
  const initialSeason = Number(params.get('season')) || 1;
  const initialLang   = (params.get('lang') as Lang) || undefined;

  const defaultLang   = useUserStore(s => s.defaultLang);
  const lang          = initialLang ?? defaultLang;

  const { episode, season, setContext } = usePlayerStore();
  const [currentEp,   setCurrentEp]   = useState(initialEp);
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentLang, setCurrentLang] = useState<Lang>(lang);
  const [provider,    setProvider]    = useState('HiAnime');
  const [epGrid,      setEpGrid]      = useState(false);

  const { data: details, isLoading: detailsLoading } = useAnimeDetails(tmdbId);
  const { data: seasonData }                         = useSeason(tmdbId, currentSeason);
  const { data: sources, isLoading: sourcesLoading, error: sourcesError, refetch: refetchSources } =
    useSources({ tmdbId, episode: currentEp, season: currentSeason, lang: currentLang, provider, title: details?.name });

  const { updateEntry } = useAniListSync();

  const totalEps    = seasonData?.episodes?.length ?? details?.number_of_episodes ?? 0;
  const totalSeasons = details?.number_of_seasons ?? 1;

  // Sync player store
  useEffect(() => {
    setContext(tmdbId, currentSeason, currentEp, totalEps);
  }, [tmdbId, currentSeason, currentEp, totalEps]);

  // Update URL sans reload
  useEffect(() => {
    setParams({ ep: String(currentEp), season: String(currentSeason), lang: currentLang }, { replace: true });
  }, [currentEp, currentSeason, currentLang]);

  // Sync AniList progress
  useEffect(() => {
    if (details && currentEp > 1) {
      updateEntry.mutate({
        mediaId:  details.external_ids?.mal_id ?? tmdbId,
        status:   'CURRENT',
        progress: currentEp - 1,
      });
    }
  }, [currentEp]);

  const handleNext = () => {
    if (currentEp < totalEps) setCurrentEp(e => e + 1);
    else if (currentSeason < totalSeasons) {
      setCurrentSeason(s => s + 1);
      setCurrentEp(1);
    }
  };

  const handlePrev = () => {
    if (currentEp > 1) setCurrentEp(e => e - 1);
  };

  const currentEpData = seasonData?.episodes?.find(ep => ep.episode_number === currentEp);
  const poster  = img.poster(details?.poster_path, 'w342');
  const backdrop = img.backdrop(details?.backdrop_path, 'w1280');
  const PROVIDERS = ['HiAnime', 'Gogoanime', 'AnimePahe'];
  const LANGS: { value: Lang; label: string }[] = [
    { value: 'vostfr', label: 'VOSTFR' },
    { value: 'vf',     label: 'VF' },
    { value: 'vo',     label: 'VO' },
  ];

  return (
    <div className="min-h-screen bg-nova-bg">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-1.5 bg-nova-bg2/90 backdrop-blur border border-nova-border
            rounded-full text-nova-text2 hover:text-nova-text text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Retour
        </button>
      </div>

      {/* Player */}
      <div className="w-full">
        {sourcesLoading ? (
          <div className="aspect-video bg-nova-bg2 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-nova-text2">
              <div className="w-12 h-12 rounded-full border-4 border-nova-accent/30 border-t-nova-accent animate-spin" />
              <p className="text-sm">Chargement des sources...</p>
              <p className="text-xs text-nova-muted">Provider : {provider}</p>
            </div>
          </div>
        ) : sourcesError || !sources ? (
          <div className="aspect-video bg-nova-bg2 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-4xl mb-4">⚠️</p>
              <p className="text-nova-text font-semibold mb-2">Sources indisponibles</p>
              <p className="text-nova-muted text-sm mb-4">Essaie un autre provider ou une autre langue</p>
              <button
                onClick={() => refetchSources()}
                className="px-4 py-2 bg-nova-accent rounded-lg text-white text-sm font-semibold hover:bg-nova-accent/90"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : (
          <VideoPlayer
            tmdbId={tmdbId}
            title={`${details?.name ?? 'NovaStream'} — ${epLabel(currentSeason, currentEp)}`}
            poster={img.still(currentEpData?.still_path) ?? poster}
            sources={sources}
            onNext={handleNext}
            onPrev={handlePrev}
            hasNext={currentEp < totalEps || currentSeason < totalSeasons}
            hasPrev={currentEp > 1}
          />
        )}
      </div>

      {/* Controls bar */}
      <div className="sticky top-0 z-10 bg-nova-bg/95 backdrop-blur border-b border-nova-border">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">

          {/* Episode info */}
          <div className="flex-1 min-w-0">
            {currentEpData ? (
              <div>
                <p className="text-xs text-nova-muted font-medium">
                  {details?.name} · {epLabel(currentSeason, currentEp)}
                </p>
                <p className="text-sm font-bold text-nova-text truncate">{currentEpData.name}</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-nova-text">
                {details?.name} — Épisode {currentEp}
              </p>
            )}
          </div>

          {/* Lang selector */}
          <div className="flex gap-1 bg-nova-bg2 rounded-lg p-0.5">
            {LANGS.map(l => (
              <button
                key={l.value}
                onClick={() => setCurrentLang(l.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-bold transition-all',
                  currentLang === l.value
                    ? 'bg-nova-accent text-white shadow-sm'
                    : 'text-nova-muted hover:text-nova-text'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Provider selector */}
          <select
            value={provider}
            onChange={e => setProvider(e.target.value)}
            className="bg-nova-bg2 border border-nova-border text-nova-text2 text-xs rounded-lg px-3 py-1.5
              focus:outline-none focus:border-nova-accent cursor-pointer"
          >
            {PROVIDERS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Toggle episode grid */}
          <button
            onClick={() => setEpGrid(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border',
              epGrid ? 'bg-nova-accent/20 border-nova-accent text-nova-accent' : 'border-nova-border text-nova-muted hover:text-nova-text'
            )}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Épisodes
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

        {/* Left: Episode grid + info */}
        <div className="space-y-6">

          {/* Season selector */}
          {totalSeasons > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {Array.from({ length: totalSeasons }, (_, i) => i + 1).map(s => (
                <button
                  key={s}
                  onClick={() => { setCurrentSeason(s); setCurrentEp(1); }}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    s === currentSeason
                      ? 'bg-nova-accent text-white'
                      : 'bg-nova-bg2 text-nova-muted hover:text-nova-text border border-nova-border'
                  )}
                >
                  Saison {s}
                </button>
              ))}
            </div>
          )}

          {/* Episode grid */}
          {epGrid && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
            >
              {seasonData?.episodes?.map(ep => (
                <button
                  key={ep.episode_number}
                  onClick={() => setCurrentEp(ep.episode_number)}
                  className={cn(
                    'group text-left rounded-lg overflow-hidden border transition-all',
                    ep.episode_number === currentEp
                      ? 'border-nova-accent ring-2 ring-nova-accent/30'
                      : 'border-nova-border hover:border-nova-text/30'
                  )}
                >
                  {ep.still_path ? (
                    <div className="relative aspect-video overflow-hidden bg-nova-bg3">
                      <img
                        src={img.still(ep.still_path, 'w185') ?? ''}
                        alt={ep.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {ep.episode_number === currentEp && (
                        <div className="absolute inset-0 bg-nova-accent/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-nova-accent flex items-center justify-center">
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video bg-nova-bg3 flex items-center justify-center text-nova-muted">
                      <span className="text-2xl font-black">{ep.episode_number}</span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-bold text-nova-text truncate">{ep.name}</p>
                    <p className="text-[10px] text-nova-muted">Ép. {ep.episode_number}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* Episode description */}
          {currentEpData?.overview && (
            <div className="bg-nova-bg2 rounded-xl p-4 border border-nova-border">
              <h3 className="text-sm font-bold text-nova-text mb-2">À propos de cet épisode</h3>
              <p className="text-sm text-nova-text2 leading-relaxed">{currentEpData.overview}</p>
              {currentEpData.vote_average > 0 && (
                <div className="flex items-center gap-1 mt-3 text-nova-gold text-xs font-bold">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {currentEpData.vote_average.toFixed(1)} / 10
                </div>
              )}
            </div>
          )}

          {/* Next / Prev buttons mobile */}
          <div className="flex gap-3 lg:hidden">
            <button
              onClick={handlePrev}
              disabled={currentEp <= 1}
              className="flex-1 py-3 border border-nova-border rounded-xl text-sm font-semibold
                text-nova-text2 hover:text-nova-text hover:border-nova-text/50
                disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Épisode {currentEp - 1}
            </button>
            <button
              onClick={handleNext}
              disabled={currentEp >= totalEps && currentSeason >= totalSeasons}
              className="flex-1 py-3 bg-nova-accent rounded-xl text-sm font-bold
                text-white hover:bg-nova-accent/90
                disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Épisode {currentEp + 1} →
            </button>
          </div>
        </div>

        {/* Right: Anime info sidebar */}
        <aside className="space-y-5">
          {/* Anime card */}
          <div className="bg-nova-bg2 rounded-xl border border-nova-border overflow-hidden">
            {backdrop && (
              <div className="relative h-28 overflow-hidden">
                <img src={backdrop} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-nova-bg2 to-transparent" />
              </div>
            )}
            <div className="p-4 flex gap-3">
              {poster && (
                <img src={poster} alt={details?.name} className="w-16 rounded-lg shrink-0 shadow-lg" />
              )}
              <div className="min-w-0">
                <Link
                  to={`/anime/${tmdbId}`}
                  className="text-sm font-bold text-nova-text hover:text-nova-accent transition-colors line-clamp-2"
                >
                  {details?.name}
                </Link>
                {details?.status && (
                  <p className="text-xs text-nova-muted mt-1">{statusLabel(details.status)}</p>
                )}
                <div className="flex items-center gap-1 mt-1 text-nova-gold text-xs font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {details?.vote_average.toFixed(1)}
                </div>
              </div>
            </div>

            {details?.overview && (
              <div className="px-4 pb-4">
                <p className="text-xs text-nova-text2 leading-relaxed line-clamp-3">
                  {truncate(stripHtml(details.overview), 150)}
                </p>
              </div>
            )}
          </div>

          {/* Source info */}
          {sources && (
            <div className="bg-nova-bg2 rounded-xl border border-nova-border p-4 space-y-2">
              <p className="text-xs font-bold text-nova-text mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-nova-success animate-pulse" />
                Sources disponibles
              </p>
              {sources.sources.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-nova-muted">{s.quality || 'Auto'}</span>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full font-semibold',
                    s.isM3U8 ? 'bg-nova-success/20 text-nova-success' : 'bg-nova-muted/20 text-nova-muted'
                  )}>
                    {s.isM3U8 ? 'HLS' : 'Direct'}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-nova-border">
                <p className="text-xs text-nova-muted">
                  Provider : <span className="text-nova-text font-semibold">{sources.providerName}</span>
                </p>
                <p className="text-xs text-nova-muted mt-1">
                  Sous-titres : <span className="text-nova-text font-semibold">
                    {sources.subtitles.length > 0
                      ? sources.subtitles.map(s => s.label).join(', ')
                      : 'Aucun'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Quick episode list */}
          {seasonData?.episodes && (
            <div className="bg-nova-bg2 rounded-xl border border-nova-border overflow-hidden">
              <p className="text-xs font-bold text-nova-text px-4 py-3 border-b border-nova-border">
                Épisodes — Saison {currentSeason}
              </p>
              <div className="overflow-y-auto max-h-80 divide-y divide-nova-border/50">
                {seasonData.episodes.map(ep => (
                  <button
                    key={ep.episode_number}
                    onClick={() => setCurrentEp(ep.episode_number)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors',
                      ep.episode_number === currentEp && 'bg-nova-accent/10'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-black w-6 shrink-0 tabular-nums',
                      ep.episode_number === currentEp ? 'text-nova-accent' : 'text-nova-muted'
                    )}>
                      {ep.episode_number}
                    </span>
                    {ep.still_path && (
                      <img
                        src={img.still(ep.still_path, 'w92') ?? ''}
                        alt=""
                        className="w-12 aspect-video object-cover rounded shrink-0"
                        loading="lazy"
                      />
                    )}
                    <span className={cn(
                      'text-xs truncate',
                      ep.episode_number === currentEp ? 'text-nova-text font-semibold' : 'text-nova-text2'
                    )}>
                      {ep.name}
                    </span>
                    {ep.episode_number === currentEp && (
                      <svg className="w-4 h-4 text-nova-accent shrink-0 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
