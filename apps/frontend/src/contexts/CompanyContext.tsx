import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getCompany, type Company } from '../api/company';

interface CompanyContextValue {
  company: Company | null;
  loading: boolean;
  refetchCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCompany = useCallback(async () => {
    if (!token) {
      setCompany(null);
      return;
    }
    setLoading(true);
    try {
      const { company: c } = await getCompany(token);
      setCompany(c ?? null);
    } catch {
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const value: CompanyContextValue = {
    company,
    loading,
    refetchCompany: fetchCompany,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return ctx;
}
