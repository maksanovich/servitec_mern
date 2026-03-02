import { Router } from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/roleController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllRoles);
router.get('/:id', getRoleById);
router.post('/', createRole);
router.patch('/:id', updateRole);
router.delete('/:id', deleteRole);

export { router as roleRoutes };
