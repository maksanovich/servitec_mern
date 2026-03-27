import nodemailer from 'nodemailer';

import type { OrderState } from '../models/Order.js';

type OrderProgressEmailParams = {
  to: string;
  orderNo: string;
  trackingCode: string;
  customerName: string;
  fromState: OrderState | null;
  toState: OrderState;
};

function formatOrderState(state: OrderState): string {
  const map: Record<OrderState, string> = {
    income: 'En recepción',
    maintenance: 'En mantenimiento',
    warehouse: 'En almacén',
    delivery: 'En entrega',
    waiting: 'En espera',
    no_solution: 'Sin solución',
    finished: 'Finalizado',
  };
  return map[state] ?? state;
}

function getSmtpTransport() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM,
    SMTP_FROM_NAME,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new Error('Missing required SMTP_* env vars');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    // Force SendGrid mode requested by user: 587 + STARTTLS
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });
}

export async function sendOrderProgressEmail(params: OrderProgressEmailParams): Promise<void> {
  const to = String(params.to ?? '').trim();
  if (!to) return;

  const SMTP_FROM = process.env.SMTP_FROM;
  const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME;
  if (!SMTP_FROM) throw new Error('Missing SMTP_FROM env var');

  const subject = `Actualización de su orden ${params.orderNo}: ${formatOrderState(params.toState)}`;

  const fromLine = params.fromState
    ? `Estado anterior: ${formatOrderState(params.fromState)}`
    : 'Estado anterior: (creada)';

  const text = [
    `Hola ${params.customerName || 'cliente'},`,
    '',
    `Le informamos que su orden número ${params.orderNo} cambió de estado.`,
    `Nuevo estado: ${formatOrderState(params.toState)}`,
    fromLine,
    '',
    `Código de seguimiento: ${params.trackingCode}`,
    '',
    'Este es un correo automático del sistema Servitec.',
  ].join('\n');

  const transporter = getSmtpTransport();

  await transporter.sendMail({
    from: SMTP_FROM_NAME ? `"${SMTP_FROM_NAME}" <${SMTP_FROM}>` : SMTP_FROM,
    to,
    subject,
    text,
  });
}

export type DeliveryPickupReminderPhase = '30d' | '90d';

type DeliveryPickupReminderParams = {
  to: string;
  orderNo: string;
  trackingCode: string;
  customerName: string;
  phase: DeliveryPickupReminderPhase;
};

export async function sendDeliveryPickupReminderEmail(params: DeliveryPickupReminderParams): Promise<void> {
  const to = String(params.to ?? '').trim();
  if (!to) return;

  const SMTP_FROM = process.env.SMTP_FROM;
  const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME;
  if (!SMTP_FROM) throw new Error('Missing SMTP_FROM env var');

  const isSecond = params.phase === '90d';
  const subject = isSecond
    ? `Aviso importante: retiro de equipo — Orden ${params.orderNo}`
    : `Recordatorio de retiro de equipo — Orden ${params.orderNo}`;

  const text = isSecond
    ? [
        `Hola ${params.customerName || 'cliente'},`,
        '',
        `Este es el segundo aviso automático respecto a la orden ${params.orderNo}.`,
        'Han transcurrido 90 días desde que su equipo llegó al área de entrega (60 días después del primer recordatorio enviado al mes de su llegada).',
        'Debe retirar su producto de inmediato. La falta de retiro puede hacer que el equipo sea considerado abandonado, con las consecuencias que ello conlleve según las políticas aplicables.',
        '',
        `Código de seguimiento: ${params.trackingCode}`,
        '',
        'Este es un correo automático del sistema Servitec.',
      ].join('\n')
    : [
        `Hola ${params.customerName || 'cliente'},`,
        '',
        `Han pasado 30 días desde que su equipo llegó al área de entrega (orden ${params.orderNo}).`,
        'Le solicitamos pasar a retirar su producto en la sucursal correspondiente.',
        '',
        `Código de seguimiento: ${params.trackingCode}`,
        '',
        'Este es un correo automático del sistema Servitec.',
      ].join('\n');

  const transporter = getSmtpTransport();

  await transporter.sendMail({
    from: SMTP_FROM_NAME ? `"${SMTP_FROM_NAME}" <${SMTP_FROM}>` : SMTP_FROM,
    to,
    subject,
    text,
  });
}

