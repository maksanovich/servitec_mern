import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { Modal, Input, Button } from '../../../components/ui';
import type { Client } from '../../../api/clients';
import type { UpdateClientPayload } from '../../../api/clients';

interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onSuccess: () => void;
  onSubmit: (clientesid: number, data: UpdateClientPayload) => Promise<void>;
}

export function ClientEditModal({
  open,
  onClose,
  client,
  onSuccess,
  onSubmit,
}: ClientEditModalProps) {
  const [razonsocial, setRazonsocial] = useState('');
  const [nombrecomercial, setNombrecomercial] = useState('');
  const [email, setEmail] = useState('');
  const [telefono1, setTelefono1] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && client) {
      setRazonsocial(client.razonsocial ?? '');
      setNombrecomercial(client.nombrecomercial ?? '');
      setEmail(client.email ?? '');
      setTelefono1(client.telefono1 ?? '');
      setIdentificacion(client.identificacion ?? '');
      setError(null);
    }
  }, [open, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit(client.clientesid, {
        razonsocial: razonsocial.trim() || undefined,
        nombrecomercial: nombrecomercial.trim() || undefined,
        email: email.trim() || undefined,
        telefono1: telefono1.trim() || undefined,
        identificacion: identificacion.trim() || undefined,
      });
      toast.success('Client updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!client) return null;

  return (
    <Modal open={open} onClose={onClose} title="Edit client" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Business name (Razón social)
          </label>
          <Input
            value={razonsocial}
            onChange={(e) => setRazonsocial(e.target.value)}
            placeholder="Business name"
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
            ID number
          </label>
          <Input
            value={identificacion}
            onChange={(e) => setIdentificacion(e.target.value)}
            placeholder="Identification number"
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
            Phone
          </label>
          <Input
            value={telefono1}
            onChange={(e) => setTelefono1(e.target.value)}
            placeholder="Phone number"
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
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
