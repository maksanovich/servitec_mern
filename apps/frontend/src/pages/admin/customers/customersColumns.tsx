import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pencil } from 'lucide-react';
import { type TableColumn } from '../../../components/datatable';
import type { Client } from '../../../api/clients';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

const MENU_WIDTH = 160;

function onEdit(client: Client) {
  console.log('Edit client', client);
}

function openWhatsApp(client: Client) {
  const phone = client.telefono1 || client.telefono2 || client.telefono3 || '';
  const digits = phone.replace(/\D/g, '');
  if (!digits) return;
  const number = digits.length === 9 ? `51${digits}` : digits;
  const url = `https://wa.me/${number}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatDate(date: string) {
  if (!date) return '—';
  return date.split('T')[0];
}

function ActionDropdown({ client }: { client: Client }) {
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
            onClick={() => { onEdit(client); setOpen(false); }}
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => { openWhatsApp(client); setOpen(false); }}
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

export const clientsColumns: TableColumn<Client>[] = [
  {
    id: 'clientescodigo',
    name: 'Code',
    selector: (row) => row.clientescodigo,
    sortable: true,
    width: '130px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">{row.clientescodigo || '—'}</span>
    ),
  },
  {
    id: 'razonsocial',
    name: 'Business name',
    selector: (row) => row.razonsocial,
    sortable: true,
    minWidth: '180px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.razonsocial || '—'}</span>
    ),
  },
  {
    id: 'nombrecomercial',
    name: 'Trade name',
    selector: (row) => row.nombrecomercial,
    sortable: true,
    minWidth: '140px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.nombrecomercial || '—'}</span>
    ),
  },
  {
    id: 'identificacion',
    name: 'ID number',
    selector: (row) => row.identificacion,
    sortable: true,
    width: '150px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.identificacion || '—'}</span>
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
    id: 'telefono1',
    name: 'Phone',
    selector: (row) => row.telefono1,
    sortable: true,
    width: '150px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.telefono1 || row.telefono2 || row.telefono3 || '—'}</span>
    ),
  },
  {
    id: 'ciudad',
    name: 'City',
    selector: (row) => row.ciudad,
    sortable: true,
    width: '120px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.ciudad || '—'}</span>
    ),
  },
  {
    id: 'fechacreacion',
    name: 'CreatedAt',
    selector: (row) => row.fechacreacion,
    sortable: true,
    width: '140px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{formatDate(row.fechacreacion) || '—'}</span>
    ),
  },
  {
    id: 'action',
    name: 'Action',
    sortable: false,
    width: '80px',
    cell: (row) => <ActionDropdown client={row} />,
  },
];
