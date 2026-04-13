import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X } from 'lucide-react';
import { Modal, Input, Button, Select } from '../../../components/ui';
import type { User } from './types';
import * as rolesApi from '../../../api/roles';
import { uploadImage } from '../../../api/uploads';
import noImageUrl from '../../../assets/images/noimage.png';
import { resolveMediaSrc } from '../../../utils/mediaUrl';

const MAX_AVATAR_BYTES = 150 * 1024 * 1024; // 150MB (>= 100MB)
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
  const [state, setState] = useState<'active' | 'inactive'>('active');
  const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);

  const isEdit = !!user;

  const stateOptions = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' },
  ];

  useEffect(() => {
    if (open && token) {
      rolesApi.getRoles(token).then(({ roles }) => {
        setRoleOptions(roles.map((r) => ({ value: r.id, label: r.name })));
      }).catch(() => setRoleOptions([]));
    }
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
      setAvatarError('Por favor seleccione una imagen (JPEG, PNG, WebP o GIF).');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError(`La imagen debe ser menor a ${(MAX_AVATAR_BYTES / (1024 * 1024)).toFixed(0)}MB.`);
      return;
    }

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = objectUrl;
    setAvatarFile(file);
    setAvatar(objectUrl);
    e.target.value = '';
  };

  const clearAvatar = () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    setAvatar(null);
    setAvatarFile(null);
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
      setError('El correo es requerido.');
      return;
    }
    if (!isEdit && !password) {
      setError('La contraseña es requerida para nuevos usuarios.');
      return;
    }
    if (!isEdit && password !== passwordConfirm) {
      setError('La contraseña y la confirmación de contraseña no coinciden.');
      return;
    }
    if (isEdit && password && password !== passwordConfirm) {
      setError('La contraseña y la confirmación de contraseña no coinciden.');
      return;
    }
    if (!roleId) {
      setError('El rol es requerido.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      let avatarValue: string | undefined = avatar ?? undefined;
      if (avatarFile) {
        if (!token) throw new Error('No autenticado.');
        const { url } = await uploadImage(token, avatarFile, 'avatar');
        avatarValue = url;
        setAvatar(url);
        setAvatarFile(null);
        if (avatarObjectUrlRef.current) {
          URL.revokeObjectURL(avatarObjectUrlRef.current);
          avatarObjectUrlRef.current = null;
        }
      }

      await onSubmit({
        email: trimmedEmail,
        password: isEdit ? (password || undefined) : password,
        name: trimmedName,
        identification: trimmedIdentification,
        phone: trimmedPhone,
        roleId,
        state,
        avatar: avatarValue != null ? avatarValue : (isEdit ? '' : undefined),
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
      title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Foto
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={resolveMediaSrc(avatar) || noImageUrl}
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
                  title="Quitar foto"
                  aria-label="Quitar foto"
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
                aria-label="Subir foto"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                Subir imagen
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                JPEG, PNG, WebP o GIF. Máximo 150MB.
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
            placeholder="usuario@ejemplo.com"
            required
            disabled={isEdit}
          />
          {isEdit && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              El correo no puede ser cambiado.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Identificación
          </label>
          <Input
            value={identification}
            onChange={(e) => setIdentification(e.target.value)}
            placeholder="p. ej. cédula o ID"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Contraseña
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? 'Vacío para no cambiar' : 'Mín. 6 caracteres'}
            minLength={isEdit ? undefined : 6}
            required={!isEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Confirmar contraseña
          </label>
          <Input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder={isEdit ? 'Vacío para no cambiar' : 'Confirmar contraseña'}
            minLength={isEdit ? undefined : 6}
            required={!isEdit}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Nombre
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Teléfono
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Teléfono"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Rol
            </label>
            <Select
              options={roleOptions}
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              placeholder="Seleccionar rol"
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
            />
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
