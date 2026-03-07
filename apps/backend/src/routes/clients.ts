import { Router } from 'express';
import { getClients, createClient, updateClient, deleteClient } from '../controllers/clientController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getClients);
router.post('/', createClient);
router.patch('/:id', updateClient);
router.delete('/:id', deleteClient);

export { router as clientRoutes };
