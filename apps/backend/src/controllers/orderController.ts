import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { Order, type IOrderBudgetLine, type OrderArea, type OrderPriority, type OrderState } from '../models/Order.js';
import { Client } from '../models/Client.js';
import { User } from '../models/User.js';

function randomCode(len = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

async function nextOrderNo(): Promise<string> {
  const count = await Order.countDocuments();
  return String(count + 1).padStart(6, '0');
}

function normalizeBudgetLines(lines: unknown): IOrderBudgetLine[] {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((l) => {
      const obj = l as Record<string, unknown>;
      const price = Number(obj.price ?? 0);
      const amount = Math.max(1, Number(obj.amount ?? 1));
      const total = Number.isFinite(Number(obj.total)) ? Number(obj.total) : price * amount;
      return {
        serviceId: String(obj.serviceId ?? '').trim(),
        name: String(obj.name ?? '').trim(),
        price: Number.isFinite(price) ? price : 0,
        amount: Number.isFinite(amount) ? amount : 1,
        total: Number.isFinite(total) ? total : 0,
      };
    })
    .filter((l) => l.serviceId && l.name);
}

function formatTechnician(
  technicianId: unknown,
  usersById: Map<string, { name: string; identification: string }>
): string {
  const key = String(technicianId ?? '').trim();
  if (!key) return '';
  const u = usersById.get(key);
  if (!u) return key;
  const name = String(u.name ?? '').trim();
  const id = String(u.identification ?? '').trim();
  if (name && id) return `${name} (${id})`;
  return name || id || key;
}

function toListResponse(o: any, usersById: Map<string, { name: string; identification: string }>) {
  return {
    id: o._id,
    no: o.no,
    code: o.code,
    priority: o.priority,
    state: o.state,
    area: o.area,
    type: o.type,
    equipment: `${o.brand}(${o.model})`,
    series: o.series,
    customer: o.clientName,
    customerId: o.clientIdentification,
    technical: formatTechnician(o.technician, usersById),
    total: o.total,
    branch: o.branch,
  };
}

export async function getOrders(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const area = typeof req.query.area === 'string' ? req.query.area.trim() : '';
    const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

    const filter: Record<string, unknown> = {};
    if (area) filter.area = area;
    if (state) filter.state = state;
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user.branch ?? '').trim();
      if (!userBranch) return res.status(403).json({ error: 'Branch not assigned for this admin' });
      filter.branch = userBranch;
    }
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ no: re }, { code: re }, { clientName: re }, { branch: re }, { series: re }, { brand: re }, { model: re }];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

    const techIds = Array.from(
      new Set(
        orders
          .map((o: any) => String(o.technician ?? '').trim())
          .filter(Boolean)
      )
    );

    const users = techIds.length
      ? await User.find({ _id: { $in: techIds } })
          .select('name identification')
          .lean()
      : [];

    const usersById = new Map<string, { name: string; identification: string }>();
    for (const u of users as any[]) {
      usersById.set(String(u._id), {
        name: String(u.name ?? ''),
        identification: String(u.identification ?? ''),
      });
    }

    return res.json({ orders: orders.map((o: any) => toListResponse(o, usersById)) });
  } catch (err) {
    console.error('Get orders error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function createOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    const authReq = req as AuthRequest;
    const body = req.body as Record<string, unknown>;

    let branch = String(body.branch ?? '').trim();
    if (authReq.user?.role === 'admin') {
      const userBranch = String(authReq.user.branch ?? '').trim();
      if (!userBranch) return res.status(403).json({ error: 'Branch not assigned for this admin' });
      if (branch && branch !== userBranch) return res.status(403).json({ error: 'Cannot create orders for another branch' });
      branch = userBranch;
    }
    const clientId = parseInt(String(body.clientId ?? ''), 10);
    const brand = String(body.brand ?? '').trim();
    const model = String(body.model ?? '').trim();
    const series = String(body.series ?? '').trim();
    const type = String(body.type ?? '').trim();

    const area = String(body.area ?? '').trim() as OrderArea;
    const state = String(body.state ?? '').trim() as OrderState;
    const priority = (String(body.priority ?? '').trim() as OrderPriority) || 'normal';
    const technician = String(body.technician ?? '').trim();

    if (!branch) return res.status(400).json({ error: 'branch is required' });
    if (!Number.isFinite(clientId)) return res.status(400).json({ error: 'clientId is required' });
    if (!brand) return res.status(400).json({ error: 'brand is required' });
    if (!model) return res.status(400).json({ error: 'model is required' });
    if (!series) return res.status(400).json({ error: 'series is required' });
    if (!type) return res.status(400).json({ error: 'type is required' });
    if (!technician) return res.status(400).json({ error: 'technician is required' });

    const client = await Client.findOne({ clientesid: clientId }).lean();
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const budgetLines = normalizeBudgetLines(body.budgetLines);
    const accessories = Array.isArray(body.accessories)
      ? (body.accessories as unknown[]).map((a) => String(a).trim()).filter(Boolean)
      : [];
    const advancement = Number(body.advancement ?? 0);
    const totalFromLines = budgetLines.reduce((sum, l) => sum + (Number.isFinite(l.total) ? l.total : 0), 0);

    const doc = await Order.create({
      no: await nextOrderNo(),
      code: randomCode(6),
      priority,
      area,
      state,
      type,
      branch,
      clientId,
      clientName: client.razonsocial ?? client.nombrecomercial ?? `Client ${clientId}`,
      clientIdentification: client.identificacion ?? '',
      brand,
      model,
      series,
      technician,
      equipmentCondition: String(body.equipmentCondition ?? '').trim(),
      technicalReport: String(body.technicalReport ?? '').trim(),
      diagnosis: String(body.diagnosis ?? 'no') === 'yes' || body.diagnosis === true,
      warranty: String(body.warranty ?? 'no') === 'yes' || body.warranty === true,
      password: String(body.password ?? '').trim(),
      fianceeDate: String(body.fianceeDate ?? '').trim(),
      advancement: Number.isFinite(advancement) ? advancement : 0,
      accessories,
      budgetLines,
      total: Number.isFinite(totalFromLines) ? totalFromLines : 0,
    });

    const obj = doc.toObject();
    const usersById = new Map<string, { name: string; identification: string }>();
    if (obj.technician) {
      const u = await User.findById(obj.technician).select('name identification').lean();
      if (u) {
        usersById.set(String(u._id), {
          name: String((u as any).name ?? ''),
          identification: String((u as any).identification ?? ''),
        });
      }
    }
    return res.status(201).json({ order: toListResponse(obj, usersById) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate order number/code. Please try again.' });
    }
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

