import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAnimeDetails, useSources } from '@/hooks/useAnime';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { Lang } from '@/types';

function getTitle(m: any) {
  return m?.title?.userPreferred ?? m?.title?.romaji ?? m?.title?.english ?? '';
}

export default function Watch() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [sp]      = useSearchParams();
  const anilistId = id ? parseInt(id) : null;

  const [currentEp,     setCurrentEp]     = useState(parseInt(sp.get('ep') ?? '1'));
  const [currentSeason, setCurrentSeason] = useState(parseInt(sp.get('season') ?? '1'));
  const [lang, setLang] = useState<Lang>((sp.get('lang') as Lang) ?? 'vostfr');

  const saveProgress   = useUserStore(s => s.saveProgress);
  const defaultLang    = useUserStore(s => s.defaultLang);
  const addToast       = useUserStore(s => s.addToast);

  // Utiliser la langue par défaut si pas spécifiée dans l'URL
  useEffect(() => {
    if (!sp.get('lang')) setLang(defaultLang);
  }, [defaultLang]);

  const { data: anime, isLoading: animeLoading } = useAnimeDetails(anilistId);
  const { data: sourcesData, isLoading: sourcesLoading, refetch } = useSources({
    anilistId: anilistId,
    episode:   currentEp,
    season:    currentSeason,
    lang,
    title:     anime ? getTitle(anime) : undefined,
    titleEn:   anime?.title?.english ?? undefined,
  });

  const totalEps = anime?.episodes ?? 0;
  const hasNext  = currentEp < (totalEps || 9999);
  const hasPrev  = currentEp > 1;

  const goNext = useCallback(() => { if (hasNext) setCurrentEp(e => e + 1); }, [hasNext]);
  const goPrev = useCallback(() => { if (hasPrev) setCurrentEp(e => e - 1); }, [hasPrev]);

  const title  = getTitle(anime);
  const poster = anime?.coverImage?.large ?? anime?.coverImage?.medium ?? null;

  // Sauvegarder la progression
  const handleTimeUpdate = useCallback((time: number, duration: number) => {
    if (!anilistId || !duration || duration < 30) return;
    const progress = Math.round((time / duration) * 100);
    saveProgress({
      tmdbId: anilistId, episode: currentEp, season: currentSeason,
      time, duration, progress, lang, title, poster,
      type: 'tv', updatedAt: Date.now(),
    });
  }, [anilistId, currentEp, currentSeason, lang, title, poster]);

  // Toast quand source chargée
  useEffect(() => {
    if (sourcesData && !sourcesLoading) {
      const providerName = sourcesData.type === 'animesama' ? '✅ Anime-Sama (VOSTFR FR)'
        : sourcesData.type === 'hls' ? '✅ Stream direct'
        : '⚡ VidSrc (fallback)';
      addToast({ type: 'info', message: providerName, duration: 3000 });
    }
  }, [sourcesData?.type]);

  const LANGS: { value: Lang; label: string }[] = [
    { value: 'vostfr', label: 'VOSTFR' },
    { value: 'vf',     label: 'VF'     },
    { value: 'vo',     label: 'VO'     },
  ];

  return (
    <div className="min-h-screen bg-[#080810]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-nova-border/30">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-nova-muted hover:text-nova-text text-sm transition-colors shrink-0">
          ← Retour
        </button>
        {anime && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {poster && <img src={poster} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
            <div className="min-w-0">
              <p className="text-nova-text text-sm font-semibold truncate">{title}</p>
              <p className="text-nova-muted text-xs">
                S{currentSeason} · Ép.{currentEp}{totalEps ? ` / ${totalEps}` : ''}
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-1 shrink-0">
          {LANGS.map(l => (
            <button key={l.value}
              onClick={() => { setLang(l.value); setTimeout(() => refetch(), 100); }}
              className={cn('px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                lang === l.value
                  ? 'bg-nova-accent text-white'
                  : 'bg-nova-bg2 text-nova-muted hover:text-nova-text')}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Player */}
      <div className="w-full max-w-6xl mx-auto">
        {(animeLoading || sourcesLoading) ? (
          <div className="aspect-video bg-black flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
            <div className="text-center">
              <p className="text-nova-muted text-sm animate-pulse">
                {animeLoading ? 'Chargement...' : 'Recherche des sources...'}
              </p>
              {sourcesLoading && (
                <p className="text-nova-muted/50 text-xs mt-1">
                  Anime-Sama → HiAnime → VidSrc
                </p>
              )}
            </div>
          </div>
        ) : sourcesData ? (
          <VideoPlayer
            tmdbId={anilistId!}
            title={`${title} — Ép.${currentEp}`}
            poster={poster}
            sources={sourcesData}
            onNext={hasNext ? goNext : undefined}
            onPrev={hasPrev ? goPrev : undefined}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onTimeUpdate={handleTimeUpdate}
          />
        ) : (
          <div className="aspect-video bg-black flex flex-col items-center justify-center gap-3">
            <p className="text-4xl">😕</p>
            <p className="text-nova-muted text-sm">Impossible de charger les sources</p>
            <button onClick={() => refetch()}
              className="px-4 py-2 bg-nova-accent rounded-lg text-white text-sm font-bold">
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Sélecteur épisodes */}
      {anime && totalEps > 1 && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h3 className="text-sm font-bold text-nova-text mb-3">
            Épisodes — {title}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: Math.min(totalEps, 500) }, (_, i) => i + 1).map(ep => (
              <button key={ep} onClick={() => setCurrentEp(ep)}
                className={cn('w-10 h-10 rounded-lg text-sm font-bold transition-all',
                  ep === currentEp
                    ? 'bg-nova-accent text-white shadow-lg shadow-nova-accent/30'
                    : 'bg-nova-bg2 text-nova-muted hover:bg-nova-border hover:text-nova-text border border-nova-border')}>
                {ep}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Infos */}
      {anime && (
        <div className="max-w-6xl mx-auto px-4 pb-10">
          <div className="flex gap-4 p-4 bg-nova-bg2 rounded-xl border border-nova-border">
            {poster && <img src={poster} alt={title} className="w-20 rounded-lg shrink-0 object-cover self-start" />}
            <div className="min-w-0">
              <h2 className="font-bold text-nova-text mb-1 truncate">{title}</h2>
              {anime.description && (
                <p className="text-xs text-nova-muted leading-relaxed line-clamp-3">
                  {anime.description.replace(/<[^>]*>/g,'')}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {anime.genres?.slice(0,4).map(g => (
                  <span key={g} className="text-[10px] bg-nova-accent/15 text-nova-accent px-2 py-0.5 rounded-full">{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
