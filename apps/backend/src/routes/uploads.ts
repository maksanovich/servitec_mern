import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { authMiddleware } from '../middleware/auth.js';
import { requireUploadPageAccess } from '../middleware/rbac.js';
import { uploadImage } from '../controllers/uploadsController.js';

type UploadCategory = 'order-before' | 'order-after' | 'avatar' | 'company-logo';

const MAX_UPLOAD_BYTES = 150 * 1024 * 1024; // 150MB (>= 100MB requirement)
const ACCEPT_MIME_PREFIX = 'image/';

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

const ALLOWED_CATEGORIES: Record<UploadCategory, string> = {
  'order-before': 'orders/before',
  'order-after': 'orders/after',
  avatar: 'users/avatars',
  'company-logo': 'company/logos',
};

function extractCategory(req: any): UploadCategory | null {
  const raw = String(req.query.category ?? '').trim();
  if (raw === 'order-before') return 'order-before';
  if (raw === 'order-after') return 'order-after';
  if (raw === 'avatar') return 'avatar';
  if (raw === 'company-logo') return 'company-logo';
  return null;
}

const storage = multer.diskStorage({
  destination: (req: any, _file: any, cb: any) => {
    const category = extractCategory(req);
    if (!category) return cb(new Error('Invalid category'));
    const folder = ALLOWED_CATEGORIES[category];
    const dest = path.join(UPLOAD_ROOT, folder);
    try {
      fs.mkdirSync(dest, { recursive: true });
    } catch {
      // fallthrough - multer will error on write
    }
    cb(null, dest);
  },
  filename: (_req: any, file: any, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext && ext.length <= 10 ? ext : '';
    const rand = Math.random().toString(16).slice(2);
    const ts = Date.now();
    cb(null, `${ts}-${rand}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!file.mimetype || !file.mimetype.startsWith(ACCEPT_MIME_PREFIX)) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

const router = Router();

router.use(authMiddleware);
router.post('/image', requireUploadPageAccess, upload.single('file'), uploadImage);

// Basic error formatting for multer failures (file size, filter, etc.)
router.use((err: any, _req: any, res: any, _next: any) => {
  const message = typeof err?.message === 'string' ? err.message : 'Upload failed';
  if (message.toLowerCase().includes('file too large') || message.toLowerCase().includes('max')) {
    return res.status(413).json({ error: `File is too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB)` });
  }
  return res.status(400).json({ error: message });
});

export { router as uploadsRoutes };

