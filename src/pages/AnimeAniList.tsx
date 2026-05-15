import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { anilistApi } from '@/lib/api';
import { useUserStore } from '@/stores/userStore';
import { stripHtml, truncate, cn } from '@/lib/utils';
import type { Lang } from '@/types';

export default function AnimeAniListPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const anilistId = Number(id);
  const [selectedLang, setSelectedLang] = useState<Lang>('vostfr');

  const { data: media, isLoading } = useQuery({
    queryKey: ['anilist', 'media', anilistId],
    queryFn:  () => anilistApi.media(anilistId),
    enabled:  !!anilistId,
    staleTime: 60 * 60_000,
  });

  const isInWatchlist       = useUserStore(s => s.isInWatchlist);
  const addToWatchlist      = useUserStore(s => s.addToWatchlist);
  const removeFromWatchlist = useUserStore(s => s.removeFromWatchlist);

  if (isLoading) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
    </div>
  );

  if (!media) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center text-nova-muted">
      Anime introuvable
    </div>
  );

  const title    = media.title?.userPreferred ?? media.title?.romaji ?? 'Sans titre';
  const banner   = media.bannerImage;
  const cover    = media.coverImage?.large;
  const score    = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
  const genres   = media.genres ?? [];
  const episodes = media.episodes ?? '?';
  const status   = media.status;
  const year     = media.seasonYear ?? media.startDate?.year;
  const desc     = media.description ? stripHtml(media.description) : '';
  const inList   = isInWatchlist(anilistId);

  // On utilise l'AniList ID directement — le backend gère le mapping
  const handleWatch = (ep = 1) => {
    navigate(`/watch/${anilistId}?ep=${ep}&lang=${selectedLang}`);
  };

  const handleWatchlist = () => {
    if (inList) {
      removeFromWatchlist(anilistId);
    } else {
      addToWatchlist({
        tmdbId:   anilistId,
        type:     'tv',
        title,
        poster:   cover ?? null,
        backdrop: banner ?? null,
        score:    media.averageScore ? media.averageScore / 10 : 0,
        addedAt:  Date.now(),
        genres,
      });
    }
  };

  const LANGS: { value: Lang; label: string }[] = [
    { value: 'vostfr', label: 'VOSTFR' },
    { value: 'vf',     label: 'VF'     },
    { value: 'vo',     label: 'VO (EN)'},
  ];

  return (
    <div className="min-h-screen bg-nova-bg">
      {/* Banner */}
      <div className="relative h-[50vh] min-h-[300px] overflow-hidden">
        {banner
          ? <img src={banner} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-nova-bg2" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-nova-bg via-nova-bg/60 to-transparent" />
      </div>

      <div className="relative -mt-32 z-10 max-w-5xl mx-auto px-4 pb-20">
        <div className="flex flex-col md:flex-row gap-8">

          {cover && (
            <div className="flex-shrink-0">
              <img src={cover} alt={title}
                className="w-48 rounded-xl shadow-2xl border border-nova-border" />
            </div>
          )}

          <div className="flex-1 pt-4">
            <h1 className="text-3xl font-black text-nova-text mb-2">{title}</h1>

            <div className="flex flex-wrap gap-2 mb-4 text-sm text-nova-muted">
              {score    && <span className="text-yellow-400 font-bold">⭐ {score}</span>}
              {year     && <span>{year}</span>}
              {episodes && <span>{episodes} épisodes</span>}
              {status   && <span className="bg-nova-bg2 px-2 py-0.5 rounded-full">{status}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {genres.slice(0, 5).map((g: string) => (
                <span key={g} className="text-xs bg-nova-accent/20 text-nova-accent px-2 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>

            {desc && (
              <p className="text-nova-muted text-sm leading-relaxed mb-6">
                {truncate(desc, 300)}
              </p>
            )}

            <div className="flex gap-2 mb-4">
              {LANGS.map(l => (
                <button key={l.value} onClick={() => setSelectedLang(l.value)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedLang === l.value
                      ? 'bg-nova-accent text-white'
                      : 'bg-nova-bg2 text-nova-muted hover:text-nova-text'
                  )}>
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleWatch(1)}
                className="flex items-center gap-2 px-6 py-3 bg-nova-accent rounded-full
                  text-white font-bold hover:bg-nova-accent/90 transition-all">
                ▶ Regarder
              </button>
              <button onClick={handleWatchlist}
                className="px-6 py-3 bg-nova-bg2 rounded-full text-nova-text
                  font-medium hover:bg-nova-border transition-all">
                {inList ? '✓ Dans ma liste' : '+ Ma liste'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
