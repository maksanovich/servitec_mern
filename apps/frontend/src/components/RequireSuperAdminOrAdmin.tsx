import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from './ui';
import { firstAccessiblePagePath, userIsSuperAdminOrAdmin } from '../constants/adminPages';

interface RequireSuperAdminOrAdminProps {
  children: ReactNode;
}

export function RequireSuperAdminOrAdmin({ children }: RequireSuperAdminOrAdminProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user?.role) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!userIsSuperAdminOrAdmin(user)) {
    return <Navigate to={firstAccessiblePagePath(user)} replace />;
  }

  return <>{children}</>;
}
