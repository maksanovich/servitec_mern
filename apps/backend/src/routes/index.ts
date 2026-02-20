import { Router } from 'express';
import { authRoutes } from './auth.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servitec API', version: '1.0.0' });
});

export { apiRouter };
