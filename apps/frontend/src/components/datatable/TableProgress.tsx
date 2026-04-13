import { useState, useEffect } from 'react';
import { Loader } from '../ui';

export function TableProgress() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="flex items-center justify-center min-h-[200px] w-full bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-[1px] transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader size="lg" />
        <span className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Cargando…</span>
      </div>
    </div>
  );
}
