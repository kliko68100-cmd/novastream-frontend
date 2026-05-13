import { useCallback, useRef } from 'react';
import { useUserStore } from '@/stores/userStore';
import type { WatchProgress } from '@/types';

interface ProgressParams {
  tmdbId:  number;
  type:    'tv' | 'movie';
  title:   string;
  poster:  string | null;
  episode: number;
  season:  number;
  lang:    'vf' | 'vostfr' | 'vo';
}

/** Sauvegarde la progression toutes les 5s, debounce */
export function useProgress(params: ProgressParams) {
  const saveProgress  = useUserStore(s => s.saveProgress);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveRef   = useRef<number>(0);

  const save = useCallback((currentTime: number, duration: number) => {
    if (!duration || duration < 60) return; // Ignore les clips courts

    // Debounce: max 1 save / 5s
    const now = Date.now();
    if (now - lastSaveRef.current < 5_000) return;
    lastSaveRef.current = now;

    const progress = Math.round((currentTime / duration) * 100);

    const entry: WatchProgress = {
      ...params,
      currentTime: Math.floor(currentTime),
      duration:    Math.floor(duration),
      progress,
      updatedAt:   now,
    };

    saveProgress(entry);
  }, [saveProgress, params]);

  /** À appeler à chaque timeupdate */
  const onTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(currentTime, duration), 1_000);
  }, [save]);

  return { onTimeUpdate };
}
