import { Router } from 'express';
import {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllBranches);
router.get('/:id', getBranchById);
router.post('/', createBranch);
router.patch('/:id', updateBranch);
router.delete('/:id', deleteBranch);

export { router as branchRoutes };
