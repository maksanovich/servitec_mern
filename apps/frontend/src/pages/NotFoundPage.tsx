import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-light text-slate-300 dark:text-slate-600 tracking-tight">404</p>
        <h1 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-200">
          Página no encontrada
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
          La ruta <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-xs">{location.pathname}</code> no existe.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Link
            to={isAdminPath ? '/admin' : '/'}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
          >
            <Home className="w-4 h-4" /> {isAdminPath ? 'Panel' : 'Inicio'}
          </Link>
        </div>
      </div>
    </div>
  );
}
