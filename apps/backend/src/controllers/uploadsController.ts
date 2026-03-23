import { Request, Response } from 'express';

type UploadCategory = 'order-before' | 'order-after' | 'avatar' | 'company-logo';

const ALLOWED_CATEGORIES: Record<UploadCategory, string> = {
  'order-before': 'orders/before',
  'order-after': 'orders/after',
  avatar: 'users/avatars',
  'company-logo': 'company/logos',
};

function extractCategory(req: Request): UploadCategory | null {
  const raw = String(req.query.category ?? '').trim();
  if (!raw) return null;
  if (raw === 'order-before') return 'order-before';
  if (raw === 'order-after') return 'order-after';
  if (raw === 'avatar') return 'avatar';
  if (raw === 'company-logo') return 'company-logo';
  return null;
}

export function uploadImage(req: Request, res: Response): Response {
  const category = extractCategory(req);
  if (!category) return res.status(400).json({ error: 'Invalid category' });

  const file = (req as any).file as { filename?: string } | undefined;
  if (!file?.filename) return res.status(400).json({ error: 'File upload failed' });

  // multer writes the file to: uploads/<folder>/<filename>
  // so we return a relative URL that the frontend can use in <img src="...">
  const folder = ALLOWED_CATEGORIES[category];
  const url = `/uploads/${folder.replaceAll('\\', '/')}/${file.filename}`;
  return res.json({ url });
}

