import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../../components/ui';
import type { TableColumn } from '../../../components/datatable';
import type { User } from './types';
import noImageUrl from '../../../assets/images/profile.png';
import { resolveMediaSrc } from '../../../utils/mediaUrl';

const actionBtnClass =
  'p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors';

const MENU_WIDTH = 180;

export interface UserColumnActions {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  /** When true, Delete is disabled (e.g. for super admin users). */
  isDeleteDisabled?: (user: User) => boolean;
}

function ActionDropdown({
  user,
  onEdit,
  onDelete,
  isDeleteDisabled,
}: {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  isDeleteDisabled?: (user: User) => boolean;
}) {
  const deleteDisabled = !!isDeleteDisabled?.(user);
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
    setPosition({
      top: rect.bottom + 4,
      left: rect.right - MENU_WIDTH,
    });
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        open &&
        buttonRef.current && !buttonRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
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
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-[9999] min-w-[180px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg py-1"
            style={{ top: position.top, left: position.left }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => {
                onEdit(user);
                setOpen(false);
              }}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button
              type="button"
              disabled={deleteDisabled}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
              onClick={() => {
                if (deleteDisabled) return;
                onDelete(user);
                setOpen(false);
              }}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}

function UserAvatar({ src }: { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaSrc(src);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  const url = failed || !resolved ? noImageUrl : resolved;
  return (
    <img
      src={url}
      alt=""
      width={40}
      height={40}
      className="size-10 rounded-full object-cover bg-slate-100 dark:bg-slate-700"
      onError={() => setFailed(true)}
    />
  );
}

function getActionDropdown(actions: UserColumnActions) {
  return (row: User) => (
    <ActionDropdown
      user={row}
      onEdit={actions.onEdit}
      onDelete={actions.onDelete}
      isDeleteDisabled={actions.isDeleteDisabled}
    />
  );
}

export function getUserColumns(actions: UserColumnActions): TableColumn<User>[] {
  return [
  {
    id: 'image',
    name: 'Image',
    selector: () => '',
    sortable: false,
    width: '80px',
    cell: (row) => (
      <div className="flex items-center">
        <UserAvatar src={row.avatar} />
      </div>
    ),
  },
  {
    id: 'name',
    name: 'Name',
    selector: (row) => row.name,
    sortable: true,
    minWidth: '80px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.name}</span>
    ),
  },
  {
    id: 'identification',
    name: 'Identification',
    selector: (row) => row.identification ?? '',
    sortable: true,
    minWidth: '150px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300 font-mono text-sm">
        {row.identification || '—'}
      </span>
    ),
  },
  {
    id: 'email',
    name: 'E-mail',
    selector: (row) => row.email,
    sortable: true,
    minWidth: '150px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.email}</span>
    ),
  },
  {
    id: 'phone',
    name: 'Phone',
    selector: (row) => row.phone,
    sortable: true,
    minWidth: '250px',
    cell: (row) => (
      <span className="text-slate-700 dark:text-slate-300">{row.phone}</span>
    ),
  },
  {
    id: 'role',
    name: 'Role',
    selector: (row) => row.role?.name ?? '',
    sortable: true,
    minWidth: '250px',
    cell: (row) => (
      <Badge variant="warning">{row.role?.name ?? '—'}</Badge>
    ),
  },
  {
    id: 'state',
    name: 'Status',
    selector: (row) => row.state,
    sortable: true,
    width: '100px',
    cell: (row) => (
      <Badge variant={row.state === 'active' ? 'success' : 'error'}>
        {row.state === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'action',
    name: 'Action',
    sortable: false,
    width: '80px',
    cell: getActionDropdown(actions),
  },
  ];
}

/** Static columns for export (no action callbacks). */
export const userColumns: TableColumn<User>[] = getUserColumns({
  onEdit: () => {},
  onDelete: () => {},
});
