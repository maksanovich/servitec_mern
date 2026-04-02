import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from './ui';
import { firstAccessiblePagePath, userCanAccessPage } from '../constants/adminPages';

interface RequirePageProps {
  /** Admin path this screen requires (e.g. /admin/order). */
  page: string;
  children: ReactNode;
}

export function RequirePage({ page, children }: RequirePageProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user?.role) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!userCanAccessPage(user, page)) {
    return <Navigate to={firstAccessiblePagePath(user)} replace />;
  }

  return <>{children}</>;
}

interface RequireAnyPageProps {
  /** User may access if any of these paths is allowed (e.g. legacy + new assignable page). */
  pages: readonly string[];
  children: ReactNode;
}

export function RequireAnyPage({ pages, children }: RequireAnyPageProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user?.role) {
    return <Navigate to="/admin/login" replace />;
  }

  const ok = pages.some((p) => userCanAccessPage(user, p));
  if (!ok) {
    return <Navigate to={firstAccessiblePagePath(user)} replace />;
  }

  return <>{children}</>;
}
