import { useEffect, useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

import Logo from '../assets/images/logo.png';

export function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Inicio' },
    { path: '/blog', label: 'Blog' },
    { path: '/diagnosis', label: 'Pre-diagnóstico' },
    { path: '/track', label: 'Seguir orden' },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const linkClass = (path: string) =>
    `text-[0.9375rem] font-medium transition-colors py-1 ${
      location.pathname === path ? 'text-[var(--color-accent)]' : 'text-slate-500'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0 min-w-0">
            <img
              src={Logo}
              alt="Servitec"
              className="h-8 sm:h-10 w-auto max-w-[min(200px,55vw)] object-contain object-left"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Principal">
            {navItems.map(({ path, label }) => (
              <Link key={path} to={path} className={linkClass(path)}>
                {label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{menuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            {menuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <div
          id="mobile-nav"
          hidden={!menuOpen}
          className="md:hidden border-t border-slate-100 bg-white"
        >
          <nav className="px-4 sm:px-6 py-4 flex flex-col gap-1" aria-label="Principal móvil">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`${linkClass(path)} rounded-lg px-2 -mx-2 hover:bg-slate-50`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 min-w-0 max-w-[1120px] mx-auto py-8 sm:py-12 px-4 sm:px-6 w-full">
        <Outlet />
      </main>
    </div>
  );
}
