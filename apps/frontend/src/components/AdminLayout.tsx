import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import logoUrl from '../assets/images/logo.png';
import headerLogoUrl from '../assets/images/header-logo.png';
import noImageUrl from '../assets/images/profile.png';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { useTheme } from '../contexts/ThemeContext';
import { Input } from './ui';
import { resolveMediaSrc } from '../utils/mediaUrl';
import {
  LayoutDashboard,
  Wrench,
  Package,
  DollarSign,
  Building2,
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
  CheckCheck,
  Inbox,
  X,
  Boxes,
  History,
  Mail,
} from 'lucide-react';
import {
  ADMIN_SLUG,
  SUPER_ADMIN_SLUG,
  userCanAccessPage,
  userHasSparePartsAccess,
} from '../constants/adminPages';
import { useNotifications } from '../contexts/NotificationContext';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** If set, permission uses this path (must match RequirePage / API for that screen). */
  accessPath?: string;
  /** If set, only these role slugs see the item (e.g. built-in admin, not technicians). */
  visibleOnlyFor?: readonly string[];
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

function isNavItemActive(path: string, pathname: string): boolean {
  if (pathname === path) return true;
  if (path === '/admin') return false;
  if (!pathname.startsWith(path + '/')) return false;
  if (path === '/admin/order') {
    if (
      pathname.startsWith('/admin/order/movements') ||
      pathname.startsWith('/admin/order/stages')
    ) {
      return false;
    }
  }
  return true;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 45) return 'Ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

