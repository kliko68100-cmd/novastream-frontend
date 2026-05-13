import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AnimatePresence } from 'framer-motion';
import { queryClient } from '@/lib/queryClient';
import { Navbar, BottomNav } from '@/components/layout/Navbar';
import { ToastContainer } from '@/components/ui/Toast';

// Lazy pages — code splitting automatique
const Home      = lazy(() => import('@/pages/Home'));
const AnimePage = lazy(() => import('@/pages/AnimePage'));
const Watch     = lazy(() => import('@/pages/Watch'));
const Search    = lazy(() => import('@/pages/Search'));
const Profile   = lazy(() => import('@/pages/Profile'));
const Watchlist = lazy(() => import('@/pages/Watchlist'));

// Page loader
function PageLoader() {
  return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
          <div className="absolute inset-2 rounded-full bg-nova-accent/10 animate-pulse" />
        </div>
        <p className="text-nova-muted text-sm font-medium animate-pulse">Chargement...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isWatch  = location.pathname.startsWith('/watch');

  return (
    <div className="bg-nova-bg min-h-screen text-nova-text font-sans">
      {/* Navbar cachée en mode watch */}
      {!isWatch && <Navbar />}

      <AnimatePresence mode="wait" initial={false}>
        <Suspense fallback={<PageLoader />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/"           element={<Home />} />
            <Route path="/anime/:id"  element={<AnimePage />} />
            <Route path="/watch/:id"  element={<Watch />} />
            <Route path="/search"     element={<Search />} />
            <Route path="/profile"    element={<Profile />} />
            <Route path="/watchlist"  element={<Watchlist />} />
            <Route path="*"           element={<NotFound />} />
          </Routes>
        </Suspense>
      </AnimatePresence>

      {!isWatch && <BottomNav />}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-nova-bg flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-8xl font-black text-nova-border">404</p>
      <p className="text-nova-text text-2xl font-bold">Page introuvable</p>
      <p className="text-nova-muted text-sm">Cette page n'existe pas ou a été supprimée</p>
      <a href="/" className="mt-4 px-8 py-3 bg-nova-accent rounded-full text-white font-bold hover:bg-nova-accent/90 transition-colors">
        Retour à l'accueil
      </a>
    </div>
  );
}
