import { Request, Response } from 'express';
import { Client } from '../models/Client.js';

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
