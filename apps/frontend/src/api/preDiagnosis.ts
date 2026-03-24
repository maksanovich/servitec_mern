import { apiFetch, publicApiFetch } from './client';

export type PreDiagnosisDevice = string;
export type PreDiagnosisSymptom = string;

export interface PreDiagnosisResult {
  probableIssue: string;
  estimateMin: number;
  estimateMax: number;
  etaHours: number;
  confidence: 'high' | 'medium';
}

export interface PreDiagnosisRule {
  id: string;
  device: string;
  symptom: string;
  probableIssue: string;
  estimateMin: number;
  estimateMax: number;
  etaHours: number;
  state: 'active' | 'inactive';
}

export async function getPreDiagnosisRulesPublic(): Promise<{ rules: PreDiagnosisRule[] }> {
  const res = await publicApiFetch('/pre-diagnosis/rules');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch pre-diagnosis rules');
  return data;
}

export async function evaluatePreDiagnosis(payload: {
  device: PreDiagnosisDevice;
  symptom: PreDiagnosisSymptom;
}): Promise<{ result: PreDiagnosisResult }> {
  const res = await publicApiFetch('/pre-diagnosis/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to evaluate diagnosis');
  return data;
}

export async function getPreDiagnosisRulesAdmin(token: string | null): Promise<{ rules: PreDiagnosisRule[] }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/pre-diagnosis/admin/rules', { token });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch rules');
  return data;
}

export async function createPreDiagnosisRule(
  token: string | null,
  payload: Omit<PreDiagnosisRule, 'id'>
): Promise<{ rule: PreDiagnosisRule }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch('/pre-diagnosis/admin/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    token,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create rule');
  return data;
}

export async function updatePreDiagnosisRule(
  token: string | null,
  id: string,
  payload: Omit<PreDiagnosisRule, 'id'>
): Promise<{ rule: PreDiagnosisRule }> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/pre-diagnosis/admin/rules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    token,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update rule');
  return data;
}

export async function deletePreDiagnosisRule(token: string | null, id: string): Promise<void> {
  if (!token) throw new Error('Not authenticated');
  const res = await apiFetch(`/pre-diagnosis/admin/rules/${id}`, {
    method: 'DELETE',
    token,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete rule');
  }
}
