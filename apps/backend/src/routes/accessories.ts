import { Router } from 'express';
import {
  getAllAccessories,
  getAccessoryById,
  createAccessory,
  updateAccessory,
  deleteAccessory,
} from '../controllers/accessoryController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePage } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePage('/admin/accessories'));

router.get('/', getAllAccessories);
router.get('/:id', getAccessoryById);
router.post('/', createAccessory);
router.patch('/:id', updateAccessory);
router.delete('/:id', deleteAccessory);

export { router as accessoryRoutes };

