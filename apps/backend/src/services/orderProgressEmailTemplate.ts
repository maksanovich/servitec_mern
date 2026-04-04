import type { OrderState } from '../models/Order.js';
import { OrderStageEmailTemplate } from '../models/OrderStageEmailTemplate.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { OrderProgressStage } from '../models/OrderProgressStage.js';
import { EMAIL_MESSAGES, ORDER_STATE_LABELS } from '../constants/messages.js';

export const ORDER_EMAIL_PLACEHOLDERS = [
  { key: 'customer_name', description: 'Customer display name' },
  { key: 'order_number', description: 'Work order number' },
  { key: 'tracking_code', description: 'Customer tracking code' },
  { key: 'device_model', description: 'Brand, model, and series' },
  { key: 'problem_descriptor', description: 'Equipment / problem type' },
  { key: 'problem_description', description: 'Condition and technical notes' },
  { key: 'estimated_cost', description: 'Order total (formatted)' },
  { key: 'technician_name', description: 'Assigned technician' },
  { key: 'pickup_date', description: 'Promised / pickup date field' },
  { key: 'stage_label', description: 'Current repair stage label' },
  { key: 'previous_stage_label', description: 'Previous stage label (if any)' },
  { key: 'new_state_label', description: 'Legacy state label after update' },
  { key: 'previous_state_label', description: 'Legacy state label before update' },
  { key: 'company_name', description: 'Company name from settings' },
] as const;

export type OrderEmailPlaceholderKey = (typeof ORDER_EMAIL_PLACEHOLDERS)[number]['key'];

export type OrderProgressEmailContext = {
  customerName: string;
  orderNo: string;
  trackingCode: string;
  brand: string;
  model: string;
  series: string;
  type: string;
  technicalReport: string;
  equipmentCondition: string;
  total: number;
  fianceeDate: string;
  technicianName: string;
  companyName: string;
  stageLabelAfter: string;
  stageLabelBefore: string;
  fromState: OrderState | null;
  toState: OrderState;
};

function formatOrderState(state: OrderState): string {
  return ORDER_STATE_LABELS[state] ?? state;
}

function formatMoneyEs(n: number): string {
  if (!Number.isFinite(n)) return '';
  try {
    return n.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
  } catch {
    return String(n);
  }
}

export function buildOrderEmailPlaceholderMap(ctx: OrderProgressEmailContext): Record<string, string> {
  const deviceModel = [ctx.brand, ctx.model, ctx.series].filter(Boolean).join(' ').trim();
  const problemDescription = [ctx.equipmentCondition, ctx.technicalReport].filter(Boolean).join('\n').trim();
  return {
    customer_name: ctx.customerName,
    order_number: ctx.orderNo,
    tracking_code: ctx.trackingCode,
    device_model: deviceModel,
    problem_descriptor: ctx.type,
    problem_description: problemDescription,
    estimated_cost: formatMoneyEs(ctx.total),
    technician_name: ctx.technicianName,
    pickup_date: ctx.fianceeDate,
    stage_label: ctx.stageLabelAfter,
    previous_stage_label: ctx.stageLabelBefore,
    new_state_label: formatOrderState(ctx.toState),
    previous_state_label: ctx.fromState ? formatOrderState(ctx.fromState) : '',
    company_name: ctx.companyName,
  };
}

/** Replaces `{tag}` and `{ tag }` in template strings. Unknown tags become empty. */
export function applyEmailPlaceholders(template: string, vars: Record<string, string>): string {
  return String(template ?? '').replace(/\{\s*([a-zA-Z0-9_]+)\s*\}/g, (_, rawKey: string) => {
    const key = String(rawKey ?? '').trim();
    return vars[key] ?? '';
  });
}

