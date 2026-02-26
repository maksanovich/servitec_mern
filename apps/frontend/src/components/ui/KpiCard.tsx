import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string | null;
  icon: LucideIcon;
}

export function KpiCard({ label, value, sublabel, icon: Icon }: KpiCardProps) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</div>
        <div className="text-slate-900 dark:text-white font-semibold truncate">
          {value}
          {sublabel && (
            <span className="text-slate-500 dark:text-slate-400 font-normal text-sm ml-1">
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
