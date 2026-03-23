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

  const portNum = Number(SMTP_PORT);
  const port = Number.isFinite(portNum) ? portNum : 465;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new Error('Missing required SMTP_* env vars');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // Gmail usually uses 465 with TLS
    auth: {
      user: SMTP_USERNAME,
      pass: SMTP_PASSWORD,
    },
    // Keep connection reliability decent; adjust if your SMTP provider requires different settings.
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

