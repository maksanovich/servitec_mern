import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div>
      <aside>
        <h2>Servitec Admin</h2>
        <nav>
          <a href="/">Dashboard</a>
          {/* Add menu items as features are built */}
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
