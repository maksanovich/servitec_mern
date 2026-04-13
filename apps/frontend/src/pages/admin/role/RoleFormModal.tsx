import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import type { Role } from './types';
import {
  ADMIN_PAGE_OPTIONS,
  ADMIN_PAGE_PATHS,
  SUPER_ADMIN_SLUG,
  normalizeAdminPath,
} from '../../../constants/adminPages';

const ALLOWED_ROLE_PAGES = new Set(ADMIN_PAGE_PATHS);

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  onSuccess: () => void;
  onSubmit: (data: {
    name: string;
    slug: string;
    description: string;
    state: 'active' | 'inactive';
    pages: string[];
  }) => Promise<void>;
}

const stateOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

export function RoleFormModal({
  open,
  onClose,
  role,
  onSuccess,
  onSubmit,
}: RoleFormModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!role;
  const isSuperAdmin = isEdit && role?.slug === SUPER_ADMIN_SLUG;

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setSlug(role.slug);
        setDescription(role.description ?? '');
        setState(role.state);
        setPages(
          (role.pages ?? []).filter((p) => ALLOWED_ROLE_PAGES.has(normalizeAdminPath(p)))
        );
      } else {
        setName('');
        setSlug('');
        setDescription('');
        setState('active');
        setPages([]);
      }
      setError(null);
    }
  }, [open, role]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit) {
      setSlug(value.trim().toLowerCase().replace(/\s+/g, '_'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim().toLowerCase();
    if (!trimmedName || !trimmedSlug) {
      setError('El nombre y el slug son requeridos.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: trimmedName,
        slug: trimmedSlug,
        description: description.trim(),
        state,
        pages,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar rol' : 'Nuevo rol'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Nombre
          </label>
          <Input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Administrador"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Slug
          </label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="e.g. administrador"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Descripción
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción opcional"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Estado
          </label>
          <Select
            options={stateOptions}
            value={state}
            onChange={(e) => setState(e.target.value as 'active' | 'inactive')}
            disabled={isSuperAdmin}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Acceso a páginas
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Los usuarios con este rol solo pueden abrir las secciones de administración debajo. El administrador super siempre tiene acceso a
            todo; las páginas almacenadas se ignoran para ese rol.
          </p>
          <div
            className={`max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-600 p-2 space-y-1.5 ${isSuperAdmin ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {ADMIN_PAGE_OPTIONS.map(({ path, label }) => {
              const checked = pages.includes(path);
              return (
                <label
                  key={path}
                  className={`flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 ${isSuperAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 dark:border-slate-600"
                    checked={checked}
                    disabled={isSuperAdmin}
                    onChange={() =>
                      setPages((prev) =>
                        checked ? prev.filter((p) => p !== path) : [...prev, path]
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="emerald"
            leftIcon={Save}
            disabled={saving}
            isLoading={saving}
          >
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
