import { Router } from 'express';
import {
  listAttendanceRecords
} from '../controllers/attendanceController.js';
import {
  requireAdmin,
  requireAuth
} from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/', listAttendanceRecords);

export default router;