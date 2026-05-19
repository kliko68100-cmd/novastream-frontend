import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { Theme, AccentColor, Lang } from '@/types';

const THEMES: { value: Theme; label: string; bg: string }[] = [
  { value: 'dark',   label: 'Sombre',   bg: '#0d0d14' },
  { value: 'darker', label: 'Plus sombre', bg: '#080810' },
  { value: 'amoled', label: 'AMOLED',   bg: '#000000' },
];

const ACCENTS: { value: AccentColor; label: string; color: string }[] = [
  { value: 'red',    label: 'Rouge',   color: '#e53e3e' },
  { value: 'blue',   label: 'Bleu',    color: '#3182ce' },
  { value: 'purple', label: 'Violet',  color: '#805ad5' },
  { value: 'green',  label: 'Vert',    color: '#38a169' },
  { value: 'orange', label: 'Orange',  color: '#dd6b20' },
];

const TABS = ['Profil', 'Paramètres', 'Historique'] as const;
type Tab = typeof TABS[number];

export default function Profile() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('Profil');

  const anilistUser    = useUserStore(s => s.anilistUser);
  const anilistToken   = useUserStore(s => s.anilistToken);
  const logoutAnilist  = useUserStore(s => s.logoutAnilist);
  const watchlist      = useUserStore(s => s.watchlist);
  const history        = useUserStore(s => s.history);
  const getStats       = useUserStore(s => s.getStats);
  const defaultLang    = useUserStore(s => s.defaultLang);
  const autoNext       = useUserStore(s => s.autoNext);
  const autoSkipIntro  = useUserStore(s => s.autoSkipIntro);
  const theme          = useUserStore(s => s.theme);
  const accentColor    = useUserStore(s => s.accentColor);
  const setLang        = useUserStore(s => s.setLang);
  const setAutoNext    = useUserStore(s => s.setAutoNext);
  const setAutoSkip    = useUserStore(s => s.setAutoSkip);
  const setTheme       = useUserStore(s => s.setTheme);
  const setAccentColor = useUserStore(s => s.setAccentColor);
  const clearProgress  = useUserStore(s => s.clearProgress);
  const addToast       = useUserStore(s => s.addToast);

  const stats = getStats();

  // Appliquer thème en temps réel
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor);
  }, [accentColor]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 24 ? `${Math.floor(h/24)}j ${h%24}h` : `${h}h${m > 0 ? ` ${m}min` : ''}`;
  };

  const LANGS: { value: Lang; label: string }[] = [
    { value: 'vostfr', label: 'VOSTFR' },
    { value: 'vf',     label: 'VF'     },
    { value: 'vo',     label: 'VO'     },
  ];

  return (
    <div className="min-h-screen bg-nova-bg pb-24">
      {/* Header profil */}
      <div className="bg-nova-bg2 border-b border-nova-border px-4 md:px-10 py-6">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {anilistUser?.avatar?.large
            ? <img src={anilistUser.avatar.large} alt="" className="w-16 h-16 rounded-full border-2 border-nova-accent" />
            : <div className="w-16 h-16 rounded-full bg-nova-border flex items-center justify-center">
                <svg className="w-8 h-8 text-nova-muted" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </div>
          }
          <div>
            <h1 className="text-xl font-black text-nova-text">
              {anilistUser?.name ?? 'Mon profil'}
            </h1>
            {anilistUser && (
              <p className="text-sm text-nova-muted">Connecté via AniList</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Temps visionné', value: formatTime(stats.totalMinutes), icon: '⏱' },
            { label: 'Épisodes vus',   value: stats.totalEpisodes.toString(), icon: '▶' },
            { label: 'Animes',         value: stats.totalAnime.toString(),    icon: '🎌' },
            { label: 'Ma liste',       value: watchlist.length.toString(),    icon: '📋' },
          ].map(s => (
            <div key={s.label} className="bg-nova-bg border border-nova-border rounded-xl p-3 text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-lg font-black text-nova-text">{s.value}</p>
              <p className="text-[10px] text-nova-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4 md:px-0">
        <div className="flex border-b border-nova-border mt-0">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-1 py-3 text-sm font-semibold transition-colors',
                tab === t
                  ? 'text-nova-accent border-b-2 border-nova-accent'
                  : 'text-nova-muted hover:text-nova-text')}>
              {t}
            </button>
          ))}
        </div>

        {/* Profil tab */}
        {tab === 'Profil' && (
          <div className="py-6 space-y-4">
            {/* AniList connect */}
            <div className="bg-nova-bg2 border border-nova-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-black text-sm">AL</span>
                </div>
                <div>
                  <p className="font-semibold text-nova-text text-sm">AniList</p>
                  <p className="text-xs text-nova-muted">Sync ta liste et progression</p>
                </div>
              </div>
              {anilistToken ? (
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400 font-semibold">
                    ✅ Connecté — {anilistUser?.name}
                  </div>
                  <button onClick={() => { logoutAnilist(); addToast({ type: 'info', message: 'Déconnecté d\'AniList', duration: 3000 }); }}
                    className="px-3 py-2 bg-nova-border rounded-lg text-xs text-nova-muted hover:text-nova-text">
                    Déconnecter
                  </button>
                </div>
              ) : (
                <a href="https://anilist.co/api/v2/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=token"
                  target="_blank" rel="noopener noreferrer"
                  className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-sm font-bold text-center transition-all">
                  Connecter AniList →
                </a>
              )}
            </div>

            {/* Ma liste */}
            {watchlist.length > 0 && (
              <div>
                <h3 className="font-bold text-nova-text text-sm mb-3">Ma liste ({watchlist.length})</h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {watchlist.slice(0,12).map(item => (
                    <motion.div key={item.tmdbId} whileHover={{ scale: 1.05 }}
                      onClick={() => navigate(`/anime/${item.tmdbId}`)}
                      className="cursor-pointer aspect-[2/3] rounded-lg overflow-hidden bg-nova-bg2">
                      {item.poster
                        ? <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">🎌</div>
                      }
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paramètres tab */}
        {tab === 'Paramètres' && (
          <div className="py-6 space-y-6">
            {/* Langue par défaut */}
            <div>
              <h3 className="text-sm font-bold text-nova-text mb-3">Langue par défaut</h3>
              <div className="flex gap-2">
                {LANGS.map(l => (
                  <button key={l.value} onClick={() => setLang(l.value)}
                    className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                      defaultLang === l.value
                        ? 'bg-nova-accent text-white'
                        : 'bg-nova-bg2 border border-nova-border text-nova-muted hover:text-nova-text')}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thème */}
            <div>
              <h3 className="text-sm font-bold text-nova-text mb-3">Thème</h3>
              <div className="flex gap-2">
                {THEMES.map(t => (
                  <button key={t.value} onClick={() => setTheme(t.value)}
                    className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-2',
                      theme === t.value ? 'border-nova-accent' : 'border-nova-border')}
                    style={{ backgroundColor: t.bg }}>
                    <span className="text-white/80 text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur d'accent */}
            <div>
              <h3 className="text-sm font-bold text-nova-text mb-3">Couleur d'accent</h3>
              <div className="flex gap-3">
                {ACCENTS.map(a => (
                  <button key={a.value} onClick={() => setAccentColor(a.value)}
                    className={cn('w-10 h-10 rounded-full transition-all border-4',
                      accentColor === a.value ? 'border-white scale-110' : 'border-transparent hover:scale-105')}
                    style={{ backgroundColor: a.color }}
                    title={a.label} />
                ))}
              </div>
            </div>

            {/* Lecteur */}
            <div>
              <h3 className="text-sm font-bold text-nova-text mb-3">Lecteur vidéo</h3>
              <div className="space-y-2">
                {[
                  { label: 'Lecture auto suivant', value: autoNext,      set: setAutoNext },
                  { label: 'Passer intros auto',   value: autoSkipIntro, set: setAutoSkip },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-nova-bg2 border border-nova-border rounded-xl">
                    <span className="text-sm text-nova-text">{label}</span>
                    <button onClick={() => set(!value)}
                      className={cn('w-12 h-6 rounded-full transition-all relative',
                        value ? 'bg-nova-accent' : 'bg-nova-border')}>
                      <div className={cn('absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                        value ? 'left-7' : 'left-1')} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div>
              <h3 className="text-sm font-bold text-red-400 mb-3">Zone dangereuse</h3>
              <button
                onClick={() => {
                  if (confirm('Effacer tout l\'historique ?')) {
                    history.forEach(h => clearProgress(h.tmdbId));
                    addToast({ type: 'success', message: 'Historique effacé', duration: 3000 });
                  }
                }}
                className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-semibold hover:bg-red-500/20">
                Effacer l'historique de visionnage
              </button>
            </div>
          </div>
        )}

        {/* Historique tab */}
        {tab === 'Historique' && (
          <div className="py-6">
            {history.length === 0 ? (
              <div className="text-center py-16 text-nova-muted">
                <p className="text-4xl mb-3">📺</p>
                <p className="font-semibold">Aucun historique</p>
                <p className="text-sm mt-1">Les animes que tu regardes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0,50).map((h, i) => (
                  <motion.div key={i} whileHover={{ x: 4 }}
                    onClick={() => navigate(`/watch/${h.tmdbId}?ep=${h.episode}&season=${h.season}&lang=${h.lang}`)}
                    className="flex items-center gap-3 p-3 bg-nova-bg2 border border-nova-border rounded-xl cursor-pointer hover:border-nova-accent/30 transition-all">
                    {h.poster && <img src={h.poster} alt={h.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-nova-text truncate">{h.title}</p>
                      <p className="text-xs text-nova-muted">S{h.season} · Ép.{h.episode} · {h.lang.toUpperCase()}</p>
                      <div className="mt-1.5 h-1 bg-nova-border rounded-full overflow-hidden w-24">
                        <div className="h-full bg-nova-accent/60 rounded-full" style={{ width: `${h.progress}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-nova-muted">{h.progress}%</p>
                      <p className="text-[10px] text-nova-muted/50 mt-0.5">
                        {new Date(h.updatedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
