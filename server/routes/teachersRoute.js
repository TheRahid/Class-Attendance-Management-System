import { Router } from 'express';
import { deleteTeacher, listTeachers, updateTeacherStatus } from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/', listTeachers);
router.patch('/:teacherId/status', updateTeacherStatus);
router.delete('/:teacherId', deleteTeacher);

export default router;
