import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pencil } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { Customer } from './types';

import noImageUrl from '../../../assets/images/noimage.png';
const avatarSize = 40;
const avatarClass = 'rounded-full object-cover bg-slate-200 dark:bg-slate-600';

function CustomerAvatar({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={avatarClass}
        style={{ width: avatarSize, height: avatarSize }}
        title="No image"
      />
    );
  }
  return (
    <img
      src={src || noImageUrl}
      alt=""
      width={avatarSize}
      height={avatarSize}
      className={avatarClass}
      onError={() => setFailed(true)}
    />
  );
}

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

const MENU_WIDTH = 160;

function onEdit(customer: Customer) {
  console.log('Edit customer', customer);
}

/** Open WhatsApp chat. Phone is normalized: digits only, prepend 51 (Peru) if 9 digits. */
function openWhatsApp(customer: Customer) {
  const digits = customer.phone.replace(/\D/g, '');
  const number = digits.length === 9 ? `51${digits}` : digits;
  const url = `https://wa.me/${number}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function ActionDropdown({ customer }: { customer: Customer }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.right - MENU_WIDTH });
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (open && buttonRef.current && !buttonRef.current.contains(target) && menuRef.current && !menuRef.current.contains(target)) setOpen(false);
    }
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleScrollOrResize() {
      setOpen(false);
    }
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={actionBtnClass}
        title="Actions"
        aria-label="Actions"
        aria-expanded={open}
      >
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[9999] min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
          style={{ top: position.top, left: position.left }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { onEdit(customer); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { openWhatsApp(customer); setOpen(false); }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

const roleVariant: Record<string, 'warning' | 'info' | 'neutral'> = {
  Customer: 'warning',
  Admin: 'info',
  Technical: 'neutral',
};

const stateVariant: Record<string, 'success' | 'error'> = {
  active: 'success',
  inactive: 'error',
};

const stateLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

export const customersColumns: TableColumn<Customer>[] = [
  {
    id: 'image',
    name: '',
    selector: () => '',
    sortable: false,
    width: '60px',
    cell: (row) => (
      <CustomerAvatar src={row.image} />
    ),
  },
  {
    id: 'id',
    name: 'ID',
    selector: (row) => row.id,
    sortable: true,
    width: '100px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">{row.id}</span>
    ),
  },
  {
    id: 'names',
    name: 'Names',
    selector: (row) => row.names,
    sortable: true,
    minWidth: '160px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.names}</span>
    ),
  },
  {
    id: 'surnames',
    name: 'Surnames',
    selector: (row) => row.surnames,
    sortable: true,
    minWidth: '160px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.surnames}</span>
    ),
  },
  {
    id: 'email',
    name: 'E-mail',
    selector: (row) => row.email,
    sortable: true,
    minWidth: '200px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.email || '—'}</span>
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
    id: 'role',
    name: 'Role',
    selector: (row) => row.role,
    sortable: true,
    width: '120px',
    cell: (row) => (
      <Badge variant={roleVariant[row.role] ?? 'neutral'}>{row.role}</Badge>
    ),
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
    cell: (row) => <ActionDropdown customer={row} />,
  },
];
