import { Router } from 'express';
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePageOrOrderWorkflow } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePageOrOrderWorkflow('/admin/brand'));

router.get('/', getAllBrands);
router.get('/:id', getBrandById);
router.post('/', createBrand);
router.patch('/:id', updateBrand);
router.delete('/:id', deleteBrand);

export { router as brandRoutes };

