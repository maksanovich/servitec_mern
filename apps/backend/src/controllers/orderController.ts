import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import {
  Order,
  type IOrderBudgetLine,
  type OrderArea,
  type OrderPriority,
  type OrderState,
  type OrderWorkflow,
} from '../models/Order.js';
import { OrderProgressStage } from '../models/OrderProgressStage.js';
import { Client } from '../models/Client.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { sendOrderProgressEmail } from '../services/smtpService.js';
import { applyBudgetLinesReplacementStockDelta } from '../services/replacementStockService.js';
import type { AuthRequest } from '../middleware/auth.js';
import { PRINT_ORDER_MESSAGES, STATUS_UPDATE_MESSAGES } from '../constants/messages.js';
import { ensureWarrantyStages, seedDefaultStagesIfEmpty } from './orderProgressStageController.js';
import {
  buildTechnicalReportDocxBuffer,
  isOrderEligibleForTechnicalReport,
} from '../services/technicalReportDocx.js';
import { drawHtmlToPdfKit } from '../utils/htmlToPdfKit.js';

/** Matches backend `getAssignableTechnicians` / frontend technician detection. */
function isTechnicianRole(slug: string, roleName?: string): boolean {
  const s = String(slug ?? '').toLowerCase();
  const n = String(roleName ?? '').toLowerCase();
  return s === 'technician' || s.includes('tech') || n.includes('technician') || n.includes('tech');
}

/** Technicians may only access orders assigned to them; use 404 to avoid leaking ids. */
function denyIfTechnicianNotAssignee(req: AuthRequest, res: Response, orderTechnicianId: unknown): boolean {
  if (!req.user || !isTechnicianRole(req.user.role)) return false;
  const tid = String(orderTechnicianId ?? '').trim();
  if (tid === req.user._id) return false;
  res.status(404).json({ error: 'Order not found' });
  return true;
}

/** Load image bytes for order photos stored as `/uploads/...` URLs or base64 / data URLs. */
function resolveStoredImageBuffer(raw: unknown): Buffer | null {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return null;
  // Do not treat arbitrary remote URLs as base64 (avoids garbage buffers and docx errors).
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes('/uploads/')) {
    return null;
  }
  try {
    const normalized = trimmed.replaceAll('\\', '/');
    const uploadIdx = normalized.indexOf('/uploads/');
    if (uploadIdx >= 0) {
      const uploadRoot = path.resolve(process.cwd(), 'uploads');
      const rel = normalized.slice(uploadIdx + '/uploads/'.length);
      const filePath = path.join(uploadRoot, rel);
      if (!fs.existsSync(filePath)) return null;
      return fs.readFileSync(filePath);
    }
    const base64Match = /^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/.exec(trimmed);
    const base64 = base64Match ? base64Match[1] : trimmed;
    const decoded = Buffer.from(base64, 'base64');
    if (!decoded.length) return null;
    return decoded;
  } catch {
    return null;
  }
}

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

function getClientPreferredPhone(client: any): string {
  return String(client?.telefono1 ?? client?.telefono2 ?? client?.telefono3 ?? '').trim();
}

function normalizeProgressStageKey(raw: unknown): string {
  return String(raw ?? '').trim();
}

function deriveLegacyStateFromLegacyArea(area: OrderArea): OrderState {
  switch (area) {
    case 'entrance':
      return 'income';
    case 'maintenance':
      return 'maintenance';
    case 'warehouse':
      return 'warehouse';
    case 'delivery':
      return 'delivery';
    case 'waiting-parts':
      return 'waiting';
  }
}

type StageLean = { key: string; legacyArea: OrderArea; sortOrder: number; workflow?: string };

type StageInferenceContext = {
  stages: StageLean[];
  stagesByLegacyArea: Map<OrderArea, string>;
  defaultStageKey: string;
  firstStageKeyByWorkflow: Map<OrderWorkflow, string>;
};

function normalizeOrderWorkflow(o: { workflow?: unknown; warranty?: unknown }): OrderWorkflow {
  const w = String(o?.workflow ?? '').trim();
  if (w === 'warranty' || w === 'standard') return w;
  return o?.warranty === true || String(o?.warranty ?? '') === 'yes' ? 'warranty' : 'standard';
}

function inferProgressStageKeyFromOrder(o: any, ctx: StageInferenceContext): string {
  const raw = normalizeProgressStageKey(o?.progressStageKey);
  if (raw) return raw;
  const wf = normalizeOrderWorkflow(o);
  const first = ctx.firstStageKeyByWorkflow.get(wf);
  if (first) return first;
  const legacyArea = String(o?.area ?? '').trim() as OrderArea;
  const pool = ctx.stages
    .filter((s) => String(s.workflow ?? 'standard') === wf && s.legacyArea === legacyArea)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (pool[0]?.key) return String(pool[0].key);
  const inferred = ctx.stagesByLegacyArea.get(legacyArea);
  return inferred || ctx.defaultStageKey || '';
}

