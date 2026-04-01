import { Router } from 'express';
import { authRoutes } from './auth.js';
import { clientRoutes } from './clients.js';
import { companyRoutes } from './company.js';
import { roleRoutes } from './roles.js';
import { userRoutes } from './users.js';
import { brandRoutes } from './brands.js';
import { modelRoutes } from './models.js';
import { accessoryRoutes } from './accessories.js';
import { orderRoutes } from './orders.js';
import { servicesSparePartsRoutes } from './servicesSpareParts.js';
import { spareServerRoutes } from './spareServer.js';
import { uploadsRoutes } from './uploads.js';
import { productRoutes } from './products.js';
import { preDiagnosisRoutes } from './preDiagnosis.js';
import { orderProgressStagesRoutes } from './orderProgressStages.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/clients', clientRoutes);
apiRouter.use('/company', companyRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/brands', brandRoutes);
apiRouter.use('/models', modelRoutes);
apiRouter.use('/accessories', accessoryRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/order-progress-stages', orderProgressStagesRoutes);
apiRouter.use('/services-spare-parts', servicesSparePartsRoutes);
apiRouter.use('/spare-server', spareServerRoutes);
apiRouter.use('/uploads', uploadsRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/pre-diagnosis', preDiagnosisRoutes);

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servitec API', version: '1.0.0' });
});

export { apiRouter };
