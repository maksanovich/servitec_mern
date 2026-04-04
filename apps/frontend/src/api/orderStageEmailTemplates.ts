import { apiFetch } from './client';

export type OrderEmailPlaceholder = { key: string; description: string };

export type OrderStageEmailTemplateRow = {
  id: string;
  stageKey: string;
  subjectTemplate: string;
  bodyTemplate: string;
};

export async function listOrderStageEmailTemplates(token: string | null): Promise<{
  placeholders: OrderEmailPlaceholder[];
  templates: OrderStageEmailTemplateRow[];
}> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/order-stage-email-templates', { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to load email templates');
  return data;
}

export async function upsertOrderStageEmailTemplate(
  token: string | null,
  stageKey: string,
  payload: { subjectTemplate: string; bodyTemplate: string }
): Promise<{ template: OrderStageEmailTemplateRow }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/order-stage-email-templates/${encodeURIComponent(stageKey)}`, {
    method: 'PUT',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to save template');
  return data;
}

export async function previewOrderStageEmailTemplate(
  token: string | null,
  payload: { stageKey: string; subjectTemplate: string; bodyTemplate: string }
): Promise<{ subject: string; text: string }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/order-stage-email-templates/preview', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Failed to preview');
  return data;
}
