import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import type { User } from './types';
import * as rolesApi from '../../../api/roles';
import type { Branch } from '../../../api/branches';
import * as branchesApi from '../../../api/branches';
import noImageUrl from '../../../assets/images/noimage.png';

const MAX_AVATAR_BYTES = 500 * 1024; // 500KB
const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/gif';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
  onSubmit: (
    data: {
      email: string;
      password?: string;
      name: string;
      identification: string;
      phone: string;
      roleId: string;
      branch?: string;
      state: 'active' | 'inactive';
      avatar?: string;
    }
  ) => Promise<void>;
  token: string | null;
}

export function UserFormModal({
  open,
  onClose,
  user,
  onSuccess,
  onSubmit,
  token,
}: UserFormModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [name, setName] = useState('');
  const [identification, setIdentification] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [branch, setBranch] = useState('');
  const [state, setState] = useState<'active' | 'inactive'>('active');
  const [roleOptions, setRoleOptions] = useState<Array<{ value: string; label: string; slug?: string }>>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRoleSlug = roleOptions.find((r) => r.value === roleId)?.slug;
  const showBranchSelect =
    selectedRoleSlug === 'admin' ||
    selectedRoleSlug === 'cashier' ||
    selectedRoleSlug === 'lead_technician' ||
    selectedRoleSlug === 'outsourced';
  const isEdit = !!user;

  const stateOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  useEffect(() => {
    if (open && token) {
      rolesApi.getRoles(token).then(({ roles }) => {
        setRoleOptions(roles.map((r) => ({ value: r.id, label: r.name, slug: r.slug })));
      }).catch(() => setRoleOptions([]));
    }
  }, [open, token]);

  useEffect(() => {
    async function loadBranches() {
      if (!open || !token) return;
      setBranchesLoading(true);
      try {
        const { branches: list } = await branchesApi.getBranches(token);
        setBranches(list.filter((b) => b.state !== 'inactive'));
      } catch {
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    }
    // Branch selection is only meaningful for role=admin, but loading once on open keeps it simple.
    loadBranches();
  }, [open, token]);

  useEffect(() => {
    if (open) {
      if (user) {
        setEmail(user.email);
        setPassword('');
        setPasswordConfirm('');
        setName(user.name);
        setIdentification(user.identification ?? '');
        setPhone(user.phone ?? '');
        setRoleId(user.role?.id ?? '');
        setBranch(user.branch ?? '');
        setState(user.state ?? 'active');
        setAvatar(user.avatar?.trim() || null);
      } else {
        setEmail('');
        setPassword('');
        setPasswordConfirm('');
        setName('');
        setIdentification('');
        setPhone('');
        setRoleId('');
        setBranch('');
        setState('active');
        setAvatar(null);
      }
      setError(null);
      setAvatarError(null);
    }
  }, [open, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image (JPEG, PNG, WebP or GIF).');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(`Image must be under ${MAX_AVATAR_BYTES / 1024}KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (dataUrl.length > MAX_AVATAR_BYTES) {
        setAvatarError('Image is too large after encoding.');
        return;
      }
      setAvatar(dataUrl);
    };
    reader.onerror = () => setAvatarError('Failed to read file.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearAvatar = () => {
    setAvatar(null);
    setAvatarError(null);
    fileInputRef.current?.value && (fileInputRef.current.value = '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedIdentification = identification.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    if (!isEdit && !password) {
      setError('Password is required for new users.');
      return;
    }
    if (!isEdit && password !== passwordConfirm) {
      setError('Password and confirm password do not match.');
      return;
    }
    if (isEdit && password && password !== passwordConfirm) {
      setError('Password and confirm password do not match.');
      return;
    }
    if (!roleId) {
      setError('Role is required.');
      return;
    }

    if (showBranchSelect) {
      const trimmedBranch = branch.trim();
      if (!trimmedBranch) {
        setError('Branch is required for this role.');
        return;
      }
    }

    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        email: trimmedEmail,
        password: isEdit ? (password || undefined) : password,
        name: trimmedName,
        identification: trimmedIdentification,
        phone: trimmedPhone,
        roleId,
        branch: branch.trim() || undefined,
        state,
        avatar: avatar != null ? avatar : (isEdit ? '' : undefined),
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
      title={isEdit ? 'Edit user' : 'New user'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatar && avatar.trim() ? avatar : noImageUrl}
                alt=""
                width={80}
                height={80}
                className="size-20 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
              />
              {avatar && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_IMAGES}
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload photo"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload image
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                JPEG, PNG, WebP or GIF. Max 500KB.
              </p>
              {avatarError && (
                <p className="text-xs text-red-600 dark:text-red-400">{avatarError}</p>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            disabled={isEdit}
          />
          {isEdit && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Email cannot be changed.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Identification
          </label>
          <Input
            value={identification}
            onChange={(e) => setIdentification(e.target.value)}
            placeholder="e.g. ID number"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}
            minLength={isEdit ? undefined : 6}
            required={!isEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Confirm password
          </label>
          <Input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder={isEdit ? 'Leave blank to keep current' : 'Confirm password'}
            minLength={isEdit ? undefined : 6}
            required={!isEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Role
            </label>
            <Select
              options={roleOptions}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              placeholder="Select role"
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
          {showBranchSelect && (
            <div className="grid grid-cols-1 col-span-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Branch <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <Select
                  options={branches.map((b) => ({ value: b.branchName, label: b.branchName }))}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder={branchesLoading ? 'Loading branches...' : 'Select branch'}
                  disabled={branchesLoading || branches.length === 0}
                />
              </div>
            </div>
          )}
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
