import nodemailer from 'nodemailer';

import type { OrderState } from '../models/Order.js';
import { EMAIL_MESSAGES, ORDER_STATE_LABELS } from '../constants/messages.js';

type OrderProgressEmailParams = {
  to: string;
  orderNo: string;
  trackingCode: string;
  customerName: string;
  fromState: OrderState | null;
  toState: OrderState;
};

function formatOrderState(state: OrderState): string {
  return ORDER_STATE_LABELS[state] ?? state;
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

  const subject = EMAIL_MESSAGES.progressSubject(params.orderNo, formatOrderState(params.toState));

  const fromLine = params.fromState
    ? EMAIL_MESSAGES.progressPreviousStateLine(formatOrderState(params.fromState))
    : EMAIL_MESSAGES.progressCreatedLine;

  const text = EMAIL_MESSAGES.progressBody({
    customerName: params.customerName,
    orderNo: params.orderNo,
    toStateLabel: formatOrderState(params.toState),
    fromLine,
    trackingCode: params.trackingCode,
  });

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
    ? EMAIL_MESSAGES.pickupReminder90dSubject(params.orderNo)
    : EMAIL_MESSAGES.pickupReminder30dSubject(params.orderNo);

  const text = isSecond
    ? EMAIL_MESSAGES.pickupReminder90dBody({
        customerName: params.customerName,
        orderNo: params.orderNo,
        trackingCode: params.trackingCode,
      })
    : EMAIL_MESSAGES.pickupReminder30dBody({
        customerName: params.customerName,
        orderNo: params.orderNo,
        trackingCode: params.trackingCode,
      });

  const transporter = getSmtpTransport();

  await transporter.sendMail({
    from: SMTP_FROM_NAME ? `"${SMTP_FROM_NAME}" <${SMTP_FROM}>` : SMTP_FROM,
    to,
    subject,
    text,
  });
}

