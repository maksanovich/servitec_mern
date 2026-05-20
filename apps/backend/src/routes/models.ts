import { Router } from 'express';
import {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
} from '../controllers/modelController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePageOrOrderWorkflow } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePageOrOrderWorkflow('/admin/models'));

router.get('/', getAllModels);
router.get('/:id', getModelById);
router.post('/', createModel);
router.patch('/:id', updateModel);
router.delete('/:id', deleteModel);

export { router as modelRoutes };

