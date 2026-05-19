import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMangaPages, useMangaChapters } from '@/hooks/useManga';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

type ReadMode = 'vertical' | 'single' | 'double';

export default function MangaReader() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const navigate = useNavigate();

  const [mode,    setMode]    = useState<ReadMode>('vertical');
  const [page,    setPage]    = useState(0);
  const [quality, setQuality] = useState<'hd' | 'sd'>('hd');
  const [showUI,  setShowUI]  = useState(true);
  const uiTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const saveMangaProgress = useUserStore(s => s.saveMangaProgress);
  const getMangaProgress  = useUserStore(s => s.getMangaProgress);

  const { data, isLoading } = useMangaPages(chapterId ?? '');
  const { data: chapData }  = useMangaChapters(id ?? '');

  const pages  = quality === 'hd' ? (data?.pages ?? []) : (data?.pagesLow ?? data?.pages ?? []);
  const total  = pages.length;
  const chapters = chapData?.chapters ?? [];
  const currentChIdx = chapters.findIndex(c => c.id === chapterId);
  const prevCh = chapters[currentChIdx - 1];
  const nextCh = chapters[currentChIdx + 1];

  // Reprendre là où on en était
  useEffect(() => {
    const saved = getMangaProgress(id ?? '');
    if (saved && saved.chapterId === chapterId && mode !== 'vertical') {
      setPage(saved.page);
    }
  }, [chapterId, mode]);

  // Sauvegarder progression
  useEffect(() => {
    if (!id || !chapterId || !total) return;
    const ch = chapters.find(c => c.id === chapterId);
    saveMangaProgress({
      mangaId: id, chapterId, chapterNumber: ch?.number ?? '',
      page, totalPages: total,
      title: ch?.title ?? `Chapitre ${ch?.number ?? ''}`,
      cover: null, updatedAt: Date.now(),
    });
  }, [page, chapterId, total]);

  // Auto-hide UI
  const resetUITimer = useCallback(() => {
    setShowUI(true);
    if (uiTimerRef.current) clearTimeout(uiTimerRef.current);
    if (mode !== 'vertical') {
      uiTimerRef.current = setTimeout(() => setShowUI(false), 3000);
    }
  }, [mode]);

  useEffect(() => { resetUITimer(); }, [mode]);
  useEffect(() => () => { if (uiTimerRef.current) clearTimeout(uiTimerRef.current); }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      resetUITimer();
      if (mode !== 'vertical') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ')
          setPage(p => Math.min(total - 1, p + (mode === 'double' ? 2 : 1)));
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
          setPage(p => Math.max(0, p - (mode === 'double' ? 2 : 1)));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, total, resetUITimer]);

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin mx-auto" />
        <p className="text-white/50 text-sm">Chargement du chapitre...</p>
      </div>
    </div>
  );

  if (!pages.length) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-5xl">😕</p>
        <p className="text-white/60">Impossible de charger ce chapitre</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-nova-accent rounded-lg text-white text-sm">Retour</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black" onMouseMove={resetUITimer} onTouchStart={resetUITimer}>

      {/* Top bar */}
      <div className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        showUI ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      )}>
        <div className="bg-black/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(`/manga/${id}`)}
            className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-sm font-semibold truncate">
              {chapters.find(c => c.id === chapterId)?.title ?? `Chapitre ${currentChIdx + 1}`}
            </p>
            {mode !== 'vertical' && (
              <p className="text-white/40 text-xs">Page {page + 1} / {total}</p>
            )}
          </div>
          {/* Mode selector */}
          <div className="flex gap-1">
            {([['vertical','↕ Scroll'],['single','□ Page'],['double','⊟ Double']] as [ReadMode,string][]).map(([m,label]) => (
              <button key={m} onClick={() => { setMode(m); setPage(0); }}
                className={cn('px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                  mode === m ? 'bg-nova-accent text-white' : 'bg-white/10 text-white/50 hover:bg-white/20')}>
                {label}
              </button>
            ))}
          </div>
          {/* Quality */}
          <button onClick={() => setQuality(q => q === 'hd' ? 'sd' : 'hd')}
            className={cn('px-2.5 py-1.5 rounded-lg text-xs font-bold',
              quality === 'hd' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/10 text-white/50')}>
            {quality.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Bottom bar - page mode */}
      {mode !== 'vertical' && (
        <div className={cn(
          'fixed bottom-0 left-0 right-0 z-50 transition-all duration-300',
          showUI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
        )}>
          <div className="bg-black/95 backdrop-blur-xl border-t border-white/5 px-4 py-3">
            <div className="flex items-center gap-3 max-w-2xl mx-auto">
              {/* Prev chapter */}
              <button onClick={() => prevCh && navigate(`/manga/${id}/read/${prevCh.id}`)}
                disabled={!prevCh}
                className="shrink-0 px-3 py-1.5 bg-white/10 rounded-lg text-white/60 text-xs disabled:opacity-30 hover:bg-white/20">
                Ch.préc
              </button>
              <button onClick={() => setPage(p => Math.max(0, p - (mode === 'double' ? 2 : 1)))}
                disabled={page === 0}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="flex-1 space-y-1">
                <input type="range" min={0} max={total - 1} value={page}
                  onChange={e => setPage(+e.target.value)}
                  className="w-full accent-nova-accent cursor-pointer" />
                <div className="flex justify-between text-[10px] text-white/30">
                  <span>1</span><span>{total}</span>
                </div>
              </div>
              <button onClick={() => setPage(p => Math.min(total - 1, p + (mode === 'double' ? 2 : 1)))}
                disabled={page >= total - 1}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              {/* Next chapter */}
              <button onClick={() => nextCh && navigate(`/manga/${id}/read/${nextCh.id}`)}
                disabled={!nextCh}
                className="shrink-0 px-3 py-1.5 bg-nova-accent/80 rounded-lg text-white text-xs disabled:opacity-30 hover:bg-nova-accent">
                Ch.suiv
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pages */}
      <div className={cn(mode !== 'vertical' && showUI ? 'pt-14 pb-20' : '')}>
        {mode === 'vertical' ? (
          // Scroll vertical — toutes les pages d'affilée
          <div className="max-w-2xl mx-auto">
            {pages.map((src: string, i: number) => (
              <img key={i} src={src} alt={`Page ${i+1}`} loading="lazy"
                className="w-full block" />
            ))}
            {/* Fin du chapitre */}
            <div className="flex flex-col items-center gap-3 py-12 px-4">
              <p className="text-white/50 text-sm">Fin du chapitre</p>
              <div className="flex gap-3">
                {prevCh && (
                  <button onClick={() => navigate(`/manga/${id}/read/${prevCh.id}`)}
                    className="px-4 py-2 bg-white/10 rounded-xl text-white text-sm hover:bg-white/20">
                    ← Ch. précédent
                  </button>
                )}
                {nextCh && (
                  <button onClick={() => navigate(`/manga/${id}/read/${nextCh.id}`)}
                    className="px-4 py-2 bg-nova-accent rounded-xl text-white text-sm font-bold hover:bg-nova-accent/90">
                    Ch. suivant →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : mode === 'single' ? (
          <div className="flex items-center justify-center min-h-screen cursor-pointer"
            onClick={() => setPage(p => Math.min(total - 1, p + 1))}>
            <img src={pages[page]} alt={`Page ${page+1}`}
              className="max-h-screen max-w-full object-contain select-none" />
          </div>
        ) : (
          // Double page
          <div className="flex items-center justify-center min-h-screen gap-0.5 cursor-pointer"
            onClick={() => setPage(p => Math.min(total - 1, p + 2))}>
            {[page, page + 1].map(idx => pages[idx] ? (
              <img key={idx} src={pages[idx]} alt={`Page ${idx+1}`}
                className="max-h-screen w-1/2 object-contain select-none" />
            ) : null)}
          </div>
        )}
      </div>
    </div>
  );
}