async function loadStageInferenceContext(): Promise<StageInferenceContext> {
  await seedDefaultStagesIfEmpty();
  await ensureWarrantyStages();
  const stages = (await OrderProgressStage.find().sort({ workflow: 1, sortOrder: 1 }).lean()) as StageLean[];
  const stagesByLegacyArea = new Map<OrderArea, string>();
  for (const s of stages) {
    if (String(s.workflow ?? 'standard') !== 'standard') continue;
    const legacyArea = String(s?.legacyArea ?? '') as OrderArea;
    if (!legacyArea) continue;
    if (!stagesByLegacyArea.has(legacyArea)) stagesByLegacyArea.set(legacyArea, String(s?.key ?? ''));
  }
  const firstStageKeyByWorkflow = new Map<OrderWorkflow, string>();
  for (const wf of ['standard', 'warranty'] as const) {
    const first = stages.find((s) => String(s.workflow ?? 'standard') === wf);
    firstStageKeyByWorkflow.set(wf, String(first?.key ?? ''));
  }
  const defaultStageKey = firstStageKeyByWorkflow.get('standard') ?? String(stages[0]?.key ?? '');
  return { stages, stagesByLegacyArea, defaultStageKey, firstStageKeyByWorkflow };
}

/** Backfill `workflow` on legacy orders (before explicit field existed). */
async function syncLegacyOrderWorkflowFields(): Promise<void> {
  try {
    await Order.updateMany(
      { $or: [{ workflow: { $exists: false } }, { workflow: null }, { workflow: '' }] },
      [{ $set: { workflow: { $cond: ['$warranty', 'warranty', 'standard'] } } }]
    );
  } catch (e) {
    console.warn('syncLegacyOrderWorkflowFields:', e);
  }
}

function emptyStageInferenceContext(): StageInferenceContext {
  return {
    stages: [],
    stagesByLegacyArea: new Map(),
    defaultStageKey: '',
    firstStageKeyByWorkflow: new Map(),
  };
}

function toListResponse(
  o: any,
  usersById: Map<string, { name: string; identification: string }>,
  clientPhonesById: Map<number, string> = new Map<number, string>(),
  ctx: StageInferenceContext = emptyStageInferenceContext()
) {
  return {
    id: o._id,
    no: o.no,
    code: o.code,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    priority: o.priority,
    state: o.state,
    area: o.area,
    workflow: normalizeOrderWorkflow(o),
    progressStageKey: inferProgressStageKeyFromOrder(o, ctx),
    type: o.type,
    equipment: `${o.brand}(${o.model})`,
    series: o.series,
    customer: o.clientName,
    customerId: o.clientIdentification,
    customerPhone: clientPhonesById.get(Number(o.clientId ?? 0)) ?? '',
    technical: formatTechnician(o.technician, usersById),
    equipmentCondition: String(o.equipmentCondition ?? ''),
    technicalReport: String(o.technicalReport ?? ''),
    total: o.total,
    advancement: Number.isFinite(Number(o.advancement)) ? Number(o.advancement) : 0,
  };
}

