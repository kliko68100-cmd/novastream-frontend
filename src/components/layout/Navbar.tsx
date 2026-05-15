import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearch } from '@/hooks/useAnime';
import { useUserStore } from '@/stores/userStore';
import { img } from '@/lib/api';
import { debounce } from '@/lib/utils';

export function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [query,       setQuery]       = useState('');
  const [debouncedQ,  setDebouncedQ]  = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { anilistUser } = useUserStore();

  const debouncedSet = debounce((v: string) => setDebouncedQ(v), 350);
  const { data: searchData } = useSearch(debouncedQ);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ferme la recherche sur navigation
  useEffect(() => {
    setSearchOpen(false);
    setQuery('');
    setDebouncedQ('');
  }, [location.pathname]);

  const handleQuery = (v: string) => {
    setQuery(v);
    debouncedSet(v);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <motion.nav
        initial={false}
        animate={{
          backgroundColor: scrolled
            ? 'rgba(7,7,16,0.97)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-10"
      >
        <div className="flex h-16 items-center justify-between max-w-screen-2xl mx-auto">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-nova-gradient flex items-center justify-center">
                <span className="text-white font-black text-sm">N</span>
              </div>
              <div className="absolute -inset-0.5 rounded-lg bg-nova-gradient opacity-30 blur" />
            </div>
            <span className="font-black text-xl text-nova-text tracking-tight hidden sm:block">
              Nova<span className="text-nova-accent">Stream</span>
            </span>
          </Link>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/',           label: 'Accueil' },
              { to: '/anime', label: 'Anime' },
              { to: '/manga', label: 'Manga' },
              { to: '/watchlist',  label: 'Ma liste' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(to)
                    ? 'text-nova-text'
                    : 'text-nova-text2 hover:text-nova-text'
                }`}
              >
                {label}
                {isActive(to) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-4 right-4 h-0.5 bg-nova-accent rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="p-2 text-nova-text2 hover:text-nova-text transition-colors rounded-md hover:bg-white/5"
              aria-label="Rechercher"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>

            {/* Profile */}
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/5 transition-colors"
            >
              {anilistUser?.avatar ? (
                <img
                  src={anilistUser.avatar.large}
                  alt={anilistUser.name}
                  className="w-7 h-7 rounded-full ring-2 ring-nova-accent/50"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-nova-border flex items-center justify-center">
                  <svg className="w-4 h-4 text-nova-text2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </div>
              )}
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-nova-bg/80 backdrop-blur-xl"
            onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="mx-auto mt-20 max-w-2xl px-4"
            >
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nova-text2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => handleQuery(e.target.value)}
                    placeholder="Rechercher un anime..."
                    className="w-full bg-nova-bg2 border border-nova-border rounded-2xl pl-12 pr-12 py-4
                      text-nova-text text-lg placeholder:text-nova-muted
                      focus:outline-none focus:ring-2 focus:ring-nova-accent/50"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-nova-text2 hover:text-nova-text"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M18 6 6 18M6 6l12 12"/>
                    </svg>
                  </button>
                </div>
              </form>

              {/* Quick results */}
              {debouncedQ && searchData?.results?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-nova-bg2/95 border border-nova-border rounded-2xl overflow-hidden shadow-2xl"
                >
                  {searchData.results.slice(0, 6).map((item: any) => (
                    <Link
                      key={item.id}
                      to={`/anime/${item.id}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                    >
                      <img
                        src={img.poster(item.poster_path, 'w185') ?? '/placeholder.jpg'}
                        alt={item.name}
                        className="w-10 h-14 object-cover rounded-md shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-nova-text truncate">{item.name}</p>
                        <p className="text-xs text-nova-muted">{item.first_air_date?.slice(0, 4) ?? ''}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-nova-gold shrink-0">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-xs">{item.vote_average?.toFixed(1)}</span>
                      </div>
                    </Link>
                  ))}
                  <Link
                    to={`/search?q=${encodeURIComponent(query)}`}
                    onClick={() => setSearchOpen(false)}
                    className="block p-3 text-center text-sm text-nova-accent hover:bg-white/5 transition-colors font-medium"
                  >
                    Voir tous les résultats →
                  </Link>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Bottom Nav (mobile) ───────────────────────────────────────────

export function BottomNav() {
  const location = useLocation();

  const tabs = [
    { to: '/',          icon: HomeIcon,      label: 'Accueil'  },
    { to: '/anime',     icon: GridIcon,      label: 'Anime'    },
    { to: '/search',    icon: SearchIcon,    label: 'Recherche'},
    { to: '/watchlist', icon: BookmarkIcon,  label: 'Ma liste' },
    { to: '/profile',   icon: ProfileIcon,   label: 'Profil'   },
  ];

  // Cache le bottom nav sur la page watch (plein écran)
  if (location.pathname.startsWith('/watch')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-nova-bg/95 backdrop-blur-xl border-t border-nova-border safe-area-pb">
      {tabs.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <Link key={to} to={to} className="flex flex-1 flex-col items-center py-2 gap-0.5 relative">
            {active && (
              <motion.div
                layoutId="bottom-indicator"
                className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-nova-accent rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={`w-6 h-6 transition-colors ${active ? 'text-nova-accent' : 'text-nova-muted'}`} />
            <span className={`text-[10px] font-medium transition-colors ${active ? 'text-nova-accent' : 'text-nova-muted'}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Icons ─────────────────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function GridIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>;
}
function SearchIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
}
function BookmarkIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
}
function ProfileIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
