import nodemailer from 'nodemailer';

import type { OrderState } from '../models/Order.js';
import { EMAIL_MESSAGES } from '../constants/messages.js';
import {
  buildOrderProgressEmailContext,
  resolveOrderProgressEmailContent,
} from './orderProgressEmailTemplate.js';

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

export type OrderProgressEmailParams = {
  to: string;
  order: OrderLike;
  fromState: OrderState | null;
  toState: OrderState;
  fromStageKey: string;
  toStageKey: string;
};

function getSmtpTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USERNAME || !SMTP_PASSWORD || !SMTP_FROM) {
    throw new Error('Missing required SMTP_* env vars');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
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

  const ctx = await buildOrderProgressEmailContext(
    params.order,
    params.fromState,
    params.toState,
    params.fromStageKey,
    params.toStageKey
  );
  const { subject, text } = await resolveOrderProgressEmailContent(params.toStageKey, ctx);

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
