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

/** Keys defined on the Content resource (numeric or named). Cached per contentSid. */
const contentTemplateVarKeysCache = new Map<string, string[]>();

/**
 * Fetches variable placeholder keys for this Content template. Sending keys that are not
 * defined on the template triggers Twilio 21656 ("Content Variables parameter is invalid"),
 * including when the template has fewer placeholders than the app supplies.
 */
async function fetchContentTemplateVariableKeys(
  client: twilio.Twilio,
  contentSid: string
): Promise<string[] | null> {
  if (contentTemplateVarKeysCache.has(contentSid)) {
    return contentTemplateVarKeysCache.get(contentSid)!;
  }
  try {
    const resource = await client.content.v1.contents(contentSid).fetch();
    const vars = resource.variables;
    const keys = !vars || typeof vars !== 'object' ? [] : Object.keys(vars);
    contentTemplateVarKeysCache.set(contentSid, keys);
    return keys;
  } catch (e) {
    console.warn(
      '[Twilio WhatsApp] Could not fetch Content template metadata; sending variables unfiltered:',
      e instanceof Error ? e.message : e
    );
    return null;
  }
}

/**
 * Keeps only keys that exist on the Content template. Extra keys are dropped (fixes 21656).
 */
function pickVariablesForTemplate(
  vars: Record<string | number, string>,
  templateKeys: string[] | null
): Record<string | number, string> {
  if (templateKeys === null) {
    return vars;
  }
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    flat[String(k)] = v;
  }
  const out: Record<string, string> = {};
  for (const key of templateKeys) {
    if (Object.prototype.hasOwnProperty.call(flat, key)) {
      out[key] = flat[key];
    }
  }
  return out;
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

  const client = twilio(sid, token);
  const from = formatWhatsAppAddress(fromRaw);
  // const from = "whatsapp:+593988589163";
  const to = formatWhatsAppAddress(digits);
  // const to = "whatsapp:+593963632485";

  const templateKeys = await fetchContentTemplateVariableKeys(client, contentSid);
  const picked = pickVariablesForTemplate(params.variables, templateKeys);

  if (
    templateKeys &&
    templateKeys.length > 0 &&
    Object.keys(picked).length === 0
  ) {
    const hint = templateKeys.join(', ');
    console.log(
      '[Twilio WhatsApp] Skipped: no values for template variable keys. Template expects:',
      hint
    );
    return {
      ok: false,
      reason: 'twilio_error',
      error: `WhatsApp template variables (${hint}) do not match keys sent by the app (use {{1}}…{{n}} or align names).`,
    };
  }

  if (templateKeys !== null && templateKeys.length === 0) {
    try {
      await client.messages.create({
        from,
        to,
        contentSid,
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Twilio WhatsApp send error:', e);
      return { ok: false, reason: 'twilio_error', error: msg };
    }
  }

  const safeContentVariables = buildSafeContentVariables(picked);
  if (!safeContentVariables) {
    console.log('[Twilio WhatsApp] Skipped: invalid_content_variables');
    return { ok: false, reason: 'twilio_error', error: 'Invalid empty/unsafe content variables' };
  }

  // const safeContentVariables = {
  //   "1": "Emilio y Diego",
  //   "2": "000005",
  //   "3": "En mantenimiento",
  //   "4": "En espera",
  //   "5": "SVT-TEST1"
  // };
  
  // Twilio API requires contentVariables as a JSON *string*, not a JS object (error 21656).
  const contentVariablesString = JSON.stringify(safeContentVariables);

  if (templateKeys !== null) {
    console.log('[Twilio WhatsApp] Template variable keys:', templateKeys.join(', '));
  }
  console.log('[Twilio WhatsApp] Sending to:', to, 'from:', from, 'contentSid:', contentSid);
  console.log('[Twilio WhatsApp] contentVariables:', contentVariablesString);

  try {
    await client.messages.create({
      from,
      to,
      contentSid,
      contentVariables: contentVariablesString,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Twilio WhatsApp send error:', e);
    return { ok: false, reason: 'twilio_error', error: msg };
  }
}
