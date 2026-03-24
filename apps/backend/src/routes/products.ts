import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requirePage } from '../middleware/rbac.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getProductsPublic,
  updateProduct,
} from '../controllers/productController.js';

const router = Router();

router.get('/public', getProductsPublic);

router.use(authMiddleware);
router.use(requirePage('/admin/products'));

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.patch('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export { router as productRoutes };

