import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnimeDetails } from '@/hooks/useAnime';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import type { AniListMedia, Lang } from '@/types';

const STATUS_FR: Record<string, string> = {
  RELEASING: '🔴 En cours', FINISHED: '✅ Terminé',
  NOT_YET_RELEASED: '⏳ À venir', CANCELLED: '❌ Annulé', HIATUS: '⏸ En pause',
};
const FORMAT_FR: Record<string, string> = {
  TV: 'Série', MOVIE: 'Film', OVA: 'OVA', ONA: 'ONA', SPECIAL: 'Spécial',
};

function getTitle(m: AniListMedia) {
  return m.title.userPreferred ?? m.title.romaji ?? m.title.english ?? 'Sans titre';
}

export default function AnimePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>('vostfr');
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { data: anime, isLoading } = useAnimeDetails(id ? parseInt(id) : null);
  const addToWatchlist      = useUserStore(s => s.addToWatchlist);
  const removeFromWatchlist = useUserStore(s => s.removeFromWatchlist);
  const isInWatchlist       = useUserStore(s => s.isInWatchlist);
  const addToast            = useUserStore(s => s.addToast);
  const inList = anime ? isInWatchlist(anime.id) : false;

  const handleWatchlist = () => {
    if (!anime) return;
    if (inList) {
      removeFromWatchlist(anime.id);
      addToast({ type: 'info', message: 'Retiré de ta liste', duration: 2500 });
    } else {
      addToWatchlist({
        tmdbId: anime.id, type: 'tv',
        title: getTitle(anime),
        poster: anime.coverImage?.large ?? null,
        backdrop: anime.bannerImage ?? null,
        score: anime.averageScore ? anime.averageScore / 10 : 0,
        addedAt: Date.now(),
        genres: anime.genres ?? [],
      });
      addToast({ type: 'success', message: '✅ Ajouté à ta liste', duration: 2500 });
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
    </div>
  );
  if (!anime) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center text-nova-muted">Anime introuvable</div>
  );

  const title = getTitle(anime);
  const desc  = anime.description?.replace(/<[^>]*>/g, '') ?? '';
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;

  const LANGS = [
    { value: 'vostfr' as Lang, label: 'VOSTFR' },
    { value: 'vf'     as Lang, label: 'VF'     },
    { value: 'vo'     as Lang, label: 'VO'     },
  ];

  const handleWatch = (ep = 1) => {
    navigate(`/watch/${anime.id}?ep=${ep}&lang=${lang}`);
  };

  const relations = anime.relations?.edges?.filter(e =>
    ['SEQUEL','PREQUEL','SIDE_STORY','PARENT'].includes(e.relationType)
  ) ?? [];

  const recs = anime.recommendations?.nodes
    ?.filter(n => n.mediaRecommendation)
    ?.slice(0, 12) ?? [];

  return (
    <div className="min-h-screen bg-nova-bg pb-24">
      {/* Banner */}
      <div className="relative h-[50vh] min-h-[300px] overflow-hidden">
        {anime.bannerImage
          ? <img src={anime.bannerImage} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `${anime.coverImage.color ?? '#1a1a2e'}44` }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-nova-bg via-nova-bg/40 to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5
            bg-nova-bg2/80 backdrop-blur border border-nova-border rounded-full
            text-nova-text2 text-sm hover:bg-nova-bg2 transition-all">
          ← Retour
        </button>
      </div>

      <div className="relative -mt-36 z-10 max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Cover */}
          <div className="shrink-0 self-end">
            <img src={anime.coverImage.large ?? anime.coverImage.medium ?? ''}
              alt={title} className="w-40 md:w-48 rounded-2xl shadow-2xl border-2 border-nova-border" />
          </div>

          {/* Info */}
          <div className="flex-1 pt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {anime.format && (
                <span className="text-xs bg-nova-bg2 border border-nova-border text-nova-muted px-2 py-0.5 rounded-full">
                  {FORMAT_FR[anime.format] ?? anime.format}
                </span>
              )}
              {anime.status && (
                <span className="text-xs bg-nova-bg2 border border-nova-border text-nova-muted px-2 py-0.5 rounded-full">
                  {STATUS_FR[anime.status] ?? anime.status}
                </span>
              )}
              {anime.seasonYear && (
                <span className="text-xs bg-nova-bg2 border border-nova-border text-nova-muted px-2 py-0.5 rounded-full">
                  {anime.seasonYear}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-nova-text mb-1">{title}</h1>
            {anime.title.romaji && anime.title.romaji !== title && (
              <p className="text-sm text-nova-muted mb-3">{anime.title.romaji}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-nova-muted mb-4">
              {score && <span className="text-yellow-400 font-bold">★ {score}/10</span>}
              {anime.episodes && <span>{anime.episodes} épisodes</span>}
              {anime.duration && <span>{anime.duration} min/ép</span>}
              {anime.studios?.nodes?.[0] && <span>{anime.studios.nodes[0].name}</span>}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {anime.genres?.slice(0,6).map(g => (
                <span key={g} className="text-xs bg-nova-accent/15 text-nova-accent px-2.5 py-1 rounded-full font-medium">
                  {g}
                </span>
              ))}
            </div>

            {desc && (
              <div className="mb-5">
                <p className={cn('text-sm text-nova-muted leading-relaxed', !showFullDesc && 'line-clamp-3')}>
                  {desc}
                </p>
                {desc.length > 200 && (
                  <button onClick={() => setShowFullDesc(v => !v)}
                    className="text-xs text-nova-accent mt-1 hover:underline">
                    {showFullDesc ? 'Voir moins' : 'Voir plus'}
                  </button>
                )}
              </div>
            )}

            {/* Lang + Watch */}
            <div className="flex items-center gap-2 mb-4">
              {LANGS.map(l => (
                <button key={l.value} onClick={() => setLang(l.value)}
                  className={cn('px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                    lang === l.value ? 'bg-nova-accent text-white' : 'bg-nova-bg2 text-nova-muted hover:text-nova-text border border-nova-border')}>
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleWatch(1)}
                className="flex items-center gap-2 px-6 py-3 bg-nova-accent rounded-full
                  text-white font-bold hover:bg-nova-accent/90 transition-all shadow-lg shadow-nova-accent/20">
                ▶ Regarder
              </button>
            </div>
          </div>
        </div>

        {/* Relations */}
        {relations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-nova-text mb-3">Œuvres liées</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
              {relations.map(({ relationType, node }) => (
                <motion.div key={node.id} whileHover={{ scale: 1.03 }}
                  onClick={() => navigate(`/anime/${node.id}`)}
                  className="shrink-0 w-32 cursor-pointer group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-nova-bg2 relative">
                    {node.coverImage?.large && <img src={node.coverImage.large} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5">
                      <span className="text-[9px] font-bold text-nova-accent uppercase">{relationType}</span>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium text-nova-text2 truncate mt-1">
                    {node.title?.userPreferred ?? node.title?.romaji ?? ''}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Recommandations */}
        {recs.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-nova-text mb-3">Vous aimerez aussi</h2>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {recs.map(({ mediaRecommendation: r }) => (
                <motion.div key={r.id} whileHover={{ scale: 1.04 }}
                  onClick={() => navigate(`/anime/${r.id}`)}
                  className="cursor-pointer group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-nova-bg2">
                    {r.coverImage?.large && <img src={r.coverImage.large} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                  </div>
                  <p className="text-[11px] font-medium text-nova-text2 truncate mt-1">
                    {r.title?.userPreferred ?? r.title?.romaji ?? ''}
                  </p>
                  {r.averageScore && <p className="text-[10px] text-yellow-400">★ {(r.averageScore/10).toFixed(1)}</p>}
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
