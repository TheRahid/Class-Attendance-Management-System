import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  listAdminCourses,
  listTeacherCourses,
  updateCourseAssignments,
  updateCourse
} from '../controllers/courseController.js';
import {
  getCourseAttendance,
  getTeacherStudentAttendanceHistory,
  saveAttendance,
  listTeacherAttendanceRecords
} from '../controllers/attendanceController.js';
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js';

const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get('/', listAdminCourses);
adminRouter.post('/', createCourse);
adminRouter.patch('/:courseId', updateCourse);
adminRouter.put('/:courseId/assignments', updateCourseAssignments);
adminRouter.delete('/:courseId', deleteCourse);

const teacherRouter = Router();
teacherRouter.use(requireAuth);
teacherRouter.use((req, res, next) => {
  if (req.account.role !== 'teacher') return res.status(403).json({ message: 'Teacher access is required.' });
  next();
});
teacherRouter.get('/', listTeacherCourses);
teacherRouter.get('/student-history', getTeacherStudentAttendanceHistory);
teacherRouter.get('/attendance', listTeacherAttendanceRecords);
teacherRouter.get('/:courseId/attendance', getCourseAttendance);
teacherRouter.put('/:courseId/attendance', saveAttendance);

export { adminRouter, teacherRouter };
