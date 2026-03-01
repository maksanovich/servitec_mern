import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Pencil } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { Company } from './types';

import defaultLogo from '../../../assets/logo.svg';

const logoSize = 48;
const logoClass = 'object-contain bg-slate-100 dark:bg-slate-700 rounded';

function CompanyLogo({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  const url = src || defaultLogo;
  if (failed) {
    return (
      <div
        className={logoClass}
        style={{ width: logoSize, height: logoSize }}
        title="No logo"
      />
    );
  }
  return (
    <img
      src={url}
      alt=""
      width={logoSize}
      height={logoSize}
      className={logoClass}
      onError={() => setFailed(true)}
    />
  );
}

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

function onEdit(company: Company) {
  console.log('Edit company', company);
}

function ActionDropdown({ company }: { company: Company }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);
  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={actionBtnClass}
        title="Actions"
        aria-label="Actions"
        aria-expanded={open}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
          role="menu"
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onEdit(company); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      )}
    </div>
  );
}

const stateVariant: Record<string, 'success' | 'error'> = {
  active: 'success',
  inactive: 'error',
};

const stateLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

export const companyColumns: TableColumn<Company>[] = [
  {
    id: 'ruc',
    name: 'RUC',
    selector: (row) => row.ruc,
    sortable: true,
    width: '140px',
    cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">{row.ruc}</span>
      </div>
    ),
  },
  {
    id: 'companyName',
    name: 'Company Name',
    selector: (row) => row.companyName,
    sortable: true,
    minWidth: '220px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.companyName}</span>
    ),
  },
  {
    id: 'email',
    name: 'Email',
    selector: (row) => row.email,
    sortable: true,
    minWidth: '200px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.email}</span>
    ),
  },
  {
    id: 'phone',
    name: 'Phone',
    selector: (row) => row.phone,
    sortable: true,
    width: '120px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.phone}</span>
    ),
  },
  {
    id: 'address',
    name: 'Address',
    selector: (row) => row.address,
    sortable: true,
    minWidth: '220px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.address}</span>
    ),
  },
  {
    id: 'logo',
    name: 'Logo',
    selector: () => '',
    sortable: false,
    width: '100px',
    cell: (row) => <CompanyLogo src={row.logo} />,
  },
  {
    id: 'state',
    name: 'State',
    selector: (row) => row.state,
    sortable: true,
    width: '100px',
    cell: (row) => (
      <Badge variant={stateVariant[row.state]}>{stateLabel[row.state]}</Badge>
    ),
  },
  {
    id: 'action',
    name: 'Action',
    sortable: false,
    width: '80px',
    cell: (row) => <ActionDropdown company={row} />,
  },
];
