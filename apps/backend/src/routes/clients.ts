import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePage } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePage('/admin/clients'));

router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.patch('/:id', updateClient);
router.delete('/:id', deleteClient);

export { router as clientRoutes };
