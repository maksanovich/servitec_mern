import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from './ui';
import { firstAccessiblePagePath, SUPER_ADMIN_SLUG } from '../constants/adminPages';

interface RequireSuperAdminProps {
  children: ReactNode;
}

export function RequireSuperAdmin({ children }: RequireSuperAdminProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user?.role) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role.slug !== SUPER_ADMIN_SLUG) {
    return <Navigate to={firstAccessiblePagePath(user)} replace />;
  }

  return <>{children}</>;
}
