import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTrending, useSeasonal, usePopular } from '@/hooks/useAnime';
import { useUserStore } from '@/stores/userStore';
import type { AniListMedia, WatchProgress } from '@/types';

function getTitle(m: AniListMedia) {
  return m.title.userPreferred ?? m.title.romaji ?? m.title.english ?? 'Sans titre';
}

function AnimeCard({ media, onClick }: { media: AniListMedia; onClick: () => void }) {
  const title = getTitle(media);
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
  return (
    <motion.div onClick={onClick} whileHover={{ scale: 1.04 }} transition={{ duration: 0.18 }}
      className="cursor-pointer group shrink-0 w-36 md:w-44">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-nova-bg2 relative shadow-lg">
        {media.coverImage.large
          ? <img src={media.coverImage.large} alt={title} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-nova-bg2" />}
        {score && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-bold text-yellow-400">
            ★ {score}
          </div>
        )}
        {media.nextAiringEpisode && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
            <p className="text-[10px] text-nova-accent font-semibold">
              Ép.{media.nextAiringEpisode.episode} dans {Math.floor((media.nextAiringEpisode.airingAt - Date.now()/1000)/86400)}j
            </p>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs font-semibold text-nova-text truncate">{title}</p>
      {media.seasonYear && <p className="text-[10px] text-nova-muted">{media.seasonYear}</p>}
    </motion.div>
  );
}

function ContinueCard({ progress }: { progress: WatchProgress }) {
  const navigate = useNavigate();
  const pct = Math.round(progress.progress);
  return (
    <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.18 }}
      onClick={() => navigate(`/watch/${progress.tmdbId}?ep=${progress.episode}&season=${progress.season}&lang=${progress.lang}`)}
      className="cursor-pointer group shrink-0 w-48 md:w-56">
      <div className="aspect-video rounded-xl overflow-hidden bg-nova-bg2 relative shadow-lg">
        {progress.poster
          ? <img src={progress.poster} alt={progress.title} loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-nova-bg2 flex items-center justify-center text-3xl">▶</div>}
        {/* Barre de progression */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div className="h-full bg-nova-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
        {/* Overlay play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-nova-accent/90 flex items-center justify-center shadow-xl">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-white font-semibold">
          S{progress.season} · Ép.{progress.episode}
        </div>
      </div>
      <p className="mt-1.5 text-xs font-semibold text-nova-text truncate">{progress.title}</p>
      <p className="text-[10px] text-nova-muted">{pct}% visionné</p>
    </motion.div>
  );
}

function Row({ title, icon, items, onClickItem, isLoading }: {
  title: string; icon: string; items: AniListMedia[];
  onClickItem: (m: AniListMedia) => void; isLoading?: boolean;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4 px-4 md:px-10">
        <div className="w-1 h-6 bg-nova-accent rounded-full" />
        <span className="text-lg">{icon}</span>
        <h2 className="text-lg font-black text-nova-text">{title}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-10 pb-2">
        {isLoading
          ? Array.from({length:8}).map((_,i) => (
              <div key={i} className="shrink-0 w-36 md:w-44 aspect-[2/3] bg-nova-bg2 rounded-xl animate-pulse" />
            ))
          : items.map(m => <AnimeCard key={m.id} media={m} onClick={() => onClickItem(m)} />)
        }
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const month  = new Date().getMonth();
  const year   = new Date().getFullYear();
  const season = month < 3 ? 'WINTER' : month < 6 ? 'SPRING' : month < 9 ? 'SUMMER' : 'FALL';
  const seasonFr: Record<string,string> = { WINTER:'Hiver', SPRING:'Printemps', SUMMER:'Été', FALL:'Automne' };

  const continueWatching = useUserStore(s => s.getContinueWatching());

  const { data: trendData,    isLoading: trendLoading    } = useTrending();
  const { data: seasonalData, isLoading: seasonalLoading } = useSeasonal(year, season);
  const { data: popularData,  isLoading: popularLoading  } = usePopular();

  const goTo = (m: AniListMedia) => navigate(`/anime/${m.id}`);
  const hero = trendData?.media?.[0];
  const heroTitle = hero ? getTitle(hero) : '';

  return (
    <div className="min-h-screen bg-nova-bg pt-4 pb-24">
      {/* Hero */}
      {hero && (
        <div className="relative h-[45vh] min-h-[280px] mb-10 overflow-hidden">
          {hero.bannerImage && <img src={hero.bannerImage} alt={heroTitle} className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-r from-nova-bg via-nova-bg/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-nova-bg via-transparent to-transparent" />
          <div className="absolute bottom-8 left-4 md:left-10 max-w-lg">
            <div className="flex gap-2 mb-2">
              {hero.genres?.slice(0,3).map(g => (
                <span key={g} className="text-xs bg-nova-accent/20 text-nova-accent px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg">{heroTitle}</h1>
            {hero.description && (
              <p className="text-sm text-white/70 line-clamp-2 mb-4">{hero.description.replace(/<[^>]*>/g,'')}</p>
            )}
            <div className="flex gap-3">
              <button onClick={() => navigate(`/watch/${hero.id}?ep=1&lang=vostfr`)}
                className="px-6 py-2.5 bg-nova-accent rounded-full text-white font-bold
                  hover:bg-nova-accent/90 transition-all shadow-lg shadow-nova-accent/30">
                ▶ Regarder
              </button>
              <button onClick={() => goTo(hero)}
                className="px-6 py-2.5 bg-white/10 backdrop-blur border border-white/20 rounded-full
                  text-white font-bold hover:bg-white/20 transition-all">
                + Infos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continuer à regarder */}
      {continueWatching.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 px-4 md:px-10">
            <div className="w-1 h-6 bg-nova-accent rounded-full" />
            <span className="text-lg">▶</span>
            <h2 className="text-lg font-black text-nova-text">Continuer à regarder</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none px-4 md:px-10 pb-2">
            {continueWatching.map(p => <ContinueCard key={`${p.tmdbId}-${p.episode}`} progress={p} />)}
          </div>
        </section>
      )}

      <Row title={`Saison ${seasonFr[season]} ${year}`} icon="🌸"
        items={seasonalData?.media??[]} onClickItem={goTo} isLoading={seasonalLoading} />
      <Row title="Tendances" icon="🔥"
        items={trendData?.media??[]} onClickItem={goTo} isLoading={trendLoading} />
      <Row title="Populaires" icon="⭐"
        items={popularData?.media??[]} onClickItem={goTo} isLoading={popularLoading} />
    </div>
  );
}
