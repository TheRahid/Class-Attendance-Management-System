import { Router } from 'express';
import {
  createCourse,
  deleteCourse,
  listAdminCourses,
  listTeacherCourses,
  updateCourse
} from '../controllers/courseController.js';
import {
  getCourseAttendance,
  saveAttendance,
  updateCourseStudents
} from '../controllers/attendanceController.js';
import {
  requireAdmin,
  requireAuth
} from '../middleware/authMiddleware.js';

const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get('/', listAdminCourses);
adminRouter.post('/', createCourse);
adminRouter.patch('/:courseId', updateCourse);
adminRouter.delete('/:courseId', deleteCourse);

const teacherRouter = Router();

teacherRouter.use(requireAuth);
teacherRouter.use((req, res, next) => {
  if (req.account.role !== 'teacher') {
    return res.status(403).json({
      message: 'Teacher access is required.'
    });
  }

  next();
});

teacherRouter.get('/', listTeacherCourses);
teacherRouter.get('/:courseId/attendance', getCourseAttendance);
teacherRouter.put('/:courseId/students', updateCourseStudents);
teacherRouter.put('/:courseId/attendance', saveAttendance);

export { adminRouter, teacherRouter };