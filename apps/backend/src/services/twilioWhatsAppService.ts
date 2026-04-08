import twilio from 'twilio';
import { normalizePhoneForWhatsApp } from '../utils/whatsappPhone.js';

function accountSid(): string | undefined {
  return process.env.TWILIO_ACCOUNT_SID?.trim();
}

function authToken(): string | undefined {
  return process.env.TWILIO_AUTH_TOKEN?.trim();
}

/** e.g. whatsapp:+14155238886 or +14155238886 */
function whatsappFrom(): string | undefined {
  return process.env.TWILIO_WHATSAPP_FROM?.trim();
}

/** e.g. HX... (Twilio Content Template SID) */
function templateSid(): string | undefined {
  return process.env.TWILIO_WHATSAPP_TEMPLATE_SID?.trim();
}

/**
 * WhatsApp outbound is disabled when TWILIO_WHATSAPP_ENABLED=false,
 * or when any required Twilio env var is missing.
 */
export function isTwilioWhatsAppConfigured(): boolean {
  if (String(process.env.TWILIO_WHATSAPP_ENABLED ?? '').toLowerCase() === 'false') {
    return false;
  }
  return Boolean(accountSid() && authToken() && whatsappFrom() && templateSid());
}

function formatWhatsAppAddress(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('whatsapp:')) return t;
  const rest = t.startsWith('+') ? t.slice(1) : t;
  return `whatsapp:+${rest.replace(/^\+/, '')}`;
}

export type SendWhatsAppResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'no_phone' | 'not_configured' | 'twilio_error';
      error?: string;
    };

function normalizeContentVariableValue(raw: unknown): string {
  const value = String(raw ?? '').trim();
  // Twilio 21656: variables cannot be empty/null and reject tabs/newlines.
  const collapsedWhitespace = value.replace(/[\r\n\t]+/g, ' ').replace(/ {5,}/g, '    ');
  // Work around known apostrophe parsing issues in Twilio Content variables.
  return collapsedWhitespace.replace(/'/g, '’');
}

function buildSafeContentVariables(
  vars: Record<string | number, string>
): Record<string, string> | null {
  const safe: Record<string, string> = {};
  for (const [key, raw] of Object.entries(vars)) {
    const normalized = normalizeContentVariableValue(raw);
    if (!normalized) return null;
    safe[String(key)] = normalized;
  }
  return Object.keys(safe).length > 0 ? safe : null;
}

/**
 * Sends a WhatsApp message using a Twilio Content Template (contentSid).
 * Fails soft: callers should not abort their transaction on failure.
 */
export async function sendWhatsAppTemplateMessage(params: {
  toRawPhone: string;
  variables: Record<string | number, string>;
}): Promise<SendWhatsAppResult> {
  const digits = normalizePhoneForWhatsApp(params.toRawPhone);
  if (!digits) {
    console.log('[Twilio WhatsApp] Skipped: no_phone (empty/invalid destination phone)');
    return { ok: false, reason: 'no_phone' };
  }

  if (!isTwilioWhatsAppConfigured()) {
    console.log(
      '[Twilio WhatsApp] Skipped: not_configured',
      JSON.stringify({
        hasAccountSid: Boolean(accountSid()),
        hasAuthToken: Boolean(authToken()),
        hasFrom: Boolean(whatsappFrom()),
        hasTemplateSid: Boolean(templateSid()),
        enabledFlag: String(process.env.TWILIO_WHATSAPP_ENABLED ?? 'true'),
      })
    );
    return { ok: false, reason: 'not_configured' };
  }

  const sid = accountSid()!;
  const token = authToken()!;
  const fromRaw = whatsappFrom()!;
  const contentSid = templateSid()!;
  const safeContentVariables = buildSafeContentVariables(params.variables);
  if (!safeContentVariables) {
    console.log('[Twilio WhatsApp] Skipped: invalid_content_variables');
    return { ok: false, reason: 'twilio_error', error: 'Invalid empty/unsafe content variables' };
  }

  const client = twilio(sid, token);
  const from = formatWhatsAppAddress(fromRaw);
  const to = formatWhatsAppAddress(digits);

  console.log('[Twilio WhatsApp] Pre-send check — receiver (to):', to);
  console.log('[Twilio WhatsApp] Pre-send check — Account SID:', sid);
  console.log('[Twilio WhatsApp] Pre-send check — sender (from):', from);
  console.log('[Twilio WhatsApp] Pre-send check — contentSid:', contentSid);
  console.log('[Twilio WhatsApp] Pre-send check — contentVariables:', safeContentVariables);

  try {
    await client.messages.create({
      from,
      to,
      contentSid,
      contentVariables: JSON.stringify(safeContentVariables),
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Twilio WhatsApp send error:', e);
    return { ok: false, reason: 'twilio_error', error: msg };
  }
}
