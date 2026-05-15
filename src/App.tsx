import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { ToastContainer } from '@/components/ui/Toast';

function PageLoader() {
  return (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-nova-accent/20 border-t-nova-accent animate-spin" />
    </div>
  );
}

const Home         = lazy(() => import('@/pages/Home'));
const AnimeCatalog = lazy(() => import('@/pages/Anime'));
const AnimePage    = lazy(() => import('@/pages/AnimePage'));
const AnimeAniList = lazy(() => import('@/pages/AnimeAniList'));
const Watch        = lazy(() => import('@/pages/Watch'));
const Search       = lazy(() => import('@/pages/Search'));
const Profile      = lazy(() => import('@/pages/Profile'));
const NotFound     = lazy(() => import('@/pages/NotFound'));
const MangaCatalog = lazy(() => import('@/pages/Manga'));
const MangaPage    = lazy(() => import('@/pages/MangaPage'));
const MangaReader  = lazy(() => import('@/pages/MangaReader'));

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          5 * 60_000,
      gcTime:             30 * 60_000,
      retry:              2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Navbar />
        <ToastContainer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/"                        element={<Home />} />
            <Route path="/anime"                   element={<AnimeCatalog />} />
            <Route path="/anime/al/:id"            element={<AnimeAniList />} />
            <Route path="/anime/:id"               element={<AnimePage />} />
            <Route path="/watch/:id"               element={<Watch />} />
            <Route path="/search"                  element={<Search />} />
            <Route path="/profile"                 element={<Profile />} />
            <Route path="/manga"                   element={<MangaCatalog />} />
            <Route path="/manga/:id"               element={<MangaPage />} />
            <Route path="/manga/:id/read/:chapterId" element={<MangaReader />} />
            <Route path="*"                        element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
