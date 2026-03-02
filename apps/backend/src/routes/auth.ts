import { Router } from 'express';
import { login, me, updateProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', authMiddleware, me);
router.patch('/profile', authMiddleware, updateProfile);

export { router as authRoutes };
