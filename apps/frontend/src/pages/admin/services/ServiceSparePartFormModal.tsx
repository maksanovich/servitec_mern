import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select, SearchableSelect } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import type { Branch } from '../../../api/branches';
import * as branchesApi from '../../../api/branches';
import type { ServiceSparePartItem, ServiceSparePartType, ServiceSparePartState } from '../../../api/servicesSpareParts';

const typeOptions = [
  { value: 'service', label: 'Service' },
  { value: 'replacement', label: 'Replacement' },
];

const stateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  item: ServiceSparePartItem | null;
  onSuccess: () => void;
  onSubmit: (data: Omit<ServiceSparePartItem, 'id'>) => Promise<void>;
}

export function ServiceSparePartFormModal({ open, onClose, item, onSuccess, onSubmit }: Props) {
  const { token, user } = useAuth();
  const [branch, setBranch] = useState('');
  const [type, setType] = useState<ServiceSparePartType>('service');
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('0');
  const [amount, setAmount] = useState<string>('0');
  const [state, setState] = useState<ServiceSparePartState>('active');
  const [details, setDetails] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const isEdit = !!item;

  useEffect(() => {
    if (!open) return;
    if (item) {
      setBranch(item.branch);
      setType(item.type);
      setName(item.name);
      setPrice(String(item.price ?? 0));
      setAmount(String(item.amount ?? 0));
      setState(item.state ?? 'active');
      setDetails(item.details ?? '');
    } else {
      // For admins, default the branch to the logged-in admin's scope.
      setBranch(user?.role?.slug === 'admin' ? (user.branch ?? '') : '');
      setType('service');
      setName('');
      setPrice('0');
      setAmount('0');
      setState('active');
      setDetails('');
    }
    setError(null);
  }, [open, item, user]);

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
    const trimmedName = name.trim();
    const trimmedDetails = details.trim();
    const priceNum = Number(price);
    const amountNum = Number(amount);

    if (!trimmedBranch || !trimmedName) {
      setError('Branch and service/spare part name are required.');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid number (0 or greater).');
      return;
    }
    if (Number.isNaN(amountNum) || amountNum < 0) {
      setError('Amount must be a valid number (0 or greater).');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        branch: trimmedBranch,
        type,
        name: trimmedName,
        price: priceNum,
        amount: amountNum,
        state,
        details: trimmedDetails,
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Service / Spare Part' : 'Add New Service / Spare Part'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Branch <span className="text-red-500">*</span>
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
              Type <span className="text-red-500">*</span>
            </label>
            <Select
              options={typeOptions}
              value={type}
              onChange={(e) => setType(e.target.value as ServiceSparePartType)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Service / Spare Part <span className="text-red-500">*</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BATTERY" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Price <span className="text-red-500">*</span>
            </label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              State
            </label>
            <Select options={stateOptions} value={state} onChange={(e) => setState(e.target.value as any)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Details
            </label>
            <textarea
              className="w-full min-h-[110px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Optional details…"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="emerald" leftIcon={Save} disabled={saving} isLoading={saving}>
            {isEdit ? 'Save' : 'Keep'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

