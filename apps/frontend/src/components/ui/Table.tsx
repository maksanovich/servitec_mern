import { HTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function Table({ className = '', children, ...props }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps {
  columns: string[];
}

export function TableHeader({ columns }: TableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-slate-200 dark:border-slate-700">
        {columns.map((col) => (
          <th
            key={col}
            className="text-left py-3 px-4 text-slate-500 dark:text-slate-400 font-medium"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
}

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export function TableRow({ className = '', children, ...props }: TableRowProps) {
  return (
    <tr
      className={`border-b border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function TableCell({ className = '', children, ...props }: TableCellProps) {
  return (
    <td className={`py-3 px-4 text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </td>
  );
}

interface TableEmptyProps {
  colSpan: number;
  message?: string;
}

export function TableEmpty({ colSpan, message = 'No data available' }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-500 dark:text-slate-400">
        {message}
      </td>
    </tr>
  );
}

interface TableFooterProps {
  children: React.ReactNode;
}

export function TableFooter({ children }: TableFooterProps) {
  return (
    <tfoot>
      <tr>
        <td colSpan={999} className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          {children}
        </td>
      </tr>
    </tfoot>
  );
}
