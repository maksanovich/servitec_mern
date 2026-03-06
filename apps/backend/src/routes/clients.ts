import { Router } from 'express';
import { getClients } from '../controllers/clientController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getClients);

export { router as clientRoutes };
