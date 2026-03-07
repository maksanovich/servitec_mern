import express from 'express';
import cors from 'cors';
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
