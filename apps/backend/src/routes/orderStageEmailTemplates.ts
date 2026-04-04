import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { requirePage } from '../middleware/rbac.js';
import {
  deleteOrderStageEmailTemplate,
  listOrderStageEmailTemplates,
  previewOrderStageEmailTemplate,
  upsertOrderStageEmailTemplate,
} from '../controllers/orderStageEmailTemplateController.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePage('/admin/mail'));

router.get('/', listOrderStageEmailTemplates);
router.post('/preview', previewOrderStageEmailTemplate);
router.put('/:stageKey', upsertOrderStageEmailTemplate);
router.delete('/:stageKey', deleteOrderStageEmailTemplate);

export { router as orderStageEmailTemplatesRoutes };
