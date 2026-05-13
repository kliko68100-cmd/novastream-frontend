import { useEffect, useRef, useCallback } from 'react';

interface Options {
  onLoadMore: () => void;
  hasMore:    boolean;
  loading:    boolean;
  threshold?: number; // px avant le bord bas
}

export function useInfiniteScroll({ onLoadMore, hasMore, loading, threshold = 400 }: Options) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleIntersect: IntersectionObserverCallback = useCallback(
    ([entry]) => {
      if (entry?.isIntersecting && hasMore && !loading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: `${threshold}px`,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect, threshold]);

  return sentinelRef;
}
