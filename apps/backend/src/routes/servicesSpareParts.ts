import { Router } from 'express';
import {
  getAllServicesSpareParts,
  getServiceSparePartById,
  createServiceSparePart,
  updateServiceSparePart,
  deleteServiceSparePart,
} from '../controllers/serviceSparePartController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePageOrOrderWorkflow } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePageOrOrderWorkflow('/admin/services'));

router.get('/', getAllServicesSpareParts);
router.get('/:id', getServiceSparePartById);
router.post('/', createServiceSparePart);
router.patch('/:id', updateServiceSparePart);
router.delete('/:id', deleteServiceSparePart);

export { router as servicesSparePartsRoutes };

