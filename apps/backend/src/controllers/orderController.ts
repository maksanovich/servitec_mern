import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Order, type IOrderBudgetLine, type OrderArea, type OrderPriority, type OrderState } from '../models/Order.js';
import { Client } from '../models/Client.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { sendOrderProgressEmail } from '../services/smtpService.js';

function normalizeOrderPhotoForCreate(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: '' };
  if (typeof raw !== 'string') return { ok: false, error: 'Photo must be a string' };
  const v = raw.trim();
  if (v === '') return { ok: true, value: '' };
  return { ok: true, value: v };
}

/** PATCH: undefined = leave unchanged; null or '' = clear */
function normalizeOrderPhotoForPatch(
  raw: unknown
): { ok: true; value: string; omit: boolean } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, value: '', omit: true };
  if (raw === null) return { ok: true, value: '', omit: false };
  if (typeof raw !== 'string') return { ok: false, error: 'Photo must be a string' };
  const v = raw.trim();
  if (v === '') return { ok: true, value: '', omit: false };
  return { ok: true, value: v, omit: false };
}

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
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    priority: o.priority,
    state: o.state,
    area: o.area,
    type: o.type,
    equipment: `${o.brand}(${o.model})`,
    series: o.series,
    customer: o.clientName,
    customerId: o.clientIdentification,
    technical: formatTechnician(o.technician, usersById),
    equipmentCondition: String(o.equipmentCondition ?? ''),
    technicalReport: String(o.technicalReport ?? ''),
    total: o.total,
    advancement: Number.isFinite(Number(o.advancement)) ? Number(o.advancement) : 0,
    branch: o.branch,
  };
}

function toDetailResponse(
  o: any,
  usersById: Map<string, { name: string; identification: string }> = new Map<string, { name: string; identification: string }>()
) {
  const accessories = Array.isArray(o.accessories) ? o.accessories.map((a: any) => String(a).trim()).filter(Boolean) : [];
  const budgetLines = Array.isArray(o.budgetLines)
    ? o.budgetLines.map((l: any) => ({
        serviceId: String(l.serviceId ?? '').trim(),
        name: String(l.name ?? '').trim(),
        price: Number.isFinite(Number(l.price)) ? Number(l.price) : 0,
        amount: Number.isFinite(Number(l.amount)) ? Number(l.amount) : 1,
        total: Number.isFinite(Number(l.total)) ? Number(l.total) : 0,
      }))
    : [];

  return {
    id: o._id,
    no: o.no,
    code: o.code,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    priority: o.priority,
    state: o.state,
    area: o.area,
    type: o.type,
    branch: o.branch,

    clientId: o.clientId,
    customer: o.clientName,
    customerId: o.clientIdentification,

    brand: o.brand,
    model: o.model,
    series: o.series,

    technicianId: String(o.technician ?? ''),
    technical: formatTechnician(o.technician, usersById),
    equipmentCondition: String(o.equipmentCondition ?? ''),
    technicalReport: String(o.technicalReport ?? ''),
    diagnosis: Boolean(o.diagnosis),
    warranty: Boolean(o.warranty),
    fianceeDate: String(o.fianceeDate ?? ''),
    advancement: Number.isFinite(Number(o.advancement)) ? Number(o.advancement) : 0,

    accessories,
    budgetLines,
    total: Number.isFinite(Number(o.total)) ? Number(o.total) : 0,

    photoBeforeRepair: String(o.photoBeforeRepair ?? ''),
    photoAfterRepair: String(o.photoAfterRepair ?? ''),
  };
}

function toPublicTrackResponse(o: any) {
  return {
    code: o.code,
    state: o.state,
    area: o.area,
    type: o.type,
    branch: o.branch,
    customer: o.clientName,
    brand: o.brand,
    model: o.model,
    series: o.series,
    equipment: `${o.brand}(${o.model})`,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    photoBeforeRepair: String(o.photoBeforeRepair ?? ''),
    photoAfterRepair: String(o.photoAfterRepair ?? ''),
  };
}

