import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import logoUrl from '../assets/images/logo.png';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../contexts/ThemeContext';
import { Input } from './ui';
import {
  LayoutDashboard,
  Wrench,
  Package,
  DollarSign,
  Building2,
  GitBranch,
  Users,
  Shield,
  FileQuestion,
  Stethoscope,
  Menu,
  Search,
  Sun,
  Moon,
  Grid3X3,
  Bell,
  User,
  LogOut,
  LucideIcon,
  UserCircle,
  Cpu,
  Layers,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { userCanAccessPage } from '../constants/adminPages';

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
    label: 'Operations',
    items: [
      { path: '/admin/order', label: 'Orders', icon: Wrench },
      { path: '/admin/pre-diagnosis', label: 'Pre-Diagnosis', icon: Stethoscope },
    ],
  },
  {
    label: 'Workshop Setup',
    items: [
      { path: '/admin/clients', label: 'Clients', icon: UserCircle },
      { path: '/admin/brand', label: 'Brand', icon: Tag },
      { path: '/admin/models', label: 'Models', icon: Cpu },
      { path: '/admin/accessories', label: 'Accessories', icon: Layers },
      { path: '/admin/products', label: 'Products', icon: ShoppingBag },
    ],
  },
  {
    label: 'Catalog & Finance',
    items: [
      { path: '/admin/services', label: 'Services & Spare Parts', icon: Package },
      { path: '/admin/income', label: 'Income', icon: DollarSign },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/admin/company', label: 'Company', icon: Building2 },
      { path: '/admin/branch', label: 'Branches', icon: GitBranch },
      { path: '/admin/users', label: 'Users', icon: Users },
      { path: '/admin/roles', label: 'Roles', icon: Shield },
    ],
  },
  {
    label: null,
    items: [{ path: '/admin/docs', label: 'Documentation', icon: FileQuestion }],
  },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const visibleNavGroups = useMemo(() => {
    if (!user?.role) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => userCanAccessPage(user, item.path)),
      }))
      .filter((g) => g.items.length > 0);
  }, [user]);
  const allVisibleApps = useMemo(
    () => visibleNavGroups.flatMap((group) => group.items),
    [visibleNavGroups]
  );
  const quickAccessApps = useMemo(() => allVisibleApps.slice(0, 8), [allVisibleApps]);
  const { company } = useCompany();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [appsPanelOpen, setAppsPanelOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setAppsPanelOpen(false);
      }
    }

    if (appsPanelOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [appsPanelOpen]);

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Sidebar - fixed so it stays visible when scrolling */}
      <aside
        className={`fixed left-0 top-0 h-screen z-20 flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-150 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`border-b border-slate-200 dark:border-slate-700 flex items-center ${sidebarCollapsed ? 'p-3 justify-center' : 'p-4'}`}>
          <Link to="/admin" className="flex justify-center w-full text-slate-900 dark:text-white font-semibold">
            <img
              src={company?.logo?.trim() || logoUrl}
              alt={company?.companyName || 'Company'}
              className="h-auto w-44 object-contain"
            />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {visibleNavGroups.map((group, index) => (
            <div key={group.label ?? `nav-group-${index}`} className="mb-4">
              {group.label && !sidebarCollapsed && (
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {group.items.map(({ path, label, icon: Icon }) => {
                  const isActive =
                    location.pathname === path ||
                    (path !== '/admin' && location.pathname.startsWith(path + '/'));
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        title={sidebarCollapsed ? label : undefined}
                        className={`flex items-center rounded-lg text-sm transition-colors ${
                          sidebarCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'
                        } ${
                          isActive
                            ? 'bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && <span>{label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content - offset by sidebar width; min-h-0 so only main scrolls */}
      <div
        className={`flex-1 flex flex-col min-h-0 min-w-0 transition-[margin] duration-150 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header - fixed at top when scrolling */}
        <header className="sticky top-0 z-30 overflow-visible h-14 flex-shrink-0 bg-white/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 gap-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 max-w-xl">
              <Input leftIcon={Search} placeholder="Write something..." />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => setAppsPanelOpen((prev) => !prev)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Apps"
              aria-expanded={appsPanelOpen}
              aria-controls="apps-panel"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 pl-4 ml-2 border-l border-slate-200 dark:border-slate-600">
              {!sidebarCollapsed && (
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {user?.name || user?.email || 'Administrator'}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">{user?.role?.name || user?.role?.slug?.replace(/_/g, ' ') || 'Admin'}</div>
                </div>
              )}
              <div className="relative overflow-visible" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Profile menu"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium">
                    {(user?.name || user?.email || 'A')[0].toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
                </button>
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-[100]">
                    <Link
                      to="/admin/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <hr className="my-1 border-slate-200 dark:border-slate-600" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <div
        className={`fixed inset-0 z-40 transition-opacity duration-200 ${
          appsPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => setAppsPanelOpen(false)}
          className="absolute inset-0 bg-slate-900/35 dark:bg-slate-950/60"
          aria-label="Close app panel"
        />
        <aside
          id="apps-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Apps panel"
          className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl transform transition-transform duration-200 ${
            appsPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-14 px-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Apps</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Quick access to admin modules</p>
            </div>
            <button
              type="button"
              onClick={() => setAppsPanelOpen(false)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Close apps panel"
            >
              <Menu className="w-5 h-5 rotate-90" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto h-[calc(100%-56px)] space-y-6">
            <section>
              <h3 className="px-1 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fast Access
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickAccessApps.map(({ path, label, icon: Icon }) => {
                  const isActive =
                    location.pathname === path ||
                    (path !== '/admin' && location.pathname.startsWith(path + '/'));
                  return (
                    <Link
                      key={`quick-app-${path}`}
                      to={path}
                      onClick={() => setAppsPanelOpen(false)}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                        isActive
                          ? 'border-blue-300 dark:border-blue-500/60 bg-blue-50 dark:bg-blue-600/15 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-2" />
                      <span className="block text-sm font-medium leading-tight">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
