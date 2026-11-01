import mongoose from 'mongoose';
import Teacher from '../models/TeacherSchema.js';
import Course from '../models/CourseSchema.js';
import Attendance from '../models/AttendanceSchema.js';

export async function listTeachers(_req, res) {
  const teachers = await Teacher.find({ role: 'teacher' })
    .select('name email department status createdAt')
    .sort({ createdAt: -1 });
  res.json({ teachers });
}

export async function updateTeacherStatus(req, res) {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active or suspended.' });
  }
  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.teacherId, role: 'teacher' },
    { status },
    { new: true, runValidators: true }
  ).select('name email department status');
  if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });
  res.json({ teacher });
}

export async function deleteTeacher(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.teacherId)) {
      return res.status(400).json({ message: 'Invalid teacher ID.' });
    }

    const teacher = await Teacher.findOne({ _id: req.params.teacherId, role: 'teacher' });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found.' });

    const courses = await Course.find({
      $or: [
        { 'assignments.teacher': teacher._id },
        { teacher: teacher._id }
      ]
    });

    for (const course of courses) {
      for (const assignment of course.assignments.filter(item => String(item.teacher) === String(teacher._id))) {
        await Attendance.updateMany(
          { course: course._id, assignmentId: String(assignment._id) },
          {
            $set: {
              roster: assignment.roster || null,
              semester: assignment.semester || '',
              section: assignment.section || ''
            }
          }
        );
      }

      if (String(course.teacher) === String(teacher._id)) {
        await Attendance.updateMany(
          { course: course._id, assignmentId: 'legacy' },
          {
            $set: {
              roster: course.roster || null,
              semester: course.semester || '',
              section: course.section || ''
            }
          }
        );
        course.teacher = null;
        course.roster = null;
        course.semester = '';
        course.section = '';
      }

      course.assignments.pull({ teacher: teacher._id });
      await course.save();
    }

    await teacher.deleteOne();
    res.json({ message: 'Teacher account deleted. Course assignments were removed; attendance history was kept.' });
  } catch {
    res.status(500).json({ message: 'Could not delete the teacher account.' });
  }
}
