import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import type { Branch } from './types';

const stateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface BranchFormModalProps {
  open: boolean;
  onClose: () => void;
  branch: Branch | null;
  onSuccess: () => void;
  onSubmit: (data: {
    branchName: string;
    email: string;
    phone: string;
    address: string;
    state: 'active' | 'inactive';
  }) => Promise<void>;
}

export function BranchFormModal({
  open,
  onClose,
  branch,
  onSuccess,
  onSubmit,
}: BranchFormModalProps) {
  const [branchName, setBranchName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!branch;

  useEffect(() => {
    if (open) {
      if (branch) {
        setBranchName(branch.branchName);
        setEmail(branch.email);
        setPhone(branch.phone ?? '');
        setAddress(branch.address ?? '');
        setState(branch.state ?? 'active');
      } else {
        setBranchName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setState('active');
      }
      setError(null);
    }
  }, [open, branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = branchName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName) {
      setError('Branch name is required.');
      return;
    }
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        branchName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        address: trimmedAddress,
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
      title={isEdit ? 'Edit branch' : 'New branch'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Branch name
          </label>
          <Input
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="e.g. DIGITALSERVER"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="branch@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Phone
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Address
          </label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full address"
          />
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