function HeaderUserAvatar({
  name,
  email,
  avatar,
}: {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaSrc(avatar);
  useEffect(() => {
    setFailed(false);
  }, [avatar]);

  const url = !failed && resolved ? resolved : noImageUrl;
  const label = (name || email || 'Usuario').trim() || 'Usuario';

  return (
    <img
      src={url}
      alt={label}
      className="w-9 h-9 rounded-full object-cover bg-slate-200 dark:bg-slate-600"
      onError={() => setFailed(true)}
    />
  );
}

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [{ path: '/admin', label: 'Panel', icon: LayoutDashboard }],
  },
  {
    label: 'Operaciones',
    items: [
      { path: '/admin/order', label: 'Pedidos', icon: Wrench },
      {
        path: '/admin/order/movements',
        label: 'Movimientos de pedidos',
        icon: History,
        accessPath: '/admin/order',
        visibleOnlyFor: [SUPER_ADMIN_SLUG, ADMIN_SLUG],
      },
      { path: '/admin/pre-diagnosis', label: 'Pre-diagnóstico', icon: Stethoscope },
    ],
  },
  {
    label: 'Taller',
    items: [
      { path: '/admin/clients', label: 'Clientes', icon: UserCircle },
      { path: '/admin/brand', label: 'Marcas', icon: Tag },
      { path: '/admin/models', label: 'Modelos', icon: Cpu },
      { path: '/admin/accessories', label: 'Accesorios', icon: Layers },
      { path: '/admin/products', label: 'Productos', icon: ShoppingBag },
    ],
  },
  {
    label: 'Catálogo y finanzas',
    items: [
      { path: '/admin/services', label: 'Servicios', icon: Package },
      { path: '/admin/spare', label: 'Repuestos', icon: Boxes },
      { path: '/admin/income', label: 'Ingresos', icon: DollarSign },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { path: '/admin/company', label: 'Empresa', icon: Building2 },
      { path: '/admin/mail', label: 'Correo', icon: Mail },
      { path: '/admin/users', label: 'Usuarios', icon: Users },
      { path: '/admin/roles', label: 'Roles', icon: Shield },
    ],
  },
  {
    label: null,
    items: [{ path: '/admin/docs', label: 'Documentación', icon: FileQuestion }],
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
        items: group.items.filter((item) => {
          if (item.visibleOnlyFor?.length) {
            const slug = user.role?.slug;
            if (!slug || !item.visibleOnlyFor.includes(slug)) return false;
          }
          if (item.path === '/admin/spare') {
            return userHasSparePartsAccess(user);
          }
          return userCanAccessPage(user, item.accessPath ?? item.path);
        }),
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    remove,
    clearAll,
  } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
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

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setNotificationsOpen(false);
    }
    if (notificationsOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [notificationsOpen]);

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
              src={
                company?.logo?.trim() ||
                (sidebarCollapsed ? headerLogoUrl : logoUrl)
              }
              alt={company?.companyName || 'Empresa'}
              className={
                sidebarCollapsed
                  ? 'h-10 w-10 object-contain'
                  : 'h-auto w-44 object-contain'
              }
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
                  const isActive = isNavItemActive(path, location.pathname);
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
              <Input leftIcon={Search} placeholder="Buscar..." />
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
              onClick={() => {
                setNotificationsOpen(false);
                setAppsPanelOpen((prev) => !prev);
              }}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Aplicaciones"
              aria-expanded={appsPanelOpen}
              aria-controls="apps-panel"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => {
                  setAppsPanelOpen(false);
                  setNotificationsOpen((prev) => !prev);
                }}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Notificaciones"
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold leading-none text-white bg-red-500 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div
                  role="dialog"
                  aria-label="Notificaciones"
                  className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(28rem,calc(100vh-5rem))] flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-[100]"
                >
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-600 flex-shrink-0">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Notificaciones</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {notifications.length === 0
                          ? 'Sin elementos'
                          : `${unreadCount} sin leer`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllRead()}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Marcar todo como leído"
                          aria-label="Marcar todo como leído"
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => clearAll()}
                          className="px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        >
                          Vaciar
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 min-h-0">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                        <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Aún no hay nada</p>
                        <p className="text-xs mt-1 max-w-[16rem] mx-auto">
                          Las actualizaciones importantes de la aplicación aparecerán aquí cuando se registren.
                        </p>
                      </div>
                    ) : (
                      <ul className="py-1">
                        {notifications.map((n) => {
                          const content = (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={`text-sm font-medium leading-snug ${
                                    n.read
                                      ? 'text-slate-600 dark:text-slate-400'
                                      : 'text-slate-900 dark:text-white'
                                  }`}
                                >
                                  {n.title}
                                </span>
                                {!n.read && (
                                  <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" aria-hidden />
                                )}
                              </div>
                              {n.body && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                              )}
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                {formatRelativeTime(n.createdAt)}
                              </p>
                            </>
                          );
                          const rowClass = `block w-full text-left pl-4 pr-10 py-3 border-b border-slate-100 dark:border-slate-700/80 last:border-b-0 transition-colors ${
                            n.read
                              ? 'bg-transparent'
                              : 'bg-blue-50/60 dark:bg-blue-900/15'
                          } hover:bg-slate-50 dark:hover:bg-slate-700/40`;
                          return (
                            <li key={n.id} className="group relative">
                              {n.href ? (
                                <Link
                                  to={n.href}
                                  className={rowClass}
                                  onClick={() => {
                                    markAsRead(n.id);
                                    setNotificationsOpen(false);
                                  }}
                                >
                                  {content}
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  className={rowClass}
                                  onClick={() => markAsRead(n.id)}
                                >
                                  {content}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  remove(n.id);
                                }}
                                className="absolute top-2 right-2 z-10 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-600"
                                aria-label="Descartar notificación"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 pl-4 ml-2 border-l border-slate-200 dark:border-slate-600">
              {!sidebarCollapsed && (
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {user?.name || user?.email || 'Administrador'}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">{user?.role?.name || user?.role?.slug?.replace(/_/g, ' ') || 'Administrador'}</div>
                </div>
              )}
              <div className="relative overflow-visible" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  title="Menú de perfil"
                >
                  <HeaderUserAvatar name={user?.name} email={user?.email} avatar={user?.avatar} />
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
                      Perfil
                    </Link>
                    <hr className="my-1 border-slate-200 dark:border-slate-600" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
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
          aria-label="Cerrar panel de aplicaciones"
        />
        <aside
          id="apps-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Panel de aplicaciones"
          className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl transform transition-transform duration-200 ${
            appsPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-14 px-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Aplicaciones</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Acceso rápido a los módulos</p>
            </div>
            <button
              type="button"
              onClick={() => setAppsPanelOpen(false)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Cerrar panel de aplicaciones"
            >
              <Menu className="w-5 h-5 rotate-90" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto h-[calc(100%-56px)] space-y-6">
            <section>
              <h3 className="px-1 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Acceso rápido
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {quickAccessApps.map(({ path, label, icon: Icon }) => {
                  const isActive = isNavItemActive(path, location.pathname);
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
