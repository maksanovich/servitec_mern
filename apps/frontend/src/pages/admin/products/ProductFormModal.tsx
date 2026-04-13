import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import type { Product } from './types';

const stateOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
  onSubmit: (data: { product: string; state: 'active' | 'inactive' }) => Promise<void>;
}

export function ProductFormModal({ open, onClose, product, onSuccess, onSubmit }: ProductFormModalProps) {
  const [productName, setProductName] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!product;

  useEffect(() => {
    if (!open) return;

    if (product) {
      setProductName(product.product);
      setState(product.state ?? 'active');
    } else {
      setProductName('');
      setState('active');
    }

    setError(null);
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedProduct = productName.trim();

    if (!trimmedProduct) {
      setError('Product is required.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        product: trimmedProduct,
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
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Producto
            </label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Placa madre"
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

