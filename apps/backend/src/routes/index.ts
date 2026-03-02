import { Router } from 'express';
import { authRoutes } from './auth.js';
import { companyRoutes } from './company.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/company', companyRoutes);

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servitec API', version: '1.0.0' });
});

export { apiRouter };
