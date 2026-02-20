import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Wrench,
  Settings,
  Package,
  DollarSign,
  Building2,
  GitBranch,
  Users,
  Shield,
  FileQuestion,
  Menu,
  Search,
  Sun,
  Grid3X3,
  Bell,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ path: '/admin', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Components',
    items: [
      { path: '/admin/repair-shop', label: 'Repair Shop', icon: Wrench },
      { path: '/admin/workshop-config', label: 'Workshop Configurations', icon: Settings },
      { path: '/admin/services', label: 'Services / Spare Parts', icon: Package },
      { path: '/admin/income', label: 'Monetary Income', icon: DollarSign },
    ],
  },
  {
    label: 'Configurations',
    items: [
      { path: '/admin/company', label: 'Company', icon: Building2 },
      { path: '/admin/branch', label: 'Branch', icon: GitBranch },
      { path: '/admin/users', label: 'Users', icon: Users },
      { path: '/admin/roles', label: 'Roles', icon: Shield },
    ],
  },
  {
    label: 'Documentation',
    items: [{ path: '/admin/docs', label: 'Documentation', icon: FileQuestion }],
  },
];

export function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <Link to="/admin" className="flex items-center gap-2 text-white font-semibold">
            <span className="text-blue-400 font-bold">Digitalserver</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navGroups.map((group) => (
            <div key={group.label || 'main'} className="mb-4">
              {group.label && (
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map(({ path, label, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex-shrink-0 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Write something..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Light mode"
            >
              <Sun className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Apps"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 ml-2 border-l border-slate-600">
              <div className="text-right">
                <div className="text-sm font-medium text-white">Administrator User</div>
                <div className="text-xs text-slate-500">Administrator</div>
              </div>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 font-medium">
                  A
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-800" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
