import { LucideIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  icon?: LucideIcon;
}

interface PageHeaderProps {
  title: string;
  breadcrumb?: BreadcrumbItem[];
}

export function PageHeader({ title, breadcrumb }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h1>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 mt-1 text-sm text-slate-500 dark:text-slate-400">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-400">/</span>}
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </span>
          ))}
        </nav>
      )}
    </div>
  );
}
