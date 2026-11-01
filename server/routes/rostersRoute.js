import { Router } from 'express';
import { createRoster, listRosters, updateRoster } from '../controllers/rosterController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/', listRosters);
router.post('/', createRoster);
router.patch('/:rosterId', updateRoster);

export default router;
