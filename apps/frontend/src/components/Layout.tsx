import { Link, useLocation, Outlet } from 'react-router-dom';

import Logo from '../assets/images/logo.png';

export function Layout() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Inicio' },
    { path: '/blog', label: 'Blog' },
    { path: '/diagnosis', label: 'Pre-diagnóstico' },
    { path: '/track', label: 'Seguir orden' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100]">
        <div className="max-w-[1120px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900">
            <img src={Logo} alt="Logo" className="w-40 h-10" />
          </Link>
          <nav className="flex gap-8">
            {navItems.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`text-[0.9375rem] font-medium transition-colors ${
                  location.pathname === path ? 'text-[var(--color-accent)]' : 'text-slate-500'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-[1120px] mx-auto py-12 px-6 w-full">
        <Outlet />
      </main>
    </div>
  );
}
