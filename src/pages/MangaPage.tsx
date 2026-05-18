import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMangaDetails, useMangaChapters } from '@/hooks/useManga';
import { cn } from '@/lib/utils';

export default function MangaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: details, isLoading } = useMangaDetails(id ?? '');

  const { data: chaptersData, isLoading: chapLoading } = useMangaChapters(id ?? '', page);

  if (isLoading) return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
    </div>
  );
  if (!details) return null;

  const chapters = chaptersData?.chapters ?? [];
  const totalChapters = chaptersData?.total ?? 0;
  const totalPages = Math.ceil(totalChapters / 100);

  return (
    <div className="min-h-screen bg-nova-bg pb-32">
      {/* Header */}
      <div className="relative h-64 overflow-hidden">
        {details.cover
          ? <img src={details.cover} alt={details.title} className="w-full h-full object-cover blur-sm scale-110 opacity-30" />
          : <div className="w-full h-full bg-nova-bg2" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-nova-bg to-transparent" />
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-nova-bg2/80
            backdrop-blur border border-nova-border rounded-full text-nova-text2 text-sm">
          ← Retour
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex gap-6 mb-8">
          {/* Cover */}
          {details.cover && (
            <img src={details.cover} alt={details.title}
              className="w-36 rounded-xl shadow-2xl border border-nova-border flex-shrink-0 self-end" />
          )}
          <div className="flex-1 self-end pb-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs bg-nova-purple/20 text-nova-purple px-2 py-0.5 rounded-full font-semibold">
                {details.type === 'webtoon' ? '🌐 Webtoon' : details.type === 'manhua' ? '🇨🇳 Manhua' : '🇯🇵 Manga'}
              </span>
              {details.status && (
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold',
                  details.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400')}>
                  {details.status === 'completed' ? '✅ Terminé' : '🔄 En cours'}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-nova-text mb-2">{details.title}</h1>
            {details.authors?.length > 0 && (
              <p className="text-sm text-nova-muted mb-3">par {details.authors.join(', ')}</p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {details.genres?.slice(0, 5).map((g: string) => (
                <span key={g} className="text-xs bg-nova-bg2 border border-nova-border text-nova-muted px-2 py-0.5 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Synopsis */}
        {details.description && (
          <div className="bg-nova-bg2 border border-nova-border rounded-xl p-4 mb-6">
            <h2 className="text-sm font-bold text-nova-text mb-2">Synopsis</h2>
            <p className="text-sm text-nova-muted leading-relaxed line-clamp-4">{details.description}</p>
          </div>
        )}

        {/* Lire le 1er chapitre */}
        {chapters[0] && (
          <button onClick={() => navigate(`/manga/${id}/read/${chapters[0]!.id}`)}
            className="w-full py-3 bg-nova-accent rounded-xl text-white font-bold mb-6
              hover:bg-nova-accent/90 transition-all text-sm">
            📖 Lire depuis le début — Ch. {chapters[0]!.number}
          </button>
        )}

        {/* Liste chapitres */}
        <div className="bg-nova-bg2 border border-nova-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-nova-border">
            <h2 className="font-bold text-nova-text text-sm">
              {totalChapters} chapitres en français
            </h2>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 bg-nova-bg border border-nova-border rounded text-xs text-nova-muted disabled:opacity-30">
                  ←
                </button>
                <span className="text-xs text-nova-muted self-center">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 bg-nova-bg border border-nova-border rounded text-xs text-nova-muted disabled:opacity-30">
                  →
                </button>
              </div>
            )}
          </div>
          {chapLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-nova-border/50">
              {chapters.map((ch: any) => (
                <motion.button key={ch.id}
                  whileHover={{ x: 4 }}
                  onClick={() => navigate(`/manga/${id}/read/${ch.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3
                    hover:bg-nova-bg/50 transition-colors text-left">
                  <div>
                    <span className="text-sm font-semibold text-nova-text">Ch. {ch.number}</span>
                    {ch.title && ch.title !== `Chapitre ${ch.number}` && (
                      <span className="text-sm text-nova-muted ml-2">— {ch.title}</span>
                    )}
                    <p className="text-xs text-nova-muted/60 mt-0.5">{ch.group}</p>
                  </div>
                  <div className="flex items-center gap-2 text-nova-muted">
                    <span className="text-xs">{ch.pages} pages</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
