import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Modal, Input, Button } from '../../../components/ui';
import { createClient } from '../../../api/clients';
import type { CreateClientPayload } from '../../../api/clients';

interface ClientCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}

export function ClientCreateModal({
  open,
  onClose,
  onSuccess,
  token,
}: ClientCreateModalProps) {
  const [razonsocial, setRazonsocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [email, setEmail] = useState('');
  const [telefono1, setTelefono1] = useState('');
  const [nombrecomercial, setNombrecomercial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRazonsocial('');
      setDireccion('');
      setIdentificacion('');
      setEmail('');
      setTelefono1('');
      setNombrecomercial('');
      setError(null);
    }
  }, [open]);

  const onlyDigits = (value: string) => value.replace(/\D/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = razonsocial.trim();
    if (!trimmed) {
      setError('Business name (Razón social) is required');
      return;
    }
    if (identificacion.trim() && !/^\d+$/.test(identificacion.trim())) {
      setError('ID number must contain only digits');
      return;
    }
    if (telefono1.trim() && !/^\d+$/.test(telefono1.trim())) {
      setError('Phone must contain only digits');
      return;
    }
    if (!token) {
      setError('Not authenticated');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload: CreateClientPayload = {
        razonsocial: trimmed,
        direccion: direccion.trim() || undefined,
        identificacion: identificacion.trim() || undefined,
        email: email.trim() || undefined,
        telefono1: telefono1.trim() || undefined,
        nombrecomercial: nombrecomercial.trim() || undefined,
      };
      await createClient(token, payload);
      toast.success('Client created successfully');
      onSuccess();
      onClose();
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast.error('Create failed', { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New customer" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Business name (Razón social) *
          </label>
          <Input
            value={razonsocial}
            onChange={(e) => setRazonsocial(e.target.value)}
            placeholder="Business name"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Trade name (Nombre comercial)
          </label>
          <Input
            value={nombrecomercial}
            onChange={(e) => setNombrecomercial(e.target.value)}
            placeholder="Trade name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Address (Dirección)
          </label>
          <Input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Address"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            ID number (Identificación)
          </label>
          <Input
            inputMode="numeric"
            value={identificacion}
            onChange={(e) => setIdentificacion(onlyDigits(e.target.value))}
            placeholder="Digits only"
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
            placeholder="email@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Phone (Teléfono 1)
          </label>
          <Input
            inputMode="numeric"
            value={telefono1}
            onChange={(e) => setTelefono1(onlyDigits(e.target.value))}
            placeholder="Digits only"
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
            Create client
          </Button>
        </div>
      </form>
    </Modal>
  );
}
