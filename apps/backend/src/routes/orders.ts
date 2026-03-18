import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createOrder, getOrders } from '../controllers/orderController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.post('/', createOrder);

export { router as orderRoutes };