function normalizeAccessories(accessories: unknown): string[] {
  if (!Array.isArray(accessories)) return [];
  return (accessories as unknown[])
    .map((a) => String(a).trim())
    .filter(Boolean);
}

function isWarehouseTransition(area: unknown, state: unknown): boolean {
  return String(area ?? '').trim() === 'warehouse' || String(state ?? '').trim() === 'warehouse';
}

export async function getOrders(req: Request, res: Response): Promise<Response | void> {
  try {
    const area = typeof req.query.area === 'string' ? req.query.area.trim() : '';
    const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

    const filter: Record<string, unknown> = {};
    if (area) filter.area = area;
    if (state) filter.state = state;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ no: re }, { code: re }, { clientName: re }, { branch: re }, { series: re }, { brand: re }, { model: re }];
    }

    const orders = await Order.find(filter).limit(limit).lean();

    // Prioritize equipment in service for more than 7 days since arrival (`createdAt`)
    // so that older/overdue items appear first by default in the UI table.
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    orders.sort((a: any, b: any) => {
      const aCreated = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b?.createdAt ? new Date(b.createdAt).getTime() : 0;

      const aInServiceOld = String(a?.state ?? '') !== 'finished' && nowMs - aCreated > sevenDaysMs;
      const bInServiceOld = String(b?.state ?? '') !== 'finished' && nowMs - bCreated > sevenDaysMs;

      if (aInServiceOld !== bInServiceOld) return aInServiceOld ? -1 : 1; // old first
      // Keep existing behavior as secondary key: newest first.
      return bCreated - aCreated;
    });

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

