import { Router } from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/roleController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllRoles);
router.get('/:id', getRoleById);
router.post('/', requireSuperAdmin, createRole);
router.patch('/:id', requireSuperAdmin, updateRole);
router.delete('/:id', requireSuperAdmin, deleteRole);

export { router as roleRoutes };
