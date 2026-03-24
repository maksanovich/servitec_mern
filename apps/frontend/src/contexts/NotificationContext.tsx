import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

const STORAGE_KEY = 'servitec_admin_notifications_v1';
const MAX_ITEMS = 80;

export type AdminNotification = {
  id: string;
  title: string;
  body?: string;
  createdAt: number;
  read: boolean;
  /** Optional path under /admin/... — opens in same tab and marks read */
  href?: string;
};

type AddInput = Omit<AdminNotification, 'id' | 'createdAt' | 'read'> & {
  id?: string;
  createdAt?: number;
  read?: boolean;
};

function loadInitial(): AdminNotification[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is AdminNotification =>
        typeof n === 'object' &&
        n !== null &&
        typeof (n as AdminNotification).id === 'string' &&
        typeof (n as AdminNotification).title === 'string' &&
        typeof (n as AdminNotification).createdAt === 'number' &&
        typeof (n as AdminNotification).read === 'boolean'
    );
  } catch {
    return [];
  }
}

interface NotificationContextValue {
  notifications: AdminNotification[];
  unreadCount: number;
  addNotification: (n: AddInput) => string;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AdminNotification[]>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      /* ignore quota */
    }
  }, [notifications]);

  const addNotification = useCallback((input: AddInput) => {
    const id = input.id ?? crypto.randomUUID();
    const item: AdminNotification = {
      id,
      title: input.title,
      body: input.body,
      href: input.href,
      createdAt: input.createdAt ?? Date.now(),
      read: input.read ?? false,
    };
    setNotifications((prev) => {
      const withoutDup = prev.filter((n) => n.id !== id);
      return [item, ...withoutDup].slice(0, MAX_ITEMS);
    });
    return id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllRead,
      remove,
      clearAll,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllRead,
      remove,
      clearAll,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
