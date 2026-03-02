import { Router } from 'express';
import { authRoutes } from './auth.js';
import { companyRoutes } from './company.js';
import { roleRoutes } from './roles.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/company', companyRoutes);
apiRouter.use('/roles', roleRoutes);

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servitec API', version: '1.0.0' });
});

export { apiRouter };
