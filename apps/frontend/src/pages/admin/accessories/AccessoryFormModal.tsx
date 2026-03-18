import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import type { Branch } from '../../../api/branches';
import * as branchesApi from '../../../api/branches';
import type { Accessory } from './types';

const stateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface AccessoryFormModalProps {
  open: boolean;
  onClose: () => void;
  accessory: Accessory | null;
  onSuccess: () => void;
  onSubmit: (data: { branch: string; artifact: string; state: 'active' | 'inactive' }) => Promise<void>;
}

export function AccessoryFormModal({
  open,
  onClose,
  accessory,
  onSuccess,
  onSubmit,
}: AccessoryFormModalProps) {
  const { token } = useAuth();
  const [branch, setBranch] = useState('');
  const [artifact, setArtifact] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);

  const isEdit = !!accessory;

  useEffect(() => {
    if (!open) return;
    if (accessory) {
      setBranch(accessory.branch);
      setArtifact(accessory.artifact);
      setState(accessory.state ?? 'active');
    } else {
      setBranch('');
      setArtifact('');
      setState('active');
    }
    setError(null);
  }, [open, accessory]);

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
    const trimmedArtifact = artifact.trim();
    if (!trimmedBranch || !trimmedArtifact) {
      setError('Branch and artifact are required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        branch: trimmedBranch,
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
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit accessory' : 'New accessory'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Branch
            </label>
            <Select
              options={branches.map((b) => ({ value: b.branchName, label: b.branchName }))}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder={branchesLoading ? 'Loading branches…' : 'Select branch'}
              disabled={branchesLoading || branches.length === 0}
              required
            />
            {branchesError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{branchesError}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Artifact
            </label>
            <Input
              value={artifact}
              onChange={(e) => setArtifact(e.target.value)}
              placeholder="e.g. CHARGER"
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
          <Button type="submit" variant="emerald" leftIcon={Save} disabled={saving} isLoading={saving}>
            {isEdit ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

