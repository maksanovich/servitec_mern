import { apiFetch } from './client';

export type UploadCategory = 'order-before' | 'order-after' | 'avatar' | 'company-logo';

export async function uploadImage(
  token: string | null,
  file: File,
  category: UploadCategory
): Promise<{ url: string }> {
  if (!token) throw new Error('Not authenticated');
  if (!file) throw new Error('No file selected');

  const form = new FormData();
  form.append('file', file);

  const res = await apiFetch(`/uploads/image?category=${encodeURIComponent(category)}`, {
    method: 'POST',
    token,
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to upload image');
  if (!data.url) throw new Error('Upload succeeded but no URL was returned');

  return data as { url: string };
}

