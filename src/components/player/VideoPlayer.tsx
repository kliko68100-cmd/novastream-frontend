import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/stores/playerStore';
import { useUserStore } from '@/stores/userStore';
import { useProgress } from '@/hooks/useProgress';
import { proxy } from '@/lib/api';
import { formatTime, cn } from '@/lib/utils';
import type { ResolvedSources } from '@/types';
import Hls from 'hls.js';

interface IframeSource { name: string; url: string; }

interface Props {
  tmdbId:   number;
  title:    string;
  poster?:  string | null;
  sources:  ResolvedSources & { type?: 'hls' | 'iframe'; iframes?: IframeSource[]; activeIframe?: string };
  onNext?:  () => void;
  onPrev?:  () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

// ── Iframe Player ────────────────────────────────────────────────

function IframePlayer({ sources, onNext, onPrev, hasNext, hasPrev, title }: Props) {
  const iframes = sources.iframes ?? [];
  const [activeIdx, setActiveIdx] = useState(0);
  const activeUrl = iframes[activeIdx]?.url ?? sources.activeIframe ?? '';

  return (
    <div className="relative bg-black w-full aspect-video flex flex-col">
      {/* Iframe */}
      <iframe
        key={activeUrl}
        src={activeUrl}
        className="w-full h-full border-0"
        allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        referrerPolicy="no-referrer"
      />

      {/* Provider selector + nav overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent
        flex items-end justify-between px-4 pb-3 pt-8 pointer-events-none">

        {/* Prev/Next */}
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={onPrev} disabled={!hasPrev}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs
              font-semibold disabled:opacity-30 transition-all backdrop-blur-sm">
            ← Ep. préc.
          </button>
          <button onClick={onNext} disabled={!hasNext}
            className="px-3 py-1.5 bg-nova-accent/80 hover:bg-nova-accent rounded-lg text-white text-xs
              font-semibold disabled:opacity-30 transition-all">
            Ep. suiv. →
          </button>
        </div>

        {/* Server selector */}
        {iframes.length > 1 && (
          <div className="flex gap-1.5 pointer-events-auto">
            {iframes.map((src, i) => (
              <button key={src.name} onClick={() => setActiveIdx(i)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-bold transition-all',
                  i === activeIdx
                    ? 'bg-nova-accent text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 backdrop-blur-sm'
                )}>
                {src.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── HLS Player ───────────────────────────────────────────────────

export function VideoPlayer({ tmdbId, title, poster, sources, onNext, onPrev, hasNext, hasPrev }: Props) {

  // Si c'est un iframe ou pas de sources HLS → iframe player
  if (sources.type === 'iframe' || !sources.sources?.length) {
    return <IframePlayer
      tmdbId={tmdbId} title={title} poster={poster}
      sources={sources} onNext={onNext} onPrev={onPrev}
      hasNext={hasNext} hasPrev={hasPrev}
    />;
  }

  return <HlsPlayer
    tmdbId={tmdbId} title={title} poster={poster}
    sources={sources} onNext={onNext} onPrev={onPrev}
    hasNext={hasNext} hasPrev={hasPrev}
  />;
}

// ── HLS full player ───────────────────────────────────────────────

function HlsPlayer({ tmdbId, title, poster, sources, onNext, onPrev, hasNext, hasPrev }: Props) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef       = useRef<Hls | null>(null);
  const hideTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready,        setReady]        = useState(false);
  const [buffering,    setBuffering]    = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [volume,       setVolume]       = useState(80);
  const [muted,        setMuted]        = useState(false);
  const [paused,       setPaused]       = useState(true);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [selectedSub,  setSelectedSub]  = useState<string | null>(null);
  const [showSubMenu,  setShowSubMenu]  = useState(false);
  const [showNext,     setShowNext]     = useState(false);
  const [skipVisible,  setSkipVisible]  = useState<'intro' | 'outro' | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  // Fallback iframe si HLS échoue
  const [useIframe,    setUseIframe]    = useState(false);

  const autoSkipIntro = useUserStore(s => s.autoSkipIntro);
  const autoNext      = useUserStore(s => s.autoNext);
  const { episode, season } = usePlayerStore();

  const { onTimeUpdate: saveProgress } = useProgress({
    tmdbId, type: 'tv', title,
    poster: poster ?? null,
    episode, season,
    lang: sources.lang,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sources.sources.length) return;

    setReady(false);
    setError(null);
    setShowNext(false);
    setUseIframe(false);

    const best = sources.sources[0]!;
    const proxyUrl = best.isM3U8
      ? proxy.m3u8Url(best.url, sources.headers?.Referer)
      : best.url;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (best.isM3U8 && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false, startLevel: -1 });
      hls.loadSource(proxyUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setReady(true);
        video.play().catch(() => setPaused(true));
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          // Si HLS échoue → bascule sur iframe si disponible
          if (sources.iframes?.length) {
            setUseIframe(true);
          } else {
            setError('Erreur de lecture. Essaie un autre serveur.');
          }
        }
      });
      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxyUrl;
      video.load();
      setReady(true);
    } else {
      video.src = proxyUrl;
      setReady(true);
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [sources]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const t = video.currentTime;
      const d = video.duration || 0;
      setCurrentTime(t);
      setDuration(d);
      saveProgress(t, d);

      const intro = sources.intro;
      if (intro && t >= intro.start && t < intro.end) {
        setSkipVisible('intro');
        if (autoSkipIntro) { video.currentTime = intro.end; return; }
      }
      const outro = sources.outro;
      if (outro && t >= outro.start && t < outro.end) {
        setSkipVisible('outro');
      } else if (skipVisible) {
        setSkipVisible(null);
      }
      if (d > 0 && d - t < 30 && hasNext && !showNext) {
        setShowNext(true);
        if (autoNext) nextTimer.current = setTimeout(() => onNext?.(), 30_000);
      }
    };

    const onPlay    = () => setPaused(false);
    const onPause   = () => setPaused(true);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onLoaded  = () => { setDuration(video.duration); setBuffering(false); };

    video.addEventListener('timeupdate',     onTimeUpdate);
    video.addEventListener('play',           onPlay);
    video.addEventListener('pause',          onPause);
    video.addEventListener('waiting',        onWaiting);
    video.addEventListener('playing',        onPlaying);
    video.addEventListener('loadedmetadata', onLoaded);
    video.volume = volume / 100;

    return () => {
      video.removeEventListener('timeupdate',     onTimeUpdate);
      video.removeEventListener('play',           onPlay);
      video.removeEventListener('pause',          onPause);
      video.removeEventListener('waiting',        onWaiting);
      video.removeEventListener('playing',        onPlaying);
      video.removeEventListener('loadedmetadata', onLoaded);
      if (nextTimer.current) clearTimeout(nextTimer.current);
    };
  }, [sources, autoSkipIntro, autoNext, hasNext, showNext]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!paused) setShowControls(false);
    }, 3_000);
  }, [paused]);

  useEffect(() => {
    if (paused) setShowControls(true);
    else showControlsTemporarily();
  }, [paused]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target !== document.body && (e.target as HTMLElement).tagName !== 'DIV') return;
      const video = videoRef.current;
      if (!video) return;
      switch (e.code) {
        case 'Space': case 'KeyK': e.preventDefault(); video.paused ? video.play() : video.pause(); break;
        case 'ArrowRight': e.preventDefault(); video.currentTime += 10; break;
        case 'ArrowLeft':  e.preventDefault(); video.currentTime -= 10; break;
        case 'ArrowUp':    e.preventDefault(); setVolume(v => Math.min(100, v + 5)); break;
        case 'ArrowDown':  e.preventDefault(); setVolume(v => Math.max(0, v - 5)); break;
        case 'KeyM': setMuted(m => !m); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyN': if (hasNext) onNext?.(); break;
      }
      showControlsTemporarily();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasNext]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted  = muted;
    }
  }, [volume, muted]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    Array.from(video.querySelectorAll('track')).forEach(t => t.remove());
    if (selectedSub) {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src  = proxy.subtitleUrl(selectedSub);
      track.default = true;
      video.appendChild(track);
    }
  }, [selectedSub]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) videoRef.current.currentTime = pct * duration;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Bascule sur iframe si HLS a échoué
  if (useIframe && sources.iframes?.length) {
    return <IframePlayer
      tmdbId={tmdbId} title={title} poster={poster}
      sources={sources} onNext={onNext} onPrev={onPrev}
      hasNext={hasNext} hasPrev={hasPrev}
    />;
  }

  if (error) {
    return (
      <div className="aspect-video bg-nova-bg flex items-center justify-center text-center p-8">
        <div>
          <p className="text-4xl mb-4">⚠️</p>
          <p className="font-semibold mb-2 text-nova-text">{error}</p>
          {sources.iframes?.length ? (
            <button onClick={() => setUseIframe(true)}
              className="mt-3 px-5 py-2 bg-nova-accent rounded-lg text-white text-sm font-bold hover:bg-nova-accent/90">
              Essayer avec VidSrc
            </button>
          ) : (
            <p className="text-sm text-nova-muted">Essaie un autre provider dans les réglages</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black group select-none',
        fullscreen ? 'fixed inset-0 z-[100]' : 'aspect-video w-full'
      )}
      onMouseMove={showControlsTemporarily}
      onTouchStart={showControlsTemporarily}
      onClick={() => {
        if (videoRef.current) {
          videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }
      }}
    >
      <video ref={videoRef} className="w-full h-full" poster={poster ?? undefined} playsInline crossOrigin="anonymous" />

      <AnimatePresence>
        {buffering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full border-4 border-nova-accent/30 border-t-nova-accent animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {skipVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            onClick={e => {
              e.stopPropagation();
              if (videoRef.current && sources[skipVisible === 'intro' ? 'intro' : 'outro']) {
                videoRef.current.currentTime = sources[skipVisible === 'intro' ? 'intro' : 'outro']!.end;
              }
              setSkipVisible(null);
            }}
            className="absolute bottom-24 right-6 px-5 py-2.5 bg-nova-bg2/90 border border-nova-border
              text-nova-text font-semibold rounded-lg backdrop-blur-sm hover:bg-nova-accent/20
              hover:border-nova-accent transition-all z-20">
            Passer {skipVisible === 'intro' ? "l'intro" : "l'outro"} →
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNext && hasNext && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-24 right-4 z-20 bg-nova-bg2/95 border border-nova-border
              rounded-xl p-4 w-64 backdrop-blur-xl shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs text-nova-muted mb-1 font-medium">PROCHAIN ÉPISODE</p>
            <p className="text-sm font-bold text-nova-text mb-3">Épisode {episode + 1}</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowNext(false); if (nextTimer.current) clearTimeout(nextTimer.current); }}
                className="flex-1 py-2 text-xs bg-nova-border rounded-lg text-nova-text2 hover:bg-nova-border/80">
                Annuler
              </button>
              <button onClick={() => { setShowNext(false); onNext?.(); }}
                className="flex-1 py-2 text-xs bg-nova-accent rounded-lg text-white font-bold hover:bg-nova-accent/90">
                Suivant →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent"
            onClick={e => e.stopPropagation()}>

            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div>
                <p className="text-white font-bold text-sm md:text-base drop-shadow">{title}</p>
                <p className="text-nova-text2 text-xs">Épisode {episode} · {sources.lang.toUpperCase()}</p>
              </div>
              {sources.subtitles?.length > 0 && (
                <div className="relative">
                  <button onClick={() => setShowSubMenu(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-lg text-white text-xs font-medium hover:bg-white/20">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M7 12h10M7 16h4"/>
                    </svg>
                    ST
                  </button>
                  <AnimatePresence>
                    {showSubMenu && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 top-9 bg-nova-bg2 border border-nova-border rounded-xl overflow-hidden shadow-2xl min-w-[160px] z-30">
                        <button onClick={() => { setSelectedSub(null); setShowSubMenu(false); }}
                          className={cn('w-full text-left px-4 py-2.5 text-sm hover:bg-white/5', !selectedSub ? 'text-nova-accent font-semibold' : 'text-nova-text2')}>
                          Désactivé
                        </button>
                        {sources.subtitles.map(sub => (
                          <button key={sub.url} onClick={() => { setSelectedSub(sub.url); setShowSubMenu(false); }}
                            className={cn('w-full text-left px-4 py-2.5 text-sm hover:bg-white/5', selectedSub === sub.url ? 'text-nova-accent font-semibold' : 'text-nova-text2')}>
                            {sub.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="px-4 pb-4 space-y-2">
              <div className="group/bar relative h-1.5 hover:h-3 bg-white/20 rounded-full cursor-pointer transition-all duration-150" onClick={handleSeek}>
                {sources.intro && duration > 0 && (
                  <div className="absolute top-0 bottom-0 bg-nova-gold/40 rounded-full"
                    style={{ left: `${(sources.intro.start / duration) * 100}%`, width: `${((sources.intro.end - sources.intro.start) / duration) * 100}%` }} />
                )}
                <div className="h-full bg-nova-accent rounded-full relative" style={{ width: `${progressPct}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={onPrev} disabled={!hasPrev} className="text-white/80 hover:text-white disabled:opacity-30">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                </button>
                <button onClick={() => { videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause(); }}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform">
                  {paused
                    ? <svg className="w-6 h-6 text-nova-bg ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    : <svg className="w-5 h-5 text-nova-bg" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  }
                </button>
                <button onClick={onNext} disabled={!hasNext} className="text-white/80 hover:text-white disabled:opacity-30">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 4V8l-5.5 4zM16 6h2v12h-2z"/></svg>
                </button>
                <span className="text-white/80 text-xs font-mono tabular-nums ml-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <div className="flex-1" />
                <div className="hidden sm:flex items-center gap-2">
                  <button onClick={() => setMuted(m => !m)} className="text-white/80 hover:text-white">
                    {muted || volume === 0
                      ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18l1.82 1.82L21 18.55 5.45 3 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
                      : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                    }
                  </button>
                  <input type="range" min={0} max={100} value={muted ? 0 : volume}
                    onChange={e => { setVolume(+e.target.value); setMuted(false); }}
                    className="w-20 accent-nova-accent cursor-pointer" />
                </div>
                <button onClick={toggleFullscreen} className="text-white/80 hover:text-white ml-2">
                  {fullscreen
                    ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                    : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
