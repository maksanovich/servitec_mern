import { Router } from 'express';
import { getCompany, updateCompany } from '../controllers/companyController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePage } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, requirePage('/admin/company'), getCompany);
router.patch('/', authMiddleware, requirePage('/admin/company'), updateCompany);

export { router as companyRoutes };
