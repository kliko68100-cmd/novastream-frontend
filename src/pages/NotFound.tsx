import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-nova-bg flex flex-col items-center justify-center text-center px-4">
      <p className="text-[120px] font-black text-nova-bg2 leading-none select-none">404</p>
      <h1 className="text-2xl font-bold text-nova-text mb-2">Page introuvable</h1>
      <p className="text-nova-muted mb-6">Cette page n'existe pas ou a été supprimée</p>
      <Link to="/" className="px-6 py-3 bg-nova-accent rounded-full text-white font-bold
        hover:bg-nova-accent/90 transition-all">
        Retour à l'accueil
      </Link>
    </div>
  );
}
