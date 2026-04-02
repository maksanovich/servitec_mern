import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperAdminOrAdmin } from '../middleware/rbac.js';
import { listOrderMovements } from '../controllers/orderMovementController.js';

const router = Router();

router.use(authMiddleware);
router.use(requireSuperAdminOrAdmin);
router.get('/', listOrderMovements);

export { router as orderMovementsRoutes };
