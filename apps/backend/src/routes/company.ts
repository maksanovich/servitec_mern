import { Router } from 'express';
import { getCompany, updateCompany } from '../controllers/companyController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getCompany);
router.patch('/', authMiddleware, updateCompany);

export { router as companyRoutes };
