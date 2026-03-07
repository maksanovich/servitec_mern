import { Request, Response } from 'express';
import { Client } from '../models/Client.js';
import { editClient, createClient as perseoCreateClient, deleteClient as perseoDeleteClient, type PerseoClientEditPayload, type PerseoClientCreatePayload } from '../services/perseoService.js';

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

const CREATE_BODY_KEYS = ['razonsocial', 'direccion', 'identificacion', 'email', 'telefono1', 'nombrecomercial'] as const;

function toPerseoCreatePayload(body: Record<string, unknown>): PerseoClientCreatePayload {
  const now = nowPerseoDate();
  return {
    clientesid: 0,
    clientescodigo: '',
    codigocontable: '',
    clientes_gruposid: 1,
    provinciasid: '',
    ciudadesid: '',
    razonsocial: String(body.razonsocial ?? '').trim(),
    parroquiasid: '',
    clientes_zonasid: 1,
    clientes_rutasid: 1,
    nombrecomercial: String(body.nombrecomercial ?? '').trim(),
    direccion: String(body.direccion ?? '').trim(),
    identificacion: String(body.identificacion ?? '').trim(),
    tipoidentificacion: 'C',
    email: String(body.email ?? '').trim(),
    telefono1: String(body.telefono1 ?? '').trim(),
    telefono2: '',
    telefono3: '',
    vendedoresid: 1,
    cobradoresid: 1,
    creditocupo: 0,
    creditodias: 0,
    estado: true,
    tarifasid: 1,
    forma_pago_empresaid: 1,
    ordenvisita: 0,
    latitud: '',
    longitud: '',
    usuariocreacion: 'PERSEO',
    fechacreacion: now,
    fechamodificacion: now,
  };
}

export async function createClient(req: Request, res: Response): Promise<Response | void> {
  try {
    const body = req.body as Record<string, unknown>;
    const updates: Record<string, unknown> = {};
    for (const key of CREATE_BODY_KEYS) {
      if (body[key] !== undefined) {
        updates[key] = typeof body[key] === 'string' ? String(body[key]).trim() : body[key];
      }
    }
    const razonsocial = String(updates.razonsocial ?? '').trim();
    if (!razonsocial) {
      return res.status(400).json({ error: 'razonsocial is required' });
    }

    const identificacion = String(updates.identificacion ?? '').trim();
    if (identificacion && !/^\d+$/.test(identificacion)) {
      return res.status(400).json({ error: 'identificacion must contain only digits' });
    }

    const telefono1 = String(updates.telefono1 ?? '').trim();
    if (telefono1 && !/^\d+$/.test(telefono1)) {
      return res.status(400).json({ error: 'telefono1 must contain only digits' });
    }

    const perseoPayload = toPerseoCreatePayload({ ...body, ...updates });
    const result = await perseoCreateClient(perseoPayload);
    if (!result.ok) {
      return res.status(502).json({ error: result.error || 'Perseo create failed. Please try again later.' });
    }

    const doc = await Client.create({
      clientesid: result.clientesid_nuevo,
      clientescodigo: result.clientes_codigo,
      estado: true,
      codigocontable: '',
      clientes_gruposid: 1,
      provinciasid: '',
      provincia: '',
      ciudadesid: '',
      ciudad: '',
      razonsocial: perseoPayload.razonsocial,
      parroquiasid: '',
      clientes_zonasid: 1,
      nombrecomercial: perseoPayload.nombrecomercial,
      direccion: perseoPayload.direccion,
      identificacion: perseoPayload.identificacion,
      tipoidentificacion: 'C',
      email: perseoPayload.email,
      telefono1: perseoPayload.telefono1,
      telefono2: '',
      telefono3: '',
      formasdepagoid: 1,
      tarifasid: 1,
      vendedoresid: 1,
      cobradoresid: 1,
      creditocupo: 0,
      creditodias: 0,
      fechamodificacion: perseoPayload.fechamodificacion,
      fechacreacion: perseoPayload.fechacreacion,
    });

    return res.status(201).json(toResponse(doc.toObject() as Parameters<typeof toResponse>[0]));
  } catch (err) {
    console.error('Create client error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return res.status(500).json({ error: message });
  }
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
        .sort({ fechacreacion: -1 })
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

const EDITABLE_FIELDS = [
  'razonsocial',
  'nombrecomercial',
  'email',
  'telefono1',
  'telefono2',
  'telefono3',
  'identificacion',
] as const;

function nowPerseoDate(): string {
  return new Date().toISOString();
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
        updates[key] = typeof body[key] === 'string' ? String(body[key]).trim() : body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No editable fields provided' });
    }

    const identificacionVal = String(updates.identificacion ?? '').trim();
    if (identificacionVal && !/^\d+$/.test(identificacionVal)) {
      return res.status(400).json({ error: 'identificacion must contain only digits' });
    }
    for (const key of ['telefono1', 'telefono2', 'telefono3'] as const) {
      const val = String(updates[key] ?? '').trim();
      if (val && !/^\d+$/.test(val)) {
        return res.status(400).json({ error: `${key} must contain only digits` });
      }
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
    const perseoResult = await perseoDeleteClient({ clientesid: id });
    if (!perseoResult.ok) {
      console.warn('[deleteClient] Perseo clientes_eliminar failed for clientesid=', id, perseoResult.error);
      return res.status(502).json({
        error: perseoResult.error || 'Perseo delete failed. Please try again later.',
      });
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
