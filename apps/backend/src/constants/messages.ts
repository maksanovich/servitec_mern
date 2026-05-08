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
  trackingHeading: 'CONSULTE EL ESTADO DE ESTA ORDEN DE TRABAJO EN NUESTRO SITIO WEB',
  trackingInstruction: (trackingCode: string) =>
    `Ingrese a tecnico.digitalserver.com.ec e introduzca el siguiente código. CÓDIGO: ${trackingCode}`,
  termsTitle: 'Términos y condiciones:',
  termsText:
    '1) Para retirar el equipo es obligatorio presentar esta orden de trabajo. Consérvela en lugar seguro. ' +
    '2) El equipo debe retirarse en un plazo máximo de 3 meses; transcurrido ese tiempo el cliente perderá todo derecho sobre el mismo. ' +
    '3) Al dejar el equipo para reparación, el cliente acepta estas condiciones, las cuales también pueden enviarse de forma virtual. ' +
    '4) El pago se realizará mediante depósito o transferencia bancaria; el cliente es responsable de proporcionar los datos de pago correctos.',
  customerInfoNote: 'Este servicio fue recibido con la información proporcionada por el cliente.',
  confidentialityNote:
    'Este documento contiene información de propiedad exclusiva de SERVICIO TÉCNICO DIGITALSERVER. Esta información es personal y no debe ser compartida.',
};

export const EMAIL_MESSAGES = {
  automaticFooter: 'Este es un correo automático del sistema Servitec.',
  progressSubject: (orderNo: string, toStateLabel: string) => `Actualización de su orden ${orderNo}: ${toStateLabel}`,
  progressPreviousStateLine: (fromStateLabel: string) => `Estado anterior: ${fromStateLabel}`,
  /** When a fine-grained pipeline stage is known (not only legacy state). */
  progressPreviousStageLine: (fromStageLabel: string) => `Etapa anterior: ${fromStageLabel}`,
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
  trackWhatsAppText: (params: { code: string; state: string }) =>
    `Hola Servitec. Quiero una actualización de mi reparación.\nCódigo: ${params.code}\nEstado actual: ${params.state}`,
  statusWhatsAppText: (params: {
    customerName: string;
    orderNo: string;
    code: string;
    fromState: string;
    toState: string;
  }) =>
    `Hola ${params.customerName || 'cliente'}, su orden de servicio fue actualizada.\n` +
    `N.° de orden: ${params.orderNo}\n` +
    `Código de seguimiento: ${params.code}\n` +
    `Estado: ${params.fromState} -> ${params.toState}`,
};
