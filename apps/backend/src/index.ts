import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { connectDB } from './db/connection.js';
import { seedAdminIfNeeded } from './db/seedAdmin.js';
import { seedRolesIfNeeded } from './db/seedRoles.js';
import { apiRouter } from './routes/index.js';
import { startScheduler } from './jobs/index.js';

const app = express();
const PORT = config.port;

/** Built Vite SPA (`npm run build -w @servitec/frontend`), resolved from compiled `dist/index.js`. */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');
const SPA_INDEX = path.join(FRONTEND_DIST, 'index.html');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images (for <img src="/uploads/...">).
const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
try {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
} catch {
  // ignore; upload route will fail loudly if it can't write
}
app.use('/uploads', express.static(UPLOAD_ROOT));

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'servitec-backend' });
});

// Single-process production: serve Vite build from the same port as /api.
if (fs.existsSync(SPA_INDEX)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(SPA_INDEX);
  });
} else if (process.env.NODE_ENV === 'production') {
  console.warn(
    `[servitec] No frontend at ${FRONTEND_DIST} — run: npm run build -w @servitec/frontend (from repo root)`
  );
}

// Connect DB, seed admin if needed, start server
connectDB()
  .then(() => seedRolesIfNeeded())
  .then(() => seedAdminIfNeeded())
  .then(() => {
    startScheduler();
    app.listen(PORT, '0.0.0.0', () => {
      const spa = fs.existsSync(SPA_INDEX) ? ' + SPA' : '';
      console.log(`Servitec API${spa} listening on http://0.0.0.0:${PORT} (e.g. http://localhost:${PORT})`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
