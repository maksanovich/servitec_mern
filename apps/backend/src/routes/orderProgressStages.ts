import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requirePage } from '../middleware/rbac.js';
import {
  createOrderProgressStage,
  deleteOrderProgressStage,
  getOrderProgressStagesAdmin,
  getOrderProgressStagesPublic,
  updateOrderProgressStage,
} from '../controllers/orderProgressStageController.js';

const router = Router();

router.get('/public', getOrderProgressStagesPublic);

router.use(authMiddleware);
router.use(requirePage('/admin/order'));

router.get('/', getOrderProgressStagesAdmin);
router.post('/', createOrderProgressStage);
router.patch('/:id', updateOrderProgressStage);
router.delete('/:id', deleteOrderProgressStage);

export { router as orderProgressStagesRoutes };