function toDetailResponse(
  o: any,
  usersById: Map<string, { name: string; identification: string }> = new Map<string, { name: string; identification: string }>(),
  customerPhone = '',
  ctx: StageInferenceContext = emptyStageInferenceContext()
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
    workflow: normalizeOrderWorkflow(o),
    progressStageKey: inferProgressStageKeyFromOrder(o, ctx),
    type: o.type,

    clientId: o.clientId,
    customer: o.clientName,
    customerId: o.clientIdentification,
    customerPhone,

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

function toPublicTrackResponse(o: any, ctx: StageInferenceContext = emptyStageInferenceContext()) {
  return {
    code: o.code,
    state: o.state,
    area: o.area,
    workflow: normalizeOrderWorkflow(o),
    progressStageKey: inferProgressStageKeyFromOrder(o, ctx),
    type: o.type,
    customer: o.clientName,
    brand: o.brand,
    model: o.model,
    series: o.series,
    equipment: `${o.brand}(${o.model})`,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    photoBeforeRepair: String(o.photoBeforeRepair ?? ''),
    photoAfterRepair: String(o.photoAfterRepair ?? ''),
    equipmentCondition: String(o.equipmentCondition ?? ''),
    technicalReport: String(o.technicalReport ?? ''),
    warranty: Boolean(o.warranty),
  };
}

function normalizePhoneForWhatsApp(raw: unknown): string {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  // Ecuador (+593): WhatsApp expects E.164 without leading +.
  if (digits.startsWith('593')) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `593${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('9')) return `593${digits}`;
  return digits;
}

function buildTrackWhatsAppLink(params: { phone: string; code: string; state: string }): string {
  const phone = normalizePhoneForWhatsApp(params.phone);
  if (!phone) return '';
  const text = STATUS_UPDATE_MESSAGES.trackWhatsAppText({
    code: params.code,
    state: params.state,
  });
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function buildStatusWhatsAppLink(params: {
  phone: string;
  customerName: string;
  code: string;
  orderNo: string;
  fromState: string;
  toState: string;
}): string {
  const phone = normalizePhoneForWhatsApp(params.phone);
  if (!phone) return '';
  const text = STATUS_UPDATE_MESSAGES.statusWhatsAppText({
    customerName: params.customerName,
    orderNo: params.orderNo,
    code: params.code,
    fromState: params.fromState,
    toState: params.toState,
  });
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
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

export async function getOrders(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const area = typeof req.query.area === 'string' ? req.query.area.trim() : '';
    const state = typeof req.query.state === 'string' ? req.query.state.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const workflowQ = typeof req.query.workflow === 'string' ? req.query.workflow.trim().toLowerCase() : '';
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit), 10) || 50));

    await syncLegacyOrderWorkflowFields();
    const ctx = await loadStageInferenceContext();

    const filter: Record<string, unknown> = {};
    if (req.user && isTechnicianRole(req.user.role, req.user.roleName)) {
      filter.technician = req.user._id;
    }
    if (workflowQ === 'standard' || workflowQ === 'warranty') {
      filter.workflow = workflowQ;
    }
    if (area) filter.area = area;
    if (state) filter.state = state;
    if (search) {
      const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ no: re }, { code: re }, { clientName: re }, { series: re }, { brand: re }, { model: re }];
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

    const clientIds = Array.from(
      new Set(
        orders
          .map((o: any) => Number(o.clientId ?? 0))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );
    const clients = clientIds.length
      ? await Client.find({ clientesid: { $in: clientIds } })
          .select('clientesid telefono1 telefono2 telefono3')
          .lean()
      : [];
    const clientPhonesById = new Map<number, string>();
    for (const c of clients as any[]) {
      const id = Number(c?.clientesid ?? 0);
      if (!Number.isFinite(id) || id <= 0) continue;
      clientPhonesById.set(id, getClientPreferredPhone(c));
    }

    return res.json({
      orders: orders.map((o: any) => toListResponse(o, usersById, clientPhonesById, ctx)),
    });
  } catch (err) {
    console.error('Get orders error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function getOrderById(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (denyIfTechnicianNotAssignee(req, res, (order as any).technician)) return;

    await syncLegacyOrderWorkflowFields();
    const ctx = await loadStageInferenceContext();

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

    const client = await Client.findOne({ clientesid: Number((order as any).clientId ?? 0) })
      .select('telefono1 telefono2 telefono3')
      .lean();
    return res.json({
      order: toDetailResponse(order, usersById, getClientPreferredPhone(client), ctx),
    });
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
    const technicianId = String((order as any).technician ?? '').trim();
    let phone = '';
    if (technicianId) {
      const technician = await User.findById(technicianId).select('phone').lean();
      phone = String((technician as any)?.phone ?? '').trim();
    }
    await syncLegacyOrderWorkflowFields();
    const ctx = await loadStageInferenceContext();
    return res.json({
      order: {
        ...toPublicTrackResponse(order, ctx),
        whatsappLink: buildTrackWhatsAppLink({
          phone,
          code: String((order as any).code ?? ''),
          state: String((order as any).state ?? ''),
        }),
      },
    });
  } catch (err) {
    console.error('Track order error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

/** Public: download technical report Word document by tracking code (no auth). */
export async function getOrderTechnicalReportByCode(req: Request, res: Response): Promise<Response | void> {
  try {
    const raw = String(req.params.code ?? '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    if (raw.length < 4) return res.status(400).json({ error: 'Invalid tracking code' });

    const order = await Order.findOne({ code: raw }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!isOrderEligibleForTechnicalReport(order as { area?: string; state?: string })) {
      return res.status(403).json({ error: 'Report is not available for this order status yet' });
    }

    const technicianId = String((order as any).technician ?? '').trim();
    const usersById = new Map<string, { name: string; identification: string }>();
    if (technicianId) {
      const u = await User.findById(technicianId).select('name identification').lean();
      if (u) {
        usersById.set(String(u._id), {
          name: String((u as any).name ?? ''),
          identification: String((u as any).identification ?? ''),
        });
      }
    }
    const technical = formatTechnician((order as any).technician, usersById);

    const company = await Company.findOne().lean();

    let logoBuffer: Buffer | null = null;
    if (company?.logo) {
      const trimmed = String(company.logo).trim();
      if (trimmed) {
        try {
          const normalized = trimmed.replaceAll('\\', '/');
          const uploadIdx = normalized.indexOf('/uploads/');
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
    if (!logoBuffer) {
      try {
        const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets');
        logoBuffer = fs.readFileSync(path.join(assetsDir, 'logo.png'));
      } catch {
        logoBuffer = null;
      }
    }

    const budgetLinesRaw = Array.isArray((order as any).budgetLines) ? (order as any).budgetLines : [];
    const budgetLines = (budgetLinesRaw as IOrderBudgetLine[]).map((l) => ({
      name: String(l?.name ?? ''),
      total: Number.isFinite(Number(l?.total)) ? Number(l.total) : 0,
    }));

    const photoBeforeBuffer = resolveStoredImageBuffer((order as any).photoBeforeRepair);
    const photoAfterBuffer = resolveStoredImageBuffer((order as any).photoAfterRepair);

    const buffer = await buildTechnicalReportDocxBuffer({
      trackingCode: raw,
      brand: String((order as any).brand ?? ''),
      model: String((order as any).model ?? ''),
      series: String((order as any).series ?? ''),
      type: String((order as any).type ?? ''),
      equipmentCondition: String((order as any).equipmentCondition ?? ''),
      technicalReport: String((order as any).technicalReport ?? ''),
      budgetLines,
      technicianName: technical || '—',
      companyName: company?.companyName?.trim() || 'Servitec',
      logoBuffer,
      photoBeforeBuffer,
      photoAfterBuffer,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-tecnico-${raw}.docx"`);
    return res.send(buffer);
  } catch (err) {
    console.error('Technical report download error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

/** Public: delivered/finished orders for landing showcase (before/after photos + technical notes). */
export async function getOrdersShowcase(req: Request, res: Response): Promise<Response | void> {
  try {
    const limit = Math.min(24, Math.max(1, parseInt(String(req.query.limit), 10) || 6));
    const orders = await Order.find({ state: { $in: ['delivery', 'finished'] } })
      .select('code type brand model series photoBeforeRepair photoAfterRepair equipmentCondition technicalReport createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    const items = orders.map((o: any) => ({
      code: o.code,
      type: o.type,
      brand: o.brand,
      model: o.model,
      series: o.series,
      photoBeforeRepair: String(o.photoBeforeRepair ?? ''),
      photoAfterRepair: String(o.photoAfterRepair ?? ''),
      equipmentCondition: String(o.equipmentCondition ?? ''),
      technicalReport: String(o.technicalReport ?? ''),
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
    }));
    return res.json({ orders: items });
  } catch (err) {
    console.error('Orders showcase error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

/** Public: one delivered/finished showcase entry by order code (for blog post URLs). */
export async function getOrderShowcaseByCode(req: Request, res: Response): Promise<Response | void> {
  try {
    const raw = String(req.params.code ?? '').trim();
    if (!raw) {
      return res.status(400).json({ error: 'Code is required' });
    }
    const order = await Order.findOne({
      code: raw,
      state: { $in: ['delivery', 'finished'] },
    })
      .select('code type brand model series photoBeforeRepair photoAfterRepair equipmentCondition technicalReport createdAt')
      .lean();
    if (!order) {
      return res.status(404).json({ error: 'Not found' });
    }
    const o = order as {
      code: string;
      type: string;
      brand: string;
      model: string;
      series: string;
      photoBeforeRepair?: string;
      photoAfterRepair?: string;
      equipmentCondition?: string;
      technicalReport?: string;
      createdAt?: Date;
    };
    return res.json({
      order: {
        code: o.code,
        type: o.type,
        brand: o.brand,
        model: o.model,
        series: o.series,
        photoBeforeRepair: String(o.photoBeforeRepair ?? ''),
        photoAfterRepair: String(o.photoAfterRepair ?? ''),
        equipmentCondition: String(o.equipmentCondition ?? ''),
        technicalReport: String(o.technicalReport ?? ''),
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : undefined,
      },
    });
  } catch (err) {
    console.error('Order showcase by code error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function createOrder(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const body = req.body as Record<string, unknown>;

    const clientId = parseInt(String(body.clientId ?? ''), 10);
    const brand = String(body.brand ?? '').trim();
    const model = String(body.model ?? '').trim();
    const series = String(body.series ?? '').trim();
    const type = String(body.type ?? '').trim();

    let area = String(body.area ?? '').trim() as OrderArea;
    let state = String(body.state ?? '').trim() as OrderState;
    const priority = (String(body.priority ?? '').trim() as OrderPriority) || 'normal';
    let technician = String(body.technician ?? '').trim();
    if (req.user && isTechnicianRole(req.user.role)) {
      if (technician && technician !== req.user._id) {
        return res.status(403).json({ error: 'You can only create orders assigned to yourself' });
      }
      technician = req.user._id;
    }

    if (!Number.isFinite(clientId)) return res.status(400).json({ error: 'clientId is required' });
    if (!brand) return res.status(400).json({ error: 'brand is required' });
    if (!model) return res.status(400).json({ error: 'model is required' });
    if (!series) return res.status(400).json({ error: 'series is required' });
    if (!type) return res.status(400).json({ error: 'type is required' });
    if (!technician) return res.status(400).json({ error: 'technician is required' });

    await ensureWarrantyStages();
    const warrantyFlag = String(body.warranty ?? 'no') === 'yes' || body.warranty === true;
    const orderWorkflow: OrderWorkflow = warrantyFlag ? 'warranty' : 'standard';

    // If a fine-grained progress stage is provided, it overrides legacy area/state.
    let progressStageKey = normalizeProgressStageKey(body.progressStageKey);
    if (progressStageKey) {
      const stage = await OrderProgressStage.findOne({ key: progressStageKey }).lean();
      if (stage && String((stage as any).workflow ?? 'standard') === orderWorkflow) {
        (area as any) = stage.legacyArea;
        (state as any) = deriveLegacyStateFromLegacyArea(stage.legacyArea);
      } else {
        progressStageKey = '';
      }
    }
    if (!progressStageKey) {
      const stagesForWorkflow = await OrderProgressStage.find({ workflow: orderWorkflow }).sort({ sortOrder: 1 }).lean();
      const first = stagesForWorkflow[0] as { key?: string; legacyArea?: OrderArea } | undefined;
      progressStageKey = String(first?.key ?? '');
      if (first?.legacyArea) {
        (area as any) = first.legacyArea;
        (state as any) = deriveLegacyStateFromLegacyArea(first.legacyArea);
      }
    }

    const productDoc = await Product.findOne({ product: type, state: 'active' }).lean();
    if (!productDoc) {
      return res.status(400).json({ error: 'Product not available' });
    }

    const client = await Client.findOne({ clientesid: clientId }).lean();
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const phone = getClientPreferredPhone(client);
    const email = String((client as any)?.email ?? '').trim();
    if (!phone || !email) {
      return res.status(400).json({
        error:
          'This client must have at least one phone number and an email address before you can create an order.',
        code: 'CLIENT_CONTACT_REQUIRED',
        clientId,
      });
    }

    const budgetLines = normalizeBudgetLines(body.budgetLines);
    const stockApply = await applyBudgetLinesReplacementStockDelta([], budgetLines);
    if (!stockApply.ok) return res.status(400).json({ error: stockApply.error });

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

    let doc;
    try {
      doc = await Order.create({
      no: await nextOrderNo(),
      code: randomCode(6),
      priority,
      area,
      state,
        progressStageKey,
      deliveryArrivedAt: state === 'delivery' ? new Date() : undefined,
      type,
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
      warranty: warrantyFlag,
      workflow: orderWorkflow,
      fianceeDate: String(body.fianceeDate ?? '').trim(),
      advancement: Number.isFinite(advancement) ? advancement : 0,
      accessories,
      budgetLines,
      total: Number.isFinite(totalFromLines) ? totalFromLines : 0,

      photoBeforeRepair: photoBefore.value,
      photoAfterRepair: photoAfter.value,
    });
    } catch (createErr) {
      const rollback = await applyBudgetLinesReplacementStockDelta(budgetLines, []);
      if (!rollback.ok) console.error('Replacement stock rollback after failed create:', rollback.error);
      throw createErr;
    }

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
    const ctx = await loadStageInferenceContext();
    return res.status(201).json({ order: toListResponse(obj, usersById, new Map<number, string>(), ctx) });
  } catch (err) {
    const error = err as Error & { code?: number };
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Duplicate order number/code. Please try again.' });
    }
    console.error('Create order error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function patchOrder(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const doc = await Order.findById(id);
    if (!doc) return res.status(404).json({ error: 'Order not found' });
    if (denyIfTechnicianNotAssignee(req, res, (doc as any).technician)) return;

    const stateBefore = doc.state as OrderState;
    const body = req.body as Record<string, unknown>;
    // Immutable: order number and customer tracking code must never change via PATCH
    delete body.code;
    delete body.no;

    const hasProgressStageKeyUpdate = body.progressStageKey != null;

    if (body.warranty != null) {
      const prevWf = normalizeOrderWorkflow(doc.toObject());
      doc.warranty = String(body.warranty ?? 'no') === 'yes' || body.warranty === true;
      (doc as any).workflow = doc.warranty ? 'warranty' : 'standard';
      const nextWf = (doc as any).workflow as OrderWorkflow;
      if (prevWf !== nextWf) {
        await ensureWarrantyStages();
        const stagesForWf = await OrderProgressStage.find({ workflow: nextWf }).sort({ sortOrder: 1 }).lean();
        const keys = new Set(stagesForWf.map((s) => String(s.key)));
        if (!keys.has(String(doc.progressStageKey ?? ''))) {
          const first = stagesForWf[0];
          if (first) {
            doc.progressStageKey = String(first.key);
            doc.area = first.legacyArea as OrderArea;
            doc.state = deriveLegacyStateFromLegacyArea(first.legacyArea as OrderArea);
          }
        }
      }
    }

    if (hasProgressStageKeyUpdate) {
      const nextKey = normalizeProgressStageKey(body.progressStageKey);
      await ensureWarrantyStages();
      if (nextKey) {
        const stage = await OrderProgressStage.findOne({ key: nextKey }).lean();
        if (!stage) return res.status(400).json({ error: 'Unknown progressStageKey' });
        const wf = normalizeOrderWorkflow(doc.toObject());
        if (String((stage as any).workflow ?? 'standard') !== wf) {
          return res.status(400).json({ error: 'progressStageKey does not match this order workflow' });
        }
        doc.progressStageKey = nextKey;
        doc.area = stage.legacyArea;
        doc.state = deriveLegacyStateFromLegacyArea(stage.legacyArea);
      } else {
        doc.progressStageKey = '';
      }
      delete body.area;
      delete body.state;
    }

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

    // If the order comes from legacy UI (no progressStageKey sent), infer stage from legacy area.
    // This keeps the admin stage tabs accurate for older orders that never stored progressStageKey.
    if (!hasProgressStageKeyUpdate && (body.area != null || body.state != null)) {
      await seedDefaultStagesIfEmpty();
      const stagesForArea = await OrderProgressStage.find({ legacyArea: doc.area }).sort({ sortOrder: 1 }).lean();
      doc.progressStageKey = String(stagesForArea?.[0]?.key ?? '');
    }
    if (body.priority != null) doc.priority = (String(body.priority ?? '').trim() as OrderPriority) || 'normal';

    if (body.technician != null) {
      if (req.user && isTechnicianRole(req.user.role, req.user.roleName)) {
        return res.status(403).json({ error: 'You cannot reassign the technician' });
      }
      const technician = String(body.technician ?? '').trim();
      if (!technician) return res.status(400).json({ error: 'technician is required' });
      doc.technician = technician;
    }

    if (body.equipmentCondition != null) doc.equipmentCondition = String(body.equipmentCondition ?? '').trim();
    if (body.technicalReport != null) doc.technicalReport = String(body.technicalReport ?? '').trim();

    if (body.diagnosis != null) doc.diagnosis = String(body.diagnosis ?? 'no') === 'yes' || body.diagnosis === true;

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
      const previousLines = Array.isArray((doc as any).budgetLines)
        ? ([...(doc as any).budgetLines] as IOrderBudgetLine[])
        : [];
      const stockApply = await applyBudgetLinesReplacementStockDelta(previousLines, budgetLines);
      if (!stockApply.ok) return res.status(400).json({ error: stockApply.error });
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

    const stateAfter = doc.state as OrderState;
    if (stateAfter === 'delivery' && stateBefore !== 'delivery') {
      doc.deliveryArrivedAt = new Date();
      doc.pickupReminder30dSentAt = null;
      doc.pickupReminder90dSentAt = null;
    }

    await doc.save();

    // Notify customer only when the order stage changes.
    let statusWhatsappLink = '';
    if (stateAfter !== stateBefore) {
      try {
        const client = await Client.findOne({ clientesid: doc.clientId }).lean();
        const phone = getClientPreferredPhone(client);
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
        statusWhatsappLink = buildStatusWhatsAppLink({
          phone,
          customerName: String(doc.clientName ?? ''),
          code: String(doc.code ?? ''),
          orderNo: String(doc.no ?? ''),
          fromState: String(stateBefore ?? ''),
          toState: String(stateAfter ?? ''),
        });
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

    const ctx = await loadStageInferenceContext();
    return res.json({
      order: toDetailResponse(
        obj,
        usersById,
        getClientPreferredPhone(await Client.findOne({ clientesid: obj.clientId }).select('telefono1 telefono2 telefono3').lean()),
        ctx
      ),
      whatsappLink: statusWhatsappLink,
    });
  } catch (err) {
    console.error('Patch order error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function deleteOrder(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const existing = await Order.findById(id).lean();
    if (!existing) return res.status(404).json({ error: 'Order not found' });
    if (denyIfTechnicianNotAssignee(req, res, (existing as any).technician)) return;

    const previousLines = Array.isArray((existing as any).budgetLines)
      ? ([...(existing as any).budgetLines] as IOrderBudgetLine[])
      : [];
    const stockApply = await applyBudgetLinesReplacementStockDelta(previousLines, []);
    if (!stockApply.ok) return res.status(400).json({ error: stockApply.error });

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

export async function printOrderPdf(req: AuthRequest, res: Response): Promise<Response | void> {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) return res.status(400).json({ error: 'id is required' });

    const orderDoc = await Order.findById(id).lean();
    if (!orderDoc) return res.status(404).json({ error: 'Order not found' });
    if (denyIfTechnicianNotAssignee(req, res, (orderDoc as any).technician)) return;

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

    const ctx = await loadStageInferenceContext();
    const detail = toDetailResponse(orderDoc, usersById, '', ctx);

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

    if (!logoBuffer) {
      try {
        const assetsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets');
        logoBuffer = fs.readFileSync(path.join(assetsDir, 'logo.png'));
      } catch {
        logoBuffer = null;
      }
    }

    const COMPANY_LINE = company
      ? `${company.companyName ?? ''} | Tel.: ${company.phone ?? ''} | ${company.email ?? ''} | ${
          company.address ?? ''
        }`
      : 'SERVICE TECHNICAL DIGITALSERVER | Tel.: 0991684191 | info@digitalserver.com.ec | CDLA BRISAS DEL RIO MZ N1 V10';

    const M = 40;
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const contentW = pageW - M * 2;
    const bottomSafe = pageH - M;

    function ensureSpace(currentY: number, needed: number): number {
      if (currentY + needed > bottomSafe) {
        doc.addPage();
        return M;
      }
      return currentY;
    }

    function drawSectionBar(label: string, x: number, y: number, w: number): number {
      doc.save();
      doc.rect(x, y, w, 16).fill('#f3f4f6');
      doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold');
      doc.text(label, x + 8, y + 4, { width: w - 16 });
      doc.restore();
      return y + 18;
    }

    function drawLabeledBlock(
      label: string,
      value: string,
      x: number,
      y: number,
      width: number,
      lineGap: number
    ): number {
      const labelLine = `${label}:`;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151');
      const labelH = doc.heightOfString(labelLine, { width });
      doc.text(labelLine, x, y, { width });
      doc.font('Helvetica').fillColor('#111827');
      doc.text(value || '—', x, y + labelH + lineGap, { width });
      return doc.y;
    }

    function drawCopy(copyLabel: string, startY: number): number {
      let y = startY;

      // --- Header strip ---
      doc.save();
      doc.rect(M, y, contentW, 56).fill('#f9fafb').stroke('#e5e7eb');
      doc.restore();

      const headerTop = y + 6;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, M + 8, headerTop, { fit: [112, 44] });
        } catch {
          // ignore
        }
      } else {
        doc.save().fontSize(16).font('Helvetica-Bold').fillColor('#e11d48').text('Digital', M + 8, headerTop + 8);
        const tw = doc.widthOfString('Digital');
        doc.fillColor('#6b7280').text('server', M + 8 + tw + 2, headerTop + 8);
        doc.restore();
      }

      const titleSidePad = 128;
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827');
      doc.text(copyLabel, M + titleSidePad, headerTop + 10, {
        width: contentW - titleSidePad * 2,
        align: 'center',
      });

      const orderBadge = `ORDER ${detail.no}`;
      doc.fontSize(11).font('Helvetica-Bold');
      const badgeW = Math.min(doc.widthOfString(orderBadge) + 20, contentW * 0.4);
      const badgeX = pageW - M - badgeW - 8;
      doc.save();
      doc.roundedRect(badgeX, headerTop + 6, badgeW, 26, 4).fill('#ffffff').stroke('#d1d5db');
      doc.fillColor('#111827').text(orderBadge, badgeX, headerTop + 12, { width: badgeW, align: 'center' });
      doc.restore();

      y += 62;

      doc.fontSize(8).font('Helvetica').fillColor('#4b5563');
      doc.text(`Print date: ${fmtDate(now)}`, M, y, { width: contentW * 0.5 });
      doc.text(`Check-in: ${fmtDateTime(createdAt)}`, M, y, { width: contentW, align: 'right' });
      y = doc.y + 6;

      doc.fontSize(7.5).font('Helvetica').fillColor('#6b7280');
      doc.text(COMPANY_LINE, M, y, { width: contentW, align: 'center' });
      y = doc.y + 10;

      // --- Customer / Equipment two columns ---
      const colGap = 14;
      const colW = (contentW - colGap) / 2;
      const boxY = y;

      y = drawSectionBar('CUSTOMER', M, y, colW);
      const custStart = y;
      doc.fontSize(8).font('Helvetica');
      let custY = custStart;
      custY = drawLabeledBlock('Name', `${detail.customer} (${detail.customerId})`, M + 4, custY, colW - 8, 1) + 4;
      custY = drawLabeledBlock('Phone', String(client?.telefono1 ?? ''), M + 4, custY, colW - 8, 1) + 4;
      custY = drawLabeledBlock('Email', String(client?.email ?? ''), M + 4, custY, colW - 8, 1);

      const rightX = M + colW + colGap;
      let eqY = boxY;
      eqY = drawSectionBar('EQUIPMENT', rightX, eqY, colW);
      eqY += 2;
      eqY = drawLabeledBlock('Product', String(detail.type), rightX + 4, eqY, colW - 8, 1) + 4;
      eqY = drawLabeledBlock('Brand / Model', `${detail.brand} (${detail.model})`, rightX + 4, eqY, colW - 8, 1) + 4;
      eqY = drawLabeledBlock('Serial / IMEI', String(detail.series), rightX + 4, eqY, colW - 8, 1) + 4;
      eqY = drawLabeledBlock(
        'Promised date',
        detail.fianceeDate?.trim() || '—',
        rightX + 4,
        eqY,
        colW - 8,
        1
      );

      y = Math.max(custY, eqY) + 10;

      // Totals strip
      doc.save();
      doc.rect(M, y, contentW, 22).fill('#eff6ff').stroke('#bfdbfe');
      doc.fillColor('#1e3a8a').fontSize(9).font('Helvetica-Bold');
      doc.text(
        `Total: $${total.toFixed(2)}   •   Advance: $${adv.toFixed(2)}   •   Balance: $${saldo.toFixed(2)}`,
        M + 8,
        y + 6,
        { width: contentW - 16, align: 'center' }
      );
      doc.restore();
      y += 28;

      // --- Budget table ---
      const budgetLines = Array.isArray(detail.budgetLines) ? detail.budgetLines : [];
      const hasBudgetLines = budgetLines.length > 0;

      const qtyW = 36;
      const unitW = 72;
      const lineTotW = 78;
      const descW = contentW - qtyW - unitW - lineTotW - 24;
      const tableLeft = M;
      const xQty = tableLeft;
      const xDesc = xQty + qtyW + 6;
      const xUnit = xDesc + descW + 6;
      const xLineTot = xUnit + unitW + 6;

      y = drawSectionBar('BUDGET LINES', M, y, contentW);
      y += 4;

      const headerH = 18;
      y = ensureSpace(y, headerH + 40);
      doc.save();
      doc.rect(tableLeft, y, contentW, headerH).fill('#1f2937');
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
      doc.text('Qty', xQty + 4, y + 5, { width: qtyW });
      doc.text('Description', xDesc, y + 5, { width: descW });
      doc.text('Unit', xUnit, y + 5, { width: unitW, align: 'right' });
      doc.text('Line total', xLineTot, y + 5, { width: lineTotW, align: 'right' });
      doc.restore();
      y += headerH;

      const rowPad = 5;
      doc.fontSize(8).font('Helvetica').fillColor('#111827');

      const drawRow = (cells: { qty: string; desc: string; unit: string; line: string }, alt: boolean) => {
        doc.fontSize(8).font('Helvetica');
        const hDesc = doc.heightOfString(cells.desc, { width: descW });
        const rowH = Math.max(22, hDesc + rowPad * 2);
        y = ensureSpace(y, rowH + 2);
        const rowTop = y;
        doc.save();
        doc.rect(tableLeft, rowTop, contentW, rowH).fill(alt ? '#f9fafb' : '#ffffff').stroke('#e5e7eb');
        doc.restore();
        doc.fontSize(8).font('Helvetica').fillColor('#111827');
        doc.text(cells.qty, xQty + 4, rowTop + rowPad, { width: qtyW });
        doc.text(cells.desc, xDesc, rowTop + rowPad, { width: descW });
        doc.text(cells.unit, xUnit, rowTop + rowPad, { width: unitW, align: 'right' });
        doc.text(cells.line, xLineTot, rowTop + rowPad, { width: lineTotW, align: 'right' });
        y = rowTop + rowH;
      };

      if (hasBudgetLines) {
        let i = 0;
        for (const line of budgetLines as any[]) {
          const qty = Number.isFinite(Number(line.amount)) ? Number(line.amount) : 0;
          const price = Number.isFinite(Number(line.price)) ? Number(line.price) : 0;
          const lineTotalVal = Number.isFinite(Number(line.total)) ? Number(line.total) : qty * price;
          y = ensureSpace(y, 28);
          drawRow(
            {
              qty: qty ? String(qty) : '—',
              desc: String(line.name ?? '—'),
              unit: price ? `$${price.toFixed(2)}` : '—',
              line: lineTotalVal ? `$${lineTotalVal.toFixed(2)}` : '—',
            },
            i % 2 === 1
          );
          i += 1;
        }
      } else {
        y = ensureSpace(y, 28);
        const fallbackLineTotal = total > 0 ? total : adv > 0 ? adv : 0;
        drawRow(
          {
            qty: '1',
            desc: 'SERVICE',
            unit: fallbackLineTotal ? `$${fallbackLineTotal.toFixed(2)}` : '—',
            line: fallbackLineTotal ? `$${fallbackLineTotal.toFixed(2)}` : '—',
          },
          false
        );
      }

      doc.save();
      doc.strokeColor('#e5e7eb').moveTo(tableLeft, y).lineTo(tableLeft + contentW, y).stroke();
      doc.restore();
      y += 12;

      // --- Notes ---
      y = ensureSpace(y, 120);
      y = drawSectionBar('REPORTED ISSUE', M, y, contentW);
      y = drawHtmlToPdfKit(doc, detail.equipmentCondition ?? '', M + 4, y, contentW - 8, {
        fontSize: 8,
        lineGap: 2,
        fillColor: '#111827',
      });
      y += 8;

      y = ensureSpace(y, 80);
      y = drawSectionBar('EQUIPMENT DESCRIPTION / TECHNICAL', M, y, contentW);
      y = drawHtmlToPdfKit(doc, detail.technicalReport ?? '', M + 4, y, contentW - 8, {
        fontSize: 8,
        lineGap: 2,
        fillColor: '#111827',
      });
      y += 8;

      doc.fontSize(8).font('Helvetica');
      doc.text(`Accessories: ${accessoriesText ? `${accessoriesText}.` : '—'}`, M, y, { width: contentW, lineGap: 2 });
      y = doc.y + 6;
      doc.font('Helvetica-Bold').text(`Technician: ${detail.technical || '—'}`, M, y, { width: contentW });
      y = doc.y + 12;

      // Tracking + barcode
      y = ensureSpace(y, 100);
      y = drawSectionBar('TRACKING', M, y, contentW);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#111827');
      doc.text(PRINT_ORDER_MESSAGES.trackingHeading, M + 4, y, { width: contentW - 8 });
      y = doc.y + 2;
      doc.font('Helvetica').fontSize(8);
      doc.text(PRINT_ORDER_MESSAGES.trackingInstruction(detail.code), M + 4, y, { width: contentW - 8, lineGap: 2 });
      y = doc.y + 8;

      const barcodeMaxW = Math.min(280, contentW);
      const barcodeX = M + (contentW - barcodeMaxW) / 2;
      doc.save().fillColor('black');
      drawCode39Barcode(doc, detail.code, barcodeX, y, 22);
      doc.fontSize(8).font('Helvetica').fillColor('#374151');
      doc.text(detail.code, M, y + 28, { width: contentW, align: 'center' });
      doc.restore();
      y += 52;

      // Terms
      y = ensureSpace(y, 100);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827');
      doc.text(PRINT_ORDER_MESSAGES.termsTitle, M, y, { width: contentW });
      y = doc.y + 4;
      doc.fontSize(7.5).font('Helvetica').fillColor('#374151');
      doc.text(PRINT_ORDER_MESSAGES.termsText, M, y, { width: contentW, lineGap: 2 });
      y = doc.y + 8;
      doc.fontSize(7).font('Helvetica-Oblique');
      doc.text(PRINT_ORDER_MESSAGES.customerInfoNote, M, y, { width: contentW, lineGap: 1 });
      y = doc.y + 4;
      doc.font('Helvetica-Oblique');
      doc.text(PRINT_ORDER_MESSAGES.confidentialityNote, M, y, { width: contentW, lineGap: 2 });

      return doc.y + 8;
    }

    drawCopy('WORK ORDER — CUSTOMER COPY', M);
    doc.addPage();
    drawCopy('WORK ORDER — WORKSHOP COPY', M);

    doc.end();
  } catch (err) {
    console.error('Print order PDF error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
}

