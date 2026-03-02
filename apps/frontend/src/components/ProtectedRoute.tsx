import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, TOKEN_KEY } from '../contexts/AuthContext';
import { PageLoader } from './ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Require auth: no token in storage = always send to login (avoids showing panel before auth resolves)
  const hasToken = typeof localStorage !== 'undefined' && !!localStorage.getItem(TOKEN_KEY);
  if (!hasToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
