import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config/index.js';
import { connectDB } from './db/connection.js';
import { seedAdminIfNeeded } from './db/seedAdmin.js';
import { seedRolesIfNeeded } from './db/seedRoles.js';
import { apiRouter } from './routes/index.js';
import { startScheduler } from './jobs/index.js';

const app = express();
const PORT = config.port;

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

// Connect DB, seed admin if needed, start server
connectDB()
  .then(() => seedRolesIfNeeded())
  .then(() => seedAdminIfNeeded())
  .then(() => {
    startScheduler();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running at http://localhost:${PORT}`);
      console.log(`  (Network: http://45.89.126.242:${PORT})`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
