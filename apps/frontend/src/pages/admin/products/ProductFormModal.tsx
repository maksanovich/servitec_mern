import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select, SearchableSelect } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import type { Branch } from '../../../api/branches';
import * as branchesApi from '../../../api/branches';
import type { Product } from './types';

const stateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
  onSubmit: (data: { branch: string; product: string; state: 'active' | 'inactive' }) => Promise<void>;
}

export function ProductFormModal({ open, onClose, product, onSuccess, onSubmit }: ProductFormModalProps) {
  const { token } = useAuth();

  const [branch, setBranch] = useState('');
  const [productName, setProductName] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const isEdit = !!product;

  useEffect(() => {
    if (!open) return;

    if (product) {
      setBranch(product.branch);
      setProductName(product.product);
      setState(product.state ?? 'active');
    } else {
      setBranch('');
      setProductName('');
      setState('active');
    }

    setError(null);
  }, [open, product]);

  useEffect(() => {
    async function loadBranches() {
      if (!open || !token) return;
      setBranchesLoading(true);
      setBranchesError(null);
      try {
        const { branches: list } = await branchesApi.getBranches(token);
        setBranches(list);
      } catch (err) {
        setBranchesError((err as Error).message);
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    }

    loadBranches();
  }, [open, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedBranch = branch.trim();
    const trimmedProduct = productName.trim();

    if (!trimmedBranch || !trimmedProduct) {
      setError('Branch and product are required.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        branch: trimmedBranch,
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
      title={isEdit ? 'Edit product' : 'New product'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Branch
            </label>
            <SearchableSelect
              options={branches.map((b) => ({ value: b.branchName, label: b.branchName }))}
              value={branch}
              onValueChange={setBranch}
              placeholder={branchesLoading ? 'Loading branches…' : 'Select branch'}
              disabled={branchesLoading || branches.length === 0}
            />
            {branchesError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{branchesError}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Product
            </label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. MAINBOARD"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Status
          </label>
          <Select options={stateOptions} value={state} onChange={(e) => setState(e.target.value as any)} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

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

