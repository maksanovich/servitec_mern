import { Router } from 'express';
import { authRoutes } from './auth.js';
import { branchRoutes } from './branches.js';
import { clientRoutes } from './clients.js';
import { companyRoutes } from './company.js';
import { roleRoutes } from './roles.js';
import { userRoutes } from './users.js';
import { brandRoutes } from './brands.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/branches', branchRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/company', companyRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/brands', brandRoutes);

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servitec API', version: '1.0.0' });
});

export { apiRouter };
