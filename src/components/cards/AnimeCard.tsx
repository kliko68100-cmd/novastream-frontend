import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { AniListMedia } from '@/types';

export function AnimeCard({ anime }: { anime: AniListMedia }) {
  const navigate = useNavigate();
  const title = anime.title.userPreferred ?? anime.title.romaji ?? anime.title.english ?? '';
  const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  return (
    <motion.div whileHover={{ scale: 1.04 }} onClick={() => navigate(`/anime/${anime.id}`)} className="cursor-pointer group">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-nova-bg2 relative">
        {anime.coverImage.large && <img src={anime.coverImage.large} alt={title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
        {score && <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[10px] font-bold text-yellow-400">★ {score}</div>}
      </div>
      <p className="mt-1.5 text-xs font-semibold text-nova-text truncate">{title}</p>
      {anime.seasonYear && <p className="text-[10px] text-nova-muted">{anime.seasonYear}</p>}
    </motion.div>
  );
}
