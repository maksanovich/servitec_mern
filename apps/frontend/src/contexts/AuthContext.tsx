import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { login as apiLogin, me, User } from '../api/auth';

export const TOKEN_KEY = 'servitec_admin_token';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: storedToken,
    // Only show loading when we have a token to verify; no token = not authenticated, redirect immediately
    loading: !!storedToken,
  });

  const loadUser = useCallback(async (token: string) => {
    try {
      const { user } = await me(token);
      setState((s) => ({ ...s, user, loading: false }));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setState({ user: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => {
    if (state.token) {
      loadUser(state.token);
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [state.token, loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setState({ user, token, loading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  const refreshUser = useCallback(async () => {
    if (state.token) {
      await loadUser(state.token);
    }
  }, [state.token, loadUser]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!state.token && !!state.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
