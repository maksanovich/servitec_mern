interface AdminPlaceholderProps {
  title?: string;
}

export function AdminPlaceholder({ title }: AdminPlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px] text-slate-500">
      <p className="text-lg">{title || 'Page coming soon'}</p>
    </div>
  );
}
