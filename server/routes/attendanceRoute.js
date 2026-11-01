import { Router } from 'express';
import { getStudentAttendanceHistory, listAttendanceRecords } from '../controllers/attendanceController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/student-history', getStudentAttendanceHistory);
router.get('/', listAttendanceRecords);

export default router;
