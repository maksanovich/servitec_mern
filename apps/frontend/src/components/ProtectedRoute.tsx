import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, TOKEN_KEY } from '../contexts/AuthContext';

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
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
