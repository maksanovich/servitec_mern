import { Router } from 'express';
import {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.post('/', requireSuperAdmin, createBranch);
router.patch('/:id', requireSuperAdmin, updateBranch);
router.delete('/:id', requireSuperAdmin, deleteBranch);

export { router as branchRoutes };
