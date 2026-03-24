import { Router } from 'express';
import {
  createPreDiagnosisRule,
  deletePreDiagnosisRule,
  evaluatePreDiagnosis,
  getPreDiagnosisRulesAdmin,
  getPreDiagnosisRulesPublic,
  updatePreDiagnosisRule,
} from '../controllers/preDiagnosisController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePage } from '../middleware/rbac.js';

const router = Router();

router.get('/rules', getPreDiagnosisRulesPublic);
router.post('/evaluate', evaluatePreDiagnosis);

router.use(authMiddleware);
router.use(requirePage('/admin/pre-diagnosis'));
router.get('/admin/rules', getPreDiagnosisRulesAdmin);
router.post('/admin/rules', createPreDiagnosisRule);
router.patch('/admin/rules/:id', updatePreDiagnosisRule);
router.delete('/admin/rules/:id', deletePreDiagnosisRule);

export { router as preDiagnosisRoutes };
