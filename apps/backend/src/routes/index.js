import { Router } from 'express';

const apiRouter = Router();

// Placeholder - add route modules here
// apiRouter.use('/orders', orderRoutes);
// apiRouter.use('/track', trackRoutes);
// apiRouter.use('/blog', blogRoutes);

apiRouter.get('/', (req, res) => {
  res.json({ message: 'Servitec API', version: '1.0.0' });
});

export { apiRouter };