export function defaultOrderProgressEmail(ctx: OrderProgressEmailContext): { subject: string; text: string } {
  const fromLine = ctx.fromState
    ? EMAIL_MESSAGES.progressPreviousStateLine(formatOrderState(ctx.fromState))
    : EMAIL_MESSAGES.progressCreatedLine;
  const subject = EMAIL_MESSAGES.progressSubject(ctx.orderNo, formatOrderState(ctx.toState));
  const text = EMAIL_MESSAGES.progressBody({
    customerName: ctx.customerName,
    orderNo: ctx.orderNo,
    toStateLabel: formatOrderState(ctx.toState),
    fromLine,
    trackingCode: ctx.trackingCode,
  });
  return { subject, text };
}

export async function resolveOrderProgressEmailContent(
  toStageKey: string,
  ctx: OrderProgressEmailContext,
  /** When set, skips DB read (used for preview). */
  overrideDoc?: { subjectTemplate?: string; bodyTemplate?: string } | null
): Promise<{ subject: string; text: string }> {
  const vars = buildOrderEmailPlaceholderMap(ctx);
  const key = String(toStageKey ?? '').trim();
  if (!key) {
    return defaultOrderProgressEmail(ctx);
  }

  const fromDb =
    overrideDoc !== undefined
      ? overrideDoc
      : ((await OrderStageEmailTemplate.findOne({ stageKey: key }).lean()) as {
          subjectTemplate?: string;
          bodyTemplate?: string;
        } | null);

  const subjT = String(fromDb?.subjectTemplate ?? '').trim();
  const bodyT = String(fromDb?.bodyTemplate ?? '').trim();

  if (!subjT && !bodyT) {
    return defaultOrderProgressEmail(ctx);
  }

  const fallback = defaultOrderProgressEmail(ctx);
  const subject = subjT ? applyEmailPlaceholders(subjT, vars) : fallback.subject;
  const text = bodyT
    ? `${applyEmailPlaceholders(bodyT, vars)}\n\n${EMAIL_MESSAGES.automaticFooter}`
    : fallback.text;

  return { subject, text };
}

type OrderLike = {
  no?: unknown;
  code?: unknown;
  clientName?: unknown;
  brand?: unknown;
  model?: unknown;
  series?: unknown;
  type?: unknown;
  technicalReport?: unknown;
  equipmentCondition?: unknown;
  total?: unknown;
  fianceeDate?: unknown;
  technician?: unknown;
};

export async function buildOrderProgressEmailContext(
  order: OrderLike,
  fromState: OrderState | null,
  toState: OrderState,
  fromStageKey: string,
  toStageKey: string
): Promise<OrderProgressEmailContext> {
  const techId = String(order.technician ?? '').trim();
  let technicianName = '';
  if (techId) {
    const u = await User.findById(techId).select('name').lean();
    technicianName = String((u as { name?: string } | null)?.name ?? '').trim();
  }

  const company = await Company.findOne().select('companyName').lean();
  const companyName = String((company as { companyName?: string } | null)?.companyName ?? '').trim();

  const fk = String(fromStageKey ?? '').trim();
  const tk = String(toStageKey ?? '').trim();
  let stageLabelBefore = '';
  let stageLabelAfter = '';
  if (fk) {
    const s = await OrderProgressStage.findOne({ key: fk }).select('label').lean();
    stageLabelBefore = String((s as { label?: string } | null)?.label ?? '').trim();
  }
  if (tk) {
    const s = await OrderProgressStage.findOne({ key: tk }).select('label').lean();
    stageLabelAfter = String((s as { label?: string } | null)?.label ?? '').trim();
  }

  const total = Number(order.total ?? 0);

  return {
    customerName: String(order.clientName ?? ''),
    orderNo: String(order.no ?? ''),
    trackingCode: String(order.code ?? ''),
    brand: String(order.brand ?? ''),
    model: String(order.model ?? ''),
    series: String(order.series ?? ''),
    type: String(order.type ?? ''),
    technicalReport: String(order.technicalReport ?? ''),
    equipmentCondition: String(order.equipmentCondition ?? ''),
    total: Number.isFinite(total) ? total : 0,
    fianceeDate: String(order.fianceeDate ?? '').trim(),
    technicianName,
    companyName,
    stageLabelAfter,
    stageLabelBefore,
    fromState,
    toState,
  };
}
