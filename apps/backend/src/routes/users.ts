import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', requireSuperAdmin, createUser);
router.patch('/:id', requireSuperAdmin, updateUser);
router.delete('/:id', requireSuperAdmin, deleteUser);

export { router as userRoutes };
