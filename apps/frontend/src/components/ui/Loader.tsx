interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export function Loader({ size = 'md', className = '' }: LoaderProps) {
  return (
    <div
      className={`rounded-full border-slate-200 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 animate-spin ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Cargando…</p>
      </div>
    </div>
  );
}
