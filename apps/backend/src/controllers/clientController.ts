import { Request, Response } from 'express';
import { Client } from '../models/Client.js';
import { editClient, type PerseoClientEditPayload } from '../services/perseoService.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toResponse(doc: {
  clientesid: number;
  clientescodigo: string;
  estado: boolean;
  codigocontable: string;
  clientes_gruposid: number;
  provinciasid: string;
  provincia: string;
  ciudadesid: string;
  ciudad: string;
  razonsocial: string;
  parroquiasid: string;
  clientes_zonasid: number;
  nombrecomercial: string;
  direccion: string;
  identificacion: string;
  tipoidentificacion: string;
  email: string;
  telefono1: string;
  telefono2: string;
  telefono3: string;
  formasdepagoid: number;
  tarifasid: number;
  vendedoresid: number;
  cobradoresid: number;
  creditocupo: number;
  creditodias: number;
  fechamodificacion: string;
  fechacreacion: string;
}) {
  return {
    clientesid: doc.clientesid,
    clientescodigo: doc.clientescodigo ?? '',
    estado: doc.estado ?? true,
    codigocontable: doc.codigocontable ?? '',
    clientes_gruposid: doc.clientes_gruposid ?? 0,
    provinciasid: doc.provinciasid ?? '',
    provincia: doc.provincia ?? '',
    ciudadesid: doc.ciudadesid ?? '',
    ciudad: doc.ciudad ?? '',
    razonsocial: doc.razonsocial ?? '',
    parroquiasid: doc.parroquiasid ?? '',
    clientes_zonasid: doc.clientes_zonasid ?? 0,
    nombrecomercial: doc.nombrecomercial ?? '',
    direccion: doc.direccion ?? '',
    identificacion: doc.identificacion ?? '',
    tipoidentificacion: doc.tipoidentificacion ?? '',
    email: doc.email ?? '',
    telefono1: doc.telefono1 ?? '',
    telefono2: doc.telefono2 ?? '',
    telefono3: doc.telefono3 ?? '',
    formasdepagoid: doc.formasdepagoid ?? 0,
    tarifasid: doc.tarifasid ?? 0,
    vendedoresid: doc.vendedoresid ?? 0,
    cobradoresid: doc.cobradoresid ?? 0,
    creditocupo: doc.creditocupo ?? 0,
    creditodias: doc.creditodias ?? 0,
    fechamodificacion: doc.fechamodificacion ?? '',
    fechacreacion: doc.fechacreacion ?? '',
  };
}

export async function getClients(req: Request, res: Response): Promise<Response | void> {
  try {
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_LIMIT)
    );
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const filter: Record<string, unknown> = {};
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { razonsocial: re },
        { nombrecomercial: re },
        { identificacion: re },
        { email: re },
        { clientescodigo: re },
        { ciudad: re },
        { telefono1: re },
        { telefono2: re },
        { telefono3: re },
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .sort({ clientesid: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Client.countDocuments(filter),
    ]);

    res.json({
      clients: clients.map((c) => toResponse(c as Parameters<typeof toResponse>[0])),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

/** Allowed fields when admin edits a client (also synced to Perseo) */
const EDITABLE_FIELDS = [
  'razonsocial',
  'nombrecomercial',
  'email',
  'telefono1',
  'telefono2',
  'telefono3',
  'estado',
  'identificacion',
] as const;

function nowPerseoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}${m}${day}${h}${min}${s}`;
}

function toPerseoPayload(doc: IClientDoc): PerseoClientEditPayload {
  return {
    clientesid: doc.clientesid,
    clientescodigo: doc.clientescodigo ?? '',
    codigocontable: doc.codigocontable ?? '',
    clientes_gruposid: doc.clientes_gruposid ?? 0,
    provinciasid: doc.provinciasid ?? '',
    ciudadesid: doc.ciudadesid ?? '',
    razonsocial: doc.razonsocial ?? '',
    parroquiasid: doc.parroquiasid ?? '',
    clientes_zonasid: doc.clientes_zonasid ?? 0,
    clientes_rutasid: 1,
    nombrecomercial: doc.nombrecomercial ?? '',
    direccion: doc.direccion ?? '',
    identificacion: doc.identificacion ?? '',
    tipoidentificacion: doc.tipoidentificacion ?? '',
    email: doc.email ?? '',
    telefono1: doc.telefono1 ?? '',
    telefono2: doc.telefono2 ?? '',
    telefono3: doc.telefono3 ?? '',
    vendedoresid: doc.vendedoresid ?? 0,
    cobradoresid: doc.cobradoresid ?? 0,
    creditocupo: doc.creditocupo ?? 0,
    creditodias: doc.creditodias ?? 0,
    estado: doc.estado ?? true,
    tarifasid: doc.tarifasid ?? 0,
    forma_pago_empresaid: doc.formasdepagoid ?? 1,
    ordenvisita: 0,
    latitud: '',
    longitud: '',
    usuariomodificacion: 'PERSEO',
    fechamodificacion: nowPerseoDate(),
  };
}

type IClientDoc = Parameters<typeof toResponse>[0] & { formasdepagoid?: number };

export async function updateClient(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (body[key] !== undefined) {
        if (key === 'estado') {
          updates[key] = Boolean(body[key]);
        } else {
          updates[key] = typeof body[key] === 'string' ? String(body[key]).trim() : body[key];
        }
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }
    updates.fechamodificacion = nowPerseoDate();

    const current = await Client.findOne({ clientesid: id }).lean();
    if (!current) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const merged = { ...current, ...updates } as IClientDoc;
    const perseoPayload = toPerseoPayload(merged);
    const perseoResult = await editClient(perseoPayload);
    if (!perseoResult.ok) {
      console.warn('[updateClient] Perseo clientes_editar failed for clientesid=', id, perseoResult.error);
      return res.status(502).json({
        error: perseoResult.error || 'Perseo update failed. Please try again later.',
      });
    }

    const doc = await Client.findOneAndUpdate(
      { clientesid: id },
      { $set: updates },
      { new: true }
    ).lean();

    if (!doc) {
      return res.status(500).json({ error: 'Failed to save client after Perseo update' });
    }

    return res.json(toResponse(doc as Parameters<typeof toResponse>[0]));
  } catch (err) {
    console.error('Update client error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
}

export async function deleteClient(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid client id' });
    }
    const result = await Client.deleteOne({ clientesid: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    return res.status(204).send();
  } catch (err) {
    console.error('Delete client error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
}
