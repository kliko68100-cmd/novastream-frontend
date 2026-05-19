import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMangaDetails, useMangaChapters } from '@/hooks/useManga';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

export default function MangaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [showAllGenres, setShowAllGenres] = useState(false);

  const { data: details, isLoading } = useMangaDetails(id ?? '');
  const { data: chapData, isLoading: chapLoading } = useMangaChapters(id ?? '', page);

  const isMangaBookmarked  = useUserStore(s => s.isMangaBookmarked);
  const toggleMangaBookmark = useUserStore(s => s.toggleMangaBookmark);
  const getMangaProgress    = useUserStore(s => s.getMangaProgress);
  const addToast            = useUserStore(s => s.addToast);

  const bookmarked = isMangaBookmarked(id ?? '');
  const progress   = getMangaProgress(id ?? '');

  if (isLoading) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
    </div>
  );
  if (!details) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center text-nova-muted">
      Manga introuvable
    </div>
  );

  const chapters   = chapData?.chapters ?? [];
  const totalCh    = chapData?.total ?? 0;
  const totalPages = Math.ceil(totalCh / 100);

  const handleToggleBookmark = () => {
    toggleMangaBookmark(id ?? '');
    addToast({
      type: bookmarked ? 'info' : 'success',
      message: bookmarked ? 'Retiré des favoris' : '✅ Ajouté aux favoris',
      duration: 2500,
    });
  };

  return (
    <div className="min-h-screen bg-nova-bg pb-24">
      {/* Banner */}
      <div className="relative h-56 overflow-hidden">
        {details.cover
          ? <img src={details.cover} alt={details.title} className="w-full h-full object-cover blur-md scale-110 opacity-20" />
          : <div className="w-full h-full bg-nova-bg2" />}
        <div className="absolute inset-0 bg-gradient-to-t from-nova-bg to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5
            bg-nova-bg2/80 backdrop-blur border border-nova-border rounded-full text-nova-text2 text-sm hover:bg-nova-bg2">
          ← Retour
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-28 relative z-10">
        {/* Header */}
        <div className="flex gap-5 mb-6">
          {details.cover && (
            <img src={details.cover} alt={details.title}
              className="w-32 md:w-40 rounded-2xl shadow-2xl border border-nova-border flex-shrink-0 self-end" />
          )}
          <div className="flex-1 self-end pb-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold',
                details.type === 'webtoon' ? 'bg-blue-500/20 text-blue-400'
                : details.type === 'manhua' ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-nova-accent/20 text-nova-accent')}>
                {details.type === 'webtoon' ? '🌐 Webtoon' : details.type === 'manhua' ? '🇨🇳 Manhua' : '🇯🇵 Manga'}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                details.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400')}>
                {details.status === 'completed' ? '✅ Terminé' : '🔄 En cours'}
              </span>
              {details.year && <span className="text-xs text-nova-muted">{details.year}</span>}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-nova-text mb-1">{details.title}</h1>
            {details.authors?.length > 0 && (
              <p className="text-xs text-nova-muted mb-3">par {details.authors.join(', ')}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(showAllGenres ? details.genres : details.genres?.slice(0, 5))?.map((g: string) => (
                <span key={g} className="text-[11px] bg-nova-bg2 border border-nova-border text-nova-muted px-2 py-0.5 rounded-full">
                  {g}
                </span>
              ))}
              {details.genres?.length > 5 && (
                <button onClick={() => setShowAllGenres(v => !v)}
                  className="text-[11px] text-nova-accent hover:underline">
                  {showAllGenres ? 'Moins' : `+${details.genres.length - 5}`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis */}
        {details.description && (
          <div className="bg-nova-bg2 border border-nova-border rounded-xl p-4 mb-4">
            <p className="text-sm text-nova-muted leading-relaxed line-clamp-4">{details.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          {/* Reprendre ou Lire depuis le début */}
          {progress && chapters.length > 0 ? (
            <button
              onClick={() => navigate(`/manga/${id}/read/${progress.chapterId}`)}
              className="flex-1 py-3 bg-nova-accent rounded-xl text-white font-bold hover:bg-nova-accent/90 transition-all text-sm">
              ▶ Reprendre — Ch.{progress.chapterNumber} p.{progress.page + 1}
            </button>
          ) : chapters[0] ? (
            <button
              onClick={() => navigate(`/manga/${id}/read/${chapters[0].id}`)}
              className="flex-1 py-3 bg-nova-accent rounded-xl text-white font-bold hover:bg-nova-accent/90 transition-all text-sm">
              📖 Lire depuis le début
            </button>
          ) : null}

          {/* Marque-page */}
          <button onClick={handleToggleBookmark}
            className={cn('px-5 py-3 rounded-xl font-bold text-sm transition-all border',
              bookmarked
                ? 'bg-nova-accent/20 border-nova-accent text-nova-accent'
                : 'bg-nova-bg2 border-nova-border text-nova-muted hover:text-nova-text')}>
            {bookmarked ? '🔖 Sauvegardé' : '+ Sauvegarder'}
          </button>
        </div>

        {/* Liste chapitres */}
        <div className="bg-nova-bg2 border border-nova-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-nova-border">
            <h2 className="font-bold text-nova-text text-sm">
              {totalCh} chapitres en français
            </h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2.5 py-1 bg-nova-bg border border-nova-border rounded-lg text-xs text-nova-muted disabled:opacity-30 hover:text-nova-text">←</button>
                <span className="text-xs text-nova-muted">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2.5 py-1 bg-nova-bg border border-nova-border rounded-lg text-xs text-nova-muted disabled:opacity-30 hover:text-nova-text">→</button>
              </div>
            )}
          </div>

          {chapLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-nova-border/40 max-h-[60vh] overflow-y-auto">
              {chapters.map((ch: any) => {
                const isCurrentProgress = progress?.chapterId === ch.id;
                return (
                  <motion.button key={ch.id} whileHover={{ x: 4 }}
                    onClick={() => navigate(`/manga/${id}/read/${ch.id}`)}
                    className={cn('w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-nova-bg/50',
                      isCurrentProgress && 'bg-nova-accent/5 border-l-2 border-nova-accent')}>
                    <div>
                      <span className="text-sm font-semibold text-nova-text">Ch.{ch.number}</span>
                      {ch.title && ch.title !== `Chapitre ${ch.number}` && (
                        <span className="text-sm text-nova-muted ml-2">— {ch.title}</span>
                      )}
                      <p className="text-[10px] text-nova-muted/60 mt-0.5">{ch.group}</p>
                    </div>
                    <div className="flex items-center gap-2 text-nova-muted shrink-0">
                      {isCurrentProgress && (
                        <span className="text-[10px] text-nova-accent font-semibold">En cours</span>
                      )}
                      <span className="text-xs">{ch.pages}p</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
