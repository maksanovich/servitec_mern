import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import type { Accessory } from './types';

const stateOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

interface AccessoryFormModalProps {
  open: boolean;
  onClose: () => void;
  accessory: Accessory | null;
  onSuccess: () => void;
  onSubmit: (data: { artifact: string; state: 'active' | 'inactive' }) => Promise<void>;
}

export function AccessoryFormModal({
  open,
  onClose,
  accessory,
  onSuccess,
  onSubmit,
}: AccessoryFormModalProps) {
  const [artifact, setArtifact] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!accessory;

  useEffect(() => {
    if (!open) return;
    if (accessory) {
      setArtifact(accessory.artifact);
      setState(accessory.state ?? 'active');
    } else {
      setArtifact('');
      setState('active');
    }
    setError(null);
  }, [open, accessory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedArtifact = artifact.trim();
    if (!trimmedArtifact) {
      setError('Artifact is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        artifact: trimmedArtifact,
        state,
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar accesorio' : 'Nuevo accesorio'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Artículo
            </label>
            <Input
              value={artifact}
              onChange={(e) => setArtifact(e.target.value)}
              placeholder="e.g. Cargador"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Estado
          </label>
          <Select options={stateOptions} value={state} onChange={(e) => setState(e.target.value as any)} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="emerald" leftIcon={Save} disabled={saving} isLoading={saving}>
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

