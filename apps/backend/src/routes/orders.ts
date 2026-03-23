import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requireAnyPage } from '../middleware/rbac.js';
import {
  createOrder,
  deleteOrder,
  getOrderById,
  getOrders,
  getOrderTrackByCode,
  patchOrder,
  printOrderPdf,
} from '../controllers/orderController.js';

const router = Router();

router.get('/track/:code', getOrderTrackByCode);

router.use(authMiddleware);
router.use(requireAnyPage(['/admin/order', '/admin/income']));

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.get('/:id/print-pdf', printOrderPdf);
router.post('/', createOrder);
router.patch('/:id', patchOrder);
router.delete('/:id', deleteOrder);

export { router as orderRoutes };

