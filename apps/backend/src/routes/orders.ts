import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createOrder, deleteOrder, getOrderById, getOrders, patchOrder, printOrderPdf } from '../controllers/orderController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/print-pdf', printOrderPdf);
router.post('/', createOrder);
router.patch('/:id', patchOrder);
router.delete('/:id', deleteOrder);

export { router as orderRoutes };