export async function getOrderById(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const usersById = new Map<string, { name: string; identification: string }>();
    const technicianId = String((order as any).technician ?? '').trim();
    if (technicianId) {
      const u = await User.findById(technicianId).select('name identification').lean();
      if (u) {
        usersById.set(String(u._id), {
          name: String((u as any).name ?? ''),
          identification: String((u as any).identification ?? ''),
        });
      }
    }

    return res.json({ order: toDetailResponse(order, usersById) });
  } catch (err) {
    console.error('Get order by id error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

/** Public: lookup by customer tracking code (no auth). */
export async function getOrderTrackByCode(req: Request, res: Response): Promise<Response | void> {
  try {
    const raw = String(req.params.code ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (raw.length < 4) return res.status(400).json({ error: 'Invalid tracking code' });

    const order = await Order.findOne({ code: raw }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    return res.json({ order: toPublicTrackResponse(order) });
  } catch (err) {
    console.error('Track order error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function createOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    const body = req.body as Record<string, unknown>;

    const branch = String(body.branch ?? '').trim();
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

    // Product must exist and be active for the selected branch.
    const productDoc = await Product.findOne({ branch, product: type, state: 'active' }).lean();
    if (!productDoc) {
      return res.status(400).json({ error: 'Product not available for this branch' });
    }

    const client = await Client.findOne({ clientesid: clientId }).lean();
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const budgetLines = normalizeBudgetLines(body.budgetLines);
    const accessories = Array.isArray(body.accessories)
      ? (body.accessories as unknown[]).map((a) => String(a).trim()).filter(Boolean)
      : [];
    const advancement = Number(body.advancement ?? 0);
    const totalFromLines = budgetLines.reduce((sum, l) => sum + (Number.isFinite(l.total) ? l.total : 0), 0);

    const photoBefore = normalizeOrderPhotoForCreate(body.photoBeforeRepair);
    if (!photoBefore.ok) return res.status(400).json({ error: photoBefore.error });
    const photoAfter = normalizeOrderPhotoForCreate(body.photoAfterRepair);
    if (!photoAfter.ok) return res.status(400).json({ error: photoAfter.error });
    if (isWarehouseTransition(area, state) && !photoAfter.value.trim()) {
      return res.status(400).json({ error: 'After-repair photo is required when moving to warehouse' });
    }

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
      fianceeDate: String(body.fianceeDate ?? '').trim(),
      advancement: Number.isFinite(advancement) ? advancement : 0,
      accessories,
      budgetLines,
      total: Number.isFinite(totalFromLines) ? totalFromLines : 0,

      photoBeforeRepair: photoBefore.value,
      photoAfterRepair: photoAfter.value,
    });

    const obj = doc.toObject();

    // Notify customer on order creation (initial state).
    try {
      // const to = String((client as any)?.email ?? '').trim();
      const to = 'maksanovich@gmail.com';
      if (to) {
        await sendOrderProgressEmail({
          to,
          orderNo: String(obj.no ?? ''),
          trackingCode: String(obj.code ?? ''),
          customerName: String(obj.clientName ?? ''),
          fromState: null,
          toState: obj.state as OrderState,
        });
      }
    } catch (mailErr) {
      console.error('Order progress email (create) error:', mailErr);
    }

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

export async function patchOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const doc = await Order.findById(id);
    if (!doc) return res.status(404).json({ error: 'Order not found' });

    const stateBefore = doc.state as OrderState;
    const body = req.body as Record<string, unknown>;
    // Immutable: order number and customer tracking code must never change via PATCH
    delete body.code;
    delete body.no;

    if (body.branch != null) doc.branch = String(body.branch ?? '').trim();

    if (body.clientId != null) {
      const clientId = parseInt(String(body.clientId ?? ''), 10);
      if (!Number.isFinite(clientId)) return res.status(400).json({ error: 'clientId is required' });
      const client = await Client.findOne({ clientesid: clientId }).lean();
      if (!client) return res.status(404).json({ error: 'Client not found' });
      doc.clientId = clientId;
      doc.clientName = client.razonsocial ?? client.nombrecomercial ?? `Client ${clientId}`;
      doc.clientIdentification = client.identificacion ?? '';
    }

    if (body.brand != null) doc.brand = String(body.brand ?? '').trim();
    // Mongoose `Document` already has a `model()` method, which collides with the schema field named `model`.
    // Use a cast so TypeScript doesn't confuse the function with the string field.
    if (body.model != null) (doc as any).model = String(body.model ?? '').trim();
    if (body.series != null) doc.series = String(body.series ?? '').trim();
    if (body.type != null) doc.type = String(body.type ?? '').trim();

    if (body.area != null) doc.area = String(body.area ?? '').trim() as OrderArea;
    if (body.state != null) doc.state = String(body.state ?? '').trim() as OrderState;
    if (body.priority != null) doc.priority = (String(body.priority ?? '').trim() as OrderPriority) || 'normal';

    if (body.technician != null) {
      const technician = String(body.technician ?? '').trim();
      if (!technician) return res.status(400).json({ error: 'technician is required' });
      doc.technician = technician;
    }

    if (body.equipmentCondition != null) doc.equipmentCondition = String(body.equipmentCondition ?? '').trim();
    if (body.technicalReport != null) doc.technicalReport = String(body.technicalReport ?? '').trim();

    if (body.diagnosis != null) doc.diagnosis = String(body.diagnosis ?? 'no') === 'yes' || body.diagnosis === true;
    if (body.warranty != null) doc.warranty = String(body.warranty ?? 'no') === 'yes' || body.warranty === true;

    if (body.fianceeDate != null) doc.fianceeDate = String(body.fianceeDate ?? '').trim();
    if (body.advancement != null) {
      const advancement = Number(body.advancement);
      doc.advancement = Number.isFinite(advancement) ? advancement : 0;
    }

    if (body.accessories != null) {
      doc.accessories = normalizeAccessories(body.accessories);
    }

    if (body.budgetLines != null) {
      const budgetLines = normalizeBudgetLines(body.budgetLines);
      doc.budgetLines = budgetLines;
      doc.total = budgetLines.reduce((sum, l) => sum + (Number.isFinite(l.total) ? l.total : 0), 0);
    }

    if (body.photoBeforeRepair !== undefined) {
      const r = normalizeOrderPhotoForPatch(body.photoBeforeRepair);
      if (!r.ok) return res.status(400).json({ error: r.error });
      if (!r.omit) (doc as any).photoBeforeRepair = r.value;
    }
    if (body.photoAfterRepair !== undefined) {
      const r = normalizeOrderPhotoForPatch(body.photoAfterRepair);
      if (!r.ok) return res.status(400).json({ error: r.error });
      if (!r.omit) (doc as any).photoAfterRepair = r.value;
    }

    if (isWarehouseTransition(body.area ?? doc.area, body.state ?? doc.state)) {
      const nextPhotoAfter = String((doc as any).photoAfterRepair ?? '').trim();
      if (!nextPhotoAfter) {
        return res.status(400).json({ error: 'After-repair photo is required when moving to warehouse' });
      }
    }

    await doc.save();

    // Notify customer only when the order stage changes.
    const stateAfter = doc.state as OrderState;
    if (stateAfter !== stateBefore) {
      try {
        const client = await Client.findOne({ clientesid: doc.clientId }).lean();
        const to = String((client as any)?.email ?? '').trim();
        if (to) {
          await sendOrderProgressEmail({
            to,
            orderNo: String(doc.no ?? ''),
            trackingCode: String(doc.code ?? ''),
            customerName: String(doc.clientName ?? ''),
            fromState: stateBefore,
            toState: stateAfter,
          });
        }
      } catch (mailErr) {
        console.error('Order progress email (patch) error:', mailErr);
      }
    }

    const obj = doc.toObject();
    const usersById = new Map<string, { name: string; identification: string }>();
    const technicianId = String((obj as any).technician ?? '').trim();
    if (technicianId) {
      const u = await User.findById(technicianId).select('name identification').lean();
      if (u) {
        usersById.set(String(u._id), {
          name: String((u as any).name ?? ''),
          identification: String((u as any).identification ?? ''),
        });
      }
    }

    return res.json({ order: toDetailResponse(obj, usersById) });
  } catch (err) {
    console.error('Patch order error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteOrder(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const doc = await Order.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Order not found' });

    return res.status(204).send();
  } catch (err) {
    console.error('Delete order error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Simple Code39 barcode drawer for PDFKit (same patterns as frontend)
const CODE39_PATTERNS: Record<string, string> = {
  '*': 'NWNNWNWNN',
  '0': 'NNNWWNWNN',
  '1': 'WNNWNNNNW',
  '2': 'NNWWNNNNW',
  '3': 'WNWWNNNNN',
  '4': 'NNNWWNNNW',
  '5': 'WNNWWNNNN',
  '6': 'NNWWWNNNN',
  '7': 'NNNWNNWNW',
  '8': 'WNNWNNWNN',
  '9': 'NNWWNNWNN',
  A: 'WNNNNWNNW',
  B: 'NNWNNWNNW',
  C: 'WNWNNWNNN',
  D: 'NNNNWWNNW',
  E: 'WNNNWWNNN',
  F: 'NNWNWWNNN',
  G: 'NNNNNWWNW',
  H: 'WNNNNWWNN',
  I: 'NNWNNWWNN',
  J: 'NNNNWWWNN',
  K: 'WNNNNNNWW',
  L: 'NNWNNNNWW',
  M: 'WNWNNNNWN',
  N: 'NNNNWNNWW',
  O: 'WNNNWNNWN',
  P: 'NNWNWNNWN',
  Q: 'NNNNNNWWW',
  R: 'WNNNNNWWN',
  S: 'NNWNNNWWN',
  T: 'NNNNWNWWN',
  U: 'WWNNNNNNW',
  V: 'NWWNNNNNW',
  W: 'WWWNNNNNN',
  X: 'NWNNWNNNW',
  Y: 'WWNNWNNNN',
  Z: 'NWWNWNNNN',
  '-': 'NWNNNNWNW',
  '.': 'WWNNNNWNN',
  ' ': 'NWWNNNWNN',
  $: 'NWNWNWNNN',
  '/': 'NWNWNNNWN',
  '+': 'NWNNNWNWN',
  '%': 'NNNWNWNWN',
};

function drawCode39Barcode(doc: any, value: string, x: number, y: number, height: number): void {
  const upper = String(value ?? '').toUpperCase().trim();
  const allowed = new Set(Object.keys(CODE39_PATTERNS));
  const safe = Array.from(upper)
    .map((ch) => (allowed.has(ch) ? ch : '-'))
    .join('');
  const content = `*${safe}*`;

  const narrow = 0.4; // mm-ish in PDF units
  const wide = narrow * 3;
  const gap = narrow;

  let cursor = x;
  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i] as keyof typeof CODE39_PATTERNS;
    const pattern = CODE39_PATTERNS[ch] ?? CODE39_PATTERNS['-'];
    const elements = pattern.split('');
    elements.forEach((el, idx) => {
      const isBar = idx % 2 === 0;
      const w = el === 'W' ? wide : narrow;
      if (isBar) {
        doc.rect(cursor, y, w, height).fill();
      }
      cursor += w;
    });
    if (i < content.length - 1) cursor += gap;
  }
}

export async function printOrderPdf(req: Request, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const orderDoc = await Order.findById(id).lean();
    if (!orderDoc) return res.status(404).json({ error: 'Order not found' });

    const client = await Client.findOne({ clientesid: orderDoc.clientId }).lean();

    const usersById = new Map<string, { name: string; identification: string }>();
    const technicianId = String((orderDoc as any).technician ?? '').trim();
    if (technicianId) {
      const u = await User.findById(technicianId).select('name identification').lean();
      if (u) {
        usersById.set(String(u._id), {
          name: String((u as any).name ?? ''),
          identification: String((u as any).identification ?? ''),
        });
      }
    }

    const detail = toDetailResponse(orderDoc, usersById);

    const company = await Company.findOne().lean();

    const accessoriesText =
      Array.isArray(detail.accessories) && detail.accessories.length
        ? detail.accessories.map((a) => String(a).trim()).filter(Boolean).join(', ')
        : '';

    const now = new Date();
    const createdAt = detail.createdAt ? new Date(detail.createdAt) : now;

    const fmtDate = (d: Date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(d.getDate()).padStart(2, '0');
      const month = months[d.getMonth()] ?? '';
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const fmtDateTime = (d: Date) => `${fmtDate(d)} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    const total = Number.isFinite(detail.total) ? detail.total : 0;
    const adv = Number.isFinite(detail.advancement) ? detail.advancement : 0;
    const saldo = total - adv;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="orden-${detail.no}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    doc.pipe(res);

    let logoBuffer: Buffer | null = null;
    if (company?.logo) {
      const trimmed = String(company.logo).trim();
      if (trimmed) {
        try {
          const normalized = trimmed.replaceAll('\\', '/');
          const uploadIdx = normalized.indexOf('/uploads/');

          // Support both legacy base64 logos and the new `/uploads/...` URLs.
          if (uploadIdx >= 0) {
            const uploadRoot = path.resolve(process.cwd(), 'uploads');
            const rel = normalized.slice(uploadIdx + '/uploads/'.length);
            const logoPath = path.join(uploadRoot, rel);
            logoBuffer = fs.readFileSync(logoPath);
          } else {
            const base64Match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(trimmed);
            const base64 = base64Match ? base64Match[1] : trimmed;
            logoBuffer = Buffer.from(base64, 'base64');
          }
        } catch {
          logoBuffer = null;
        }
      }
    }

    const COMPANY_LINE = company
      ? `${company.companyName ?? ''} | Tel.: ${company.phone ?? ''} | ${company.email ?? ''} | ${
          company.address ?? ''
        }`
      : 'SERVICE TECHNICAL DIGITALSERVER | Tel.: 0991684191 | info@digitalserver.com.ec | CDLA BRISAS DEL RIO MZ N1 V10';

    function drawCopy(title: string, top: number) {
      let y = top;

      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 40, y, { fit: [120, 60] });
        } catch {
          // ignore logo errors and continue rendering
        }
      } else {
        // Fallback "logo" when there is no image configured so that
        // the header visually matches the provided sample.
        doc
          .save()
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#e11d48')
          .text('Digital', 40, y);
        const textWidth = doc.widthOfString('Digital');
        doc.fillColor('#6b7280').text('server', 40 + textWidth + 2, y);
        doc.restore();
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor('black').text(title, { align: 'center' });
      y = doc.y + 2;

      doc.fontSize(9).font('Helvetica').text(`Print date: ${fmtDate(now)}`, { align: 'left' });
      doc.text(`ORDER No. ${detail.no}`, { align: 'right' });
      y = doc.y + 2;

      doc.moveTo(36, y).fontSize(8).font('Helvetica-Bold').text(COMPANY_LINE, 36, y, { align: 'center' });
      y = doc.y + 4;

      doc.fontSize(8).font('Helvetica-Bold').fillColor('black');
      doc.text('CUSTOMER DETAILS', 36, y);
      doc.text('EQUIPMENT DETAILS', 300, y);
      y = doc.y + 2;

      doc.fontSize(8).font('Helvetica');
      const leftX = 36;
      const rightX = 300;

      // Left column
      doc.text(`Customer: ${detail.customer} (${detail.customerId})`, leftX, y);
      doc.text(`Phone: ${client?.telefono1 ?? ''}`, leftX, doc.y + 1);
      doc.text(`Email: ${client?.email ?? ''}`, leftX, doc.y + 1);

      // Right column
      const eqY = y;
      doc.text(`Product: ${detail.type}`, rightX, eqY);
      doc.text(`Brand/Model: ${detail.brand}(${detail.model})`, rightX, doc.y + 1);
      doc.text(`Serial/IMEI: ${detail.series}`, rightX, doc.y + 1);
      doc.text(
        `Check-in: ${fmtDateTime(createdAt)}   Promised date: ${detail.fianceeDate?.trim() || '------'}`,
        rightX,
        doc.y + 1
      );

      y = Math.max(doc.y, eqY) + 4;

      doc.font('Helvetica-Bold');
      doc.text(`Total: $ ${total.toFixed(2)} / Advance paid: $ ${adv.toFixed(2)} / Balance: $ ${saldo.toFixed(2)}`, leftX, y);
      y = doc.y + 3;

      // Budget lines table
      const budgetLines = Array.isArray(detail.budgetLines) ? detail.budgetLines : [];
      const hasBudgetLines = budgetLines.length > 0;

      const tableTop = y;
      const colX = {
        qty: leftX,
        desc: leftX + 40,
        unit: leftX + 40 + 260,
        lineTotal: leftX + 40 + 260 + 70,
      };

      doc.font('Helvetica-Bold');
      doc.text('Qty', colX.qty, tableTop);
      doc.text('Description', colX.desc, tableTop);
      doc.text('Unit price', colX.unit, tableTop);
      doc.text('Line total', colX.lineTotal, tableTop);

      const headerBottom = doc.y + 2;
      doc.moveTo(leftX, headerBottom).lineTo(leftX + 450, headerBottom).stroke();

      let rowY = headerBottom + 2;
      doc.font('Helvetica');

      if (hasBudgetLines) {
        for (const line of budgetLines as any[]) {
          const qty = Number.isFinite(Number(line.amount)) ? Number(line.amount) : 0;
          const price = Number.isFinite(Number(line.price)) ? Number(line.price) : 0;
          const lineTotal = Number.isFinite(Number(line.total)) ? Number(line.total) : qty * price;

          doc.text(qty ? String(qty) : '-', colX.qty, rowY, { width: 30 });
          doc.text(String(line.name ?? '-'), colX.desc, rowY, { width: 250 });
          doc.text(price ? `$ ${price.toFixed(2)}` : '-', colX.unit, rowY, { width: 60 });
          doc.text(lineTotal ? `$ ${lineTotal.toFixed(2)}` : '-', colX.lineTotal, rowY, { width: 60 });

          rowY = Math.max(doc.y, rowY) + 2;
        }
      } else {
        // Match the sample by always showing at least one table row.
        doc.text('1', colX.qty, rowY, { width: 30 });
        doc.text('SERVICE.', colX.desc, rowY, { width: 250 });
        const fallbackLineTotal = total > 0 ? total : adv > 0 ? adv : 0;
        const fallbackUnit = fallbackLineTotal;
        doc.text(fallbackUnit ? `$ ${fallbackUnit.toFixed(2)}` : '-', colX.unit, rowY, { width: 60 });
        doc.text(fallbackLineTotal ? `$ ${fallbackLineTotal.toFixed(2)}` : '-', colX.lineTotal, rowY, {
          width: 60,
        });

        rowY = Math.max(doc.y, rowY) + 2;
      }

      y = rowY + 6;

      doc.font('Helvetica');
      doc.text(`Reported issue: ${detail.equipmentCondition || '-'}`, leftX, y);
      doc.text(`Equipment description: ${detail.technicalReport || '-'}`, leftX, doc.y + 1);
      doc.text(`Accessories: ${accessoriesText ? `${accessoriesText}.` : '-'}`, leftX, doc.y + 1);
      doc.text(`Technician: ${detail.technical || '-'}`, leftX, doc.y + 3);

      y = doc.y + 4;
      doc.font('Helvetica-Bold').text(
        'CHECK THE STATUS OF THIS WORK ORDER FROM OUR WEBSITE',
        leftX,
        y
      );
      doc.font('Helvetica').text(
        `Go to the website serviciotecnico.xyz and enter the following code. CODE: ${detail.code}`,
        leftX,
        doc.y + 1
      );

      // Barcode
      doc.save().fillColor('black');
      const barcodeY = doc.y + 4;
      drawCode39Barcode(doc, detail.code, leftX, barcodeY, 20);
      doc.restore();

      y = barcodeY + 26;

      const termsText =
        '1) To collect the equipment, it is mandatory to present this work order. Please keep it safe. ' +
        '2) The equipment must be collected within a maximum period of 3 months; after this time the customer will lose all rights over it. ' +
        '3) By leaving the equipment for repair, the customer accepts these conditions, which may also be sent virtually. ' +
        '4) Payment will be made via bank deposit/transfer; the customer is responsible for providing correct payment details.';

      doc.font('Helvetica-Bold').text('Terms and conditions:', leftX, y);
      doc.font('Helvetica').text(termsText, leftX, doc.y + 1, { width: 520 });

      doc.text(
        'This service was received with information provided by the customer.',
        leftX,
        doc.y + 4
      );
      doc.text(
        'This document contains information that is the exclusive property of SERVICIO TECNICO DIGITALSERVER. This information is personal and may not be shared.',
        leftX,
        doc.y + 2,
        { width: 520 }
      );

      return doc.y;
    }

    const firstBottom = drawCopy('WORK ORDER - CUSTOMER COPY', 40);
    // Small gap then second copy below
    drawCopy('WORK ORDER - WORKSHOP COPY', firstBottom + 20);

    doc.end();
  } catch (err) {
    console.error('Print order PDF error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}

