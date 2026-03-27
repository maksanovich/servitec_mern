import type { OrderState } from '../models/Order.js';

export const ORDER_STATE_LABELS: Record<OrderState, string> = {
  income: 'En recepción',
  maintenance: 'En mantenimiento',
  warehouse: 'En almacén',
  delivery: 'En entrega',
  waiting: 'En espera',
  no_solution: 'Sin solución',
  finished: 'Finalizado',
};

export const PRINT_ORDER_MESSAGES = {
  trackingHeading: 'CHECK THE STATUS OF THIS WORK ORDER FROM OUR WEBSITE',
  trackingInstruction: (trackingCode: string) =>
    `Go to the website serviciotecnico.xyz and enter the following code. CODE: ${trackingCode}`,
  termsTitle: 'Terms and conditions:',
  termsText:
    '1) To collect the equipment, it is mandatory to present this work order. Please keep it safe. ' +
    '2) The equipment must be collected within a maximum period of 3 months; after this time the customer will lose all rights over it. ' +
    '3) By leaving the equipment for repair, the customer accepts these conditions, which may also be sent virtually. ' +
    '4) Payment will be made via bank deposit/transfer; the customer is responsible for providing correct payment details.',
  customerInfoNote: 'This service was received with information provided by the customer.',
  confidentialityNote:
    'This document contains information that is the exclusive property of SERVICIO TECNICO DIGITALSERVER. This information is personal and may not be shared.',
};

export const EMAIL_MESSAGES = {
  automaticFooter: 'Este es un correo automático del sistema Servitec.',
  progressSubject: (orderNo: string, toStateLabel: string) => `Actualización de su orden ${orderNo}: ${toStateLabel}`,
  progressPreviousStateLine: (fromStateLabel: string) => `Estado anterior: ${fromStateLabel}`,
  progressCreatedLine: 'Estado anterior: (creada)',
  progressBody: (params: {
    customerName: string;
    orderNo: string;
    toStateLabel: string;
    fromLine: string;
    trackingCode: string;
  }) =>
    [
      `Hola ${params.customerName || 'cliente'},`,
      '',
      `Le informamos que su orden número ${params.orderNo} cambió de estado.`,
      `Nuevo estado: ${params.toStateLabel}`,
      params.fromLine,
      '',
      `Código de seguimiento: ${params.trackingCode}`,
      '',
      EMAIL_MESSAGES.automaticFooter,
    ].join('\n'),
  pickupReminder30dSubject: (orderNo: string) => `Recordatorio de retiro de equipo — Orden ${orderNo}`,
  pickupReminder90dSubject: (orderNo: string) => `Aviso importante: retiro de equipo — Orden ${orderNo}`,
  pickupReminder30dBody: (params: { customerName: string; orderNo: string; trackingCode: string }) =>
    [
      `Hola ${params.customerName || 'cliente'},`,
      '',
      `Han pasado 30 días desde que su equipo llegó al área de entrega (orden ${params.orderNo}).`,
      'Le solicitamos pasar a retirar su producto en la sucursal correspondiente.',
      '',
      `Código de seguimiento: ${params.trackingCode}`,
      '',
      EMAIL_MESSAGES.automaticFooter,
    ].join('\n'),
  pickupReminder90dBody: (params: { customerName: string; orderNo: string; trackingCode: string }) =>
    [
      `Hola ${params.customerName || 'cliente'},`,
      '',
      `Este es el segundo aviso automático respecto a la orden ${params.orderNo}.`,
      'Han transcurrido 90 días desde que su equipo llegó al área de entrega (60 días después del primer recordatorio enviado al mes de su llegada).',
      'Debe retirar su producto de inmediato. La falta de retiro puede hacer que el equipo sea considerado abandonado, con las consecuencias que ello conlleve según las políticas aplicables.',
      '',
      `Código de seguimiento: ${params.trackingCode}`,
      '',
      EMAIL_MESSAGES.automaticFooter,
    ].join('\n'),
};

export const STATUS_UPDATE_MESSAGES = {
  trackWhatsAppText: (params: { code: string; state: string; branch: string }) =>
    `Hello Servitec! I want an update for my repair.\nCode: ${params.code}\nCurrent status: ${params.state}\nBranch: ${params.branch}`,
  statusWhatsAppText: (params: {
    customerName: string;
    orderNo: string;
    code: string;
    fromState: string;
    toState: string;
    branch: string;
  }) =>
    `Hello ${params.customerName || 'client'}, your service order has been updated.\n` +
    `Order No: ${params.orderNo}\n` +
    `Tracking code: ${params.code}\n` +
    `Status: ${params.fromState} -> ${params.toState}\n` +
    `Branch: ${params.branch}`,
};
