import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '@/stores/userStore';
import { sync } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Lang } from '@/types';

export default function Profile() {
  const {
    anilistUser, anilistToken,
    setAnilistAuth, logoutAnilist,
    defaultLang, setLang,
    autoNext, setAutoNext,
    autoSkipIntro, setAutoSkip,
    history, watchlist, clearProgress,
    addToast,
  } = useUserStore();

  const [tab, setTab] = useState<'profile' | 'settings' | 'history'>('profile');

  const handleAniListLogin = () => {
    const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
    const redirect = `${window.location.origin}/auth/anilist`;
    if (!clientId) {
      addToast({ type: 'error', message: 'AniList Client ID non configuré' });
      return;
    }
    window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect}&response_type=code`;
  };

  const LANGS: { value: Lang; label: string; desc: string }[] = [
    { value: 'vostfr', label: 'VOSTFR', desc: 'Audio japonais, sous-titres français' },
    { value: 'vf',     label: 'VF',     desc: 'Doublage français' },
    { value: 'vo',     label: 'VO',     desc: 'Audio japonais, sous-titres anglais' },
  ];

  const stats = {
    watched: history.length,
    watchlist: watchlist.length,
    minutes: history.reduce((acc, h) => acc + Math.floor(h.duration / 60), 0),
  };

  return (
    <div className="min-h-screen bg-nova-bg pt-20 pb-32 px-4 md:px-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          {anilistUser ? (
            <img
              src={anilistUser.avatar.large}
              alt={anilistUser.name}
              className="w-16 h-16 rounded-full ring-4 ring-nova-accent/40"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-nova-bg2 border-2 border-nova-border flex items-center justify-center">
              <svg className="w-8 h-8 text-nova-muted" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-nova-text">
              {anilistUser?.name ?? 'Mon profil'}
            </h1>
            {anilistUser && (
              <p className="text-nova-muted text-sm">Connecté via AniList</p>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Vus',      value: stats.watched,  icon: '▶️' },
            { label: 'Ma liste', value: stats.watchlist, icon: '📋' },
            { label: 'Minutes',  value: stats.minutes,  icon: '⏱️' },
          ].map(s => (
            <div key={s.label} className="bg-nova-bg2 border border-nova-border rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{s.icon}</p>
              <p className="text-xl font-black text-nova-text">{s.value.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-nova-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-nova-bg2 rounded-xl p-1 mb-6">
          {(['profile', 'settings', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all capitalize',
                tab === t ? 'bg-nova-accent text-white shadow-sm' : 'text-nova-muted hover:text-nova-text'
              )}
            >
              {t === 'profile' ? 'Profil' : t === 'settings' ? 'Paramètres' : 'Historique'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* AniList */}
            <div className="bg-nova-bg2 border border-nova-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#02a9ff]/20 flex items-center justify-center">
                  <span className="text-[#02a9ff] font-black text-sm">AL</span>
                </div>
                <div>
                  <p className="font-bold text-nova-text text-sm">AniList</p>
                  <p className="text-xs text-nova-muted">Sync ta liste et progression</p>
                </div>
                {anilistUser && (
                  <span className="ml-auto flex items-center gap-1 text-nova-success text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-nova-success animate-pulse" />
                    Connecté
                  </span>
                )}
              </div>

              {anilistUser ? (
                <div className="space-y-3">
                  {anilistUser.statistics && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-black text-nova-text">{anilistUser.statistics.anime.count}</p>
                        <p className="text-[10px] text-nova-muted">Anime</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-nova-text">{anilistUser.statistics.anime.episodesWatched}</p>
                        <p className="text-[10px] text-nova-muted">Épisodes</p>
                      </div>
                      <div>
                        <p className="text-lg font-black text-nova-text">
                          {Math.floor(anilistUser.statistics.anime.minutesWatched / 60)}h
                        </p>
                        <p className="text-[10px] text-nova-muted">Regardés</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { logoutAnilist(); addToast({ type: 'info', message: 'Déconnecté d\'AniList' }); }}
                    className="w-full py-2.5 border border-nova-border rounded-xl text-nova-muted text-sm
                      hover:border-nova-accent hover:text-nova-accent transition-all"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAniListLogin}
                  className="w-full py-3 bg-[#02a9ff]/20 border border-[#02a9ff]/40 rounded-xl
                    text-[#02a9ff] font-bold text-sm hover:bg-[#02a9ff]/30 transition-all"
                >
                  Connecter AniList →
                </button>
              )}
            </div>
          </motion.div>
        )}

        {tab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Langue par défaut */}
            <SettingsCard title="🌐 Langue par défaut" desc="Appliquée à tous les nouveaux streams">
              <div className="flex gap-2">
                {LANGS.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setLang(l.value)}
                    className={cn(
                      'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border',
                      defaultLang === l.value
                        ? 'bg-nova-accent border-nova-accent text-white'
                        : 'border-nova-border text-nova-muted hover:text-nova-text'
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-nova-muted mt-2">
                {LANGS.find(l => l.value === defaultLang)?.desc}
              </p>
            </SettingsCard>

            {/* Lecture auto épisode suivant */}
            <SettingsCard title="⏭️ Épisode suivant automatique" desc="Lance le prochain épisode 30s avant la fin">
              <Toggle value={autoNext} onChange={setAutoNext} />
            </SettingsCard>

            {/* Skip intro auto */}
            <SettingsCard title="⏩ Skip intro automatique" desc="Passe l'intro/générique automatiquement">
              <Toggle value={autoSkipIntro} onChange={setAutoSkip} />
            </SettingsCard>

            {/* Danger zone */}
            <div className="bg-nova-bg2 border border-red-900/40 rounded-2xl p-5">
              <h3 className="font-bold text-nova-text mb-1 text-sm">Zone danger</h3>
              <p className="text-xs text-nova-muted mb-4">Ces actions sont irréversibles</p>
              <button
                onClick={() => {
                  history.forEach(h => clearProgress(h.tmdbId));
                  addToast({ type: 'success', message: 'Historique effacé' });
                }}
                className="w-full py-2.5 border border-red-900/50 rounded-xl text-red-400 text-sm
                  hover:bg-red-950/30 transition-all font-semibold"
              >
                Effacer tout l'historique
              </button>
            </div>
          </motion.div>
        )}

        {tab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {history.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">📺</p>
                <p className="text-nova-text font-bold mb-2">Aucun historique</p>
                <p className="text-nova-muted text-sm">Les épisodes regardés apparaissent ici</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 50).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-nova-bg2 border border-nova-border rounded-xl p-3">
                    {item.poster && (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster}`}
                        alt={item.title}
                        className="w-10 h-14 object-cover rounded-md shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-nova-text truncate">{item.title}</p>
                      <p className="text-xs text-nova-muted">
                        S{item.season}E{item.episode} · {item.lang.toUpperCase()}
                      </p>
                      <div className="mt-1.5 h-1 bg-nova-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-nova-accent rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-nova-muted shrink-0">
                      {new Date(item.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Sub-composants ────────────────────────────────────────────────

function SettingsCard({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-nova-bg2 border border-nova-border rounded-2xl p-5">
      <div className="mb-3">
        <p className="font-bold text-nova-text text-sm">{title}</p>
        <p className="text-xs text-nova-muted mt-0.5">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'relative w-12 h-6 rounded-full transition-colors',
        value ? 'bg-nova-accent' : 'bg-nova-border'
      )}
    >
      <motion.div
        animate={{ x: value ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  );
}
