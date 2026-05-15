import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { manga } from '@/lib/api';
import { cn } from '@/lib/utils';

type ReadMode = 'vertical' | 'single' | 'double';

export default function MangaReader() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const navigate = useNavigate();

  const [mode, setMode]           = useState<ReadMode>('vertical');
  const [page, setPage]           = useState(0);
  const [quality, setQuality]     = useState<'hd' | 'sd'>('hd');
  const [showUI, setShowUI]       = useState(true);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['manga', 'pages', chapterId],
    queryFn:  () => manga.pages(chapterId!),
    enabled:  !!chapterId,
  });

  const pages = quality === 'hd' ? (data?.pages ?? []) : (data?.pagesLow ?? data?.pages ?? []);
  const total = pages.length;

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (mode !== 'vertical') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setPage(p => Math.min(total - 1, p + 1));
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   setPage(p => Math.max(0, p - 1));
      }
      if (e.key === 'u' || e.key === 'U') setShowUI(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, total]);

  const toggleUI = useCallback(() => setShowUI(v => !v), []);

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin mx-auto mb-3" />
        <p className="text-nova-muted text-sm">Chargement des pages...</p>
      </div>
    </div>
  );

  if (!pages.length) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-nova-muted">
      <div className="text-center">
        <p className="text-4xl mb-3">😕</p>
        <p>Impossible de charger ce chapitre</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-nova-accent rounded-lg text-white text-sm">
          Retour
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#111] relative">
      {/* UI Overlay */}
      {showUI && (
        <>
          {/* Top bar */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-2 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">Chapitre {chapterId?.slice(-6)}</p>
              {mode !== 'vertical' && <p className="text-white/50 text-xs">Page {page + 1} / {total}</p>}
            </div>
            {/* Mode selector */}
            <div className="flex gap-1">
              {([['vertical','↕'],['single','□'],['double','⊟']] as [ReadMode, string][]).map(([m, icon]) => (
                <button key={m} onClick={() => { setMode(m); setPage(0); }}
                  className={cn('px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                    mode === m ? 'bg-nova-accent text-white' : 'bg-white/10 text-white/60 hover:bg-white/20')}>
                  {icon}
                </button>
              ))}
            </div>
            {/* Quality */}
            <button onClick={() => setQuality(q => q === 'hd' ? 'sd' : 'hd')}
              className={cn('px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                quality === 'hd' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/10 text-white/60')}>
              {quality.toUpperCase()}
            </button>
          </div>

          {/* Bottom bar (page mode only) */}
          {mode !== 'vertical' && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-3 max-w-lg mx-auto">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </button>
                <div className="flex-1">
                  <input type="range" min={0} max={total - 1} value={page}
                    onChange={e => setPage(+e.target.value)}
                    className="w-full accent-nova-accent" />
                </div>
                <button onClick={() => setPage(p => Math.min(total - 1, p + 1))} disabled={page >= total - 1}
                  className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Toggle UI on click */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        <div className="w-full h-full pointer-events-auto" onClick={toggleUI} />
      </div>

      {/* Pages */}
      <div className={cn('relative z-30 pointer-events-none', showUI ? 'pt-14 pb-16' : '')}>
        {mode === 'vertical' ? (
          // Scroll vertical — toutes les pages
          <div className="max-w-2xl mx-auto px-0 space-y-1">
            {pages.map((src: string, i: number) => (
              <img key={i} src={src} alt={`Page ${i + 1}`} loading="lazy"
                className="w-full block pointer-events-auto"
                onError={() => setImgErrors(prev => new Set([...prev, i]))}
              />
            ))}
          </div>
        ) : mode === 'single' ? (
          // Page unique
          <div className="flex items-center justify-center min-h-screen">
            <img src={pages[page]} alt={`Page ${page + 1}`}
              className="max-h-screen max-w-full object-contain pointer-events-auto"
              onClick={e => { e.stopPropagation(); setPage(p => Math.min(total - 1, p + 1)); }}
            />
          </div>
        ) : (
          // Double page
          <div className="flex items-center justify-center min-h-screen gap-0.5">
            {[page * 2, page * 2 + 1].map(idx => (
              pages[idx] ? (
                <img key={idx} src={pages[idx]} alt={`Page ${idx + 1}`}
                  className="max-h-screen max-w-[50vw] object-contain pointer-events-auto"
                  onClick={e => { e.stopPropagation(); setPage(p => Math.min(Math.floor((total - 1) / 2), p + 1)); }}
                />
              ) : null
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
