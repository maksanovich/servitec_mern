import { Router } from 'express';
import {
  getAllUsers,
  getAssignableTechnicians,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireAnyPage, requireSuperAdmin } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

router.get('/technicians', requireAnyPage(['/admin/order', '/admin/income', '/admin/users']), getAssignableTechnicians);

router.use(requireSuperAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export { router as userRoutes };
