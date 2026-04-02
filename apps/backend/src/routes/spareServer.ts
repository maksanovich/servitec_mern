import { Router } from 'express';
import { getSpareServerByProductId, getSpareServerProductImage, listSpareServer } from '../controllers/spareServerController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireAnyPage } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);
router.use(requireAnyPage(['/admin/spare', '/admin/services']));

router.get('/', listSpareServer);
router.get('/:productosid/image', getSpareServerProductImage);
router.get('/:productosid', getSpareServerByProductId);

export { router as spareServerRoutes };
