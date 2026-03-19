import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
export function OrderPrintPage() {
  const { token } = useAuth();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    document.body.classList.add('order-print-page');
    return () => {
      document.body.classList.remove('order-print-page');
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!token || !id) {
        window.close();
        return;
      }
      try {
        const res = await fetch(`/api/orders/${id}/print-pdf`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          // If unauthorized, let normal auth flow handle on the main app
          window.close();
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.location.replace(url);
      } catch {
        window.close();
      }
    })();
  }, [token, id]);

  return (
    <div className="order-print-root">
      <p style={{ padding: 16 }}>Loading PDF…</p>
    </div>
  );
}

