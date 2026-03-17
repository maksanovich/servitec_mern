import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import type { Model } from './types';
import { useAuth } from '../../../contexts/AuthContext';
import type { Brand } from '../../../api/brands';
import * as brandsApi from '../../../api/brands';

const stateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface ModelFormModalProps {
  open: boolean;
  onClose: () => void;
  modelItem: Model | null;
  onSuccess: () => void;
  onSubmit: (data: { brand: string; model: string; state: 'active' | 'inactive' }) => Promise<void>;
}

export function ModelFormModal({
  open,
  onClose,
  modelItem,
  onSuccess,
  onSubmit,
}: ModelFormModalProps) {
  const { token } = useAuth();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  const isEdit = !!modelItem;

  useEffect(() => {
    if (open) {
      if (modelItem) {
        setBrand(modelItem.brand);
        setModel(modelItem.model);
        setState(modelItem.state ?? 'active');
      } else {
        setBrand('');
        setModel('');
        setState('active');
      }
      setError(null);
    }
  }, [open, modelItem]);

  useEffect(() => {
    async function loadBrands() {
      if (!open || !token) return;
      setBrandsLoading(true);
      setBrandsError(null);
      try {
        const { brands: list } = await brandsApi.getBrands(token);
        setBrands(list);
      } catch (err) {
        setBrandsError((err as Error).message);
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    }
    loadBrands();
  }, [open, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBrand = brand.trim();
    const trimmedModel = model.trim();
    if (!trimmedBrand || !trimmedModel) {
      setError('Brand and model are required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        brand: trimmedBrand,
        model: trimmedModel,
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
      title={isEdit ? 'Edit model' : 'New model'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Brand
            </label>
            <Select
              options={brands.map((b) => ({ value: b.name, label: b.name }))}
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={brandsLoading ? 'Loading brands…' : 'Select brand'}
              disabled={brandsLoading || brands.length === 0}
              required
            />
            {brandsError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {brandsError}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Model
            </label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. INSPIRON 15"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <Select
            options={stateOptions}
            value={state}
            onChange={(e) => setState(e.target.value as 'active' | 'inactive')}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="emerald"
            leftIcon={Save}
            disabled={saving}
            isLoading={saving}
          >
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

