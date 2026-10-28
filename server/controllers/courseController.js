import mongoose from 'mongoose';
import Course from '../models/CourseSchema.js';
import Teacher from '../models/TeacherSchema.js';
import Attendance from '../models/AttendanceSchema.js';
const courseFields = [
  'code',
  'name',
  'department',
  'semester',
  'classTime',
  'room'
];

function cleanCourseInput(body = {}) {
  return Object.fromEntries(
    courseFields.map(field => [
      field,
      typeof body[field] === 'string' ? body[field].trim() : ''
    ])
  );
}

async function validAssignedTeacher(teacherId) {
  if (!mongoose.isValidObjectId(teacherId)) {
    return false;
  }

  return Boolean(
    await Teacher.exists({
      _id: teacherId,
      role: 'teacher',
      status: 'active'
    })
  );
}

export async function listAdminCourses(_req, res) {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email department')
      .sort({ department: 1, code: 1 });

    res.json({ courses });
  } catch {
    res.status(500).json({ message: 'Could not load courses.' });
  }
}

export async function createCourse(req, res) {
  try {
    const data = cleanCourseInput(req.body);

    if (courseFields.slice(0, 4).some(field => !data[field])) {
      return res.status(400).json({
        message: 'Course code, name, department, and semester are required.'
      });
    }

    if (!req.body.teacher || !(await validAssignedTeacher(req.body.teacher))) {
      return res.status(400).json({
        message: 'Choose an approved teacher for this course.'
      });
    }

    const course = await Course.create({
      ...data,
      teacher: req.body.teacher
    });

    await course.populate('teacher', 'name email department');

    res.status(201).json({ course });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A course with this code already exists.'
      });
    }

    res.status(500).json({ message: 'Could not create the course.' });
  }
}

export async function updateCourse(req, res) {
  try {
    const data = cleanCourseInput(req.body);

    if (courseFields.slice(0, 4).some(field => !data[field])) {
      return res.status(400).json({
        message: 'Course code, name, department, and semester are required.'
      });
    }

    if (!req.body.teacher || !(await validAssignedTeacher(req.body.teacher))) {
      return res.status(400).json({
        message: 'Choose an approved teacher for this course.'
      });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.courseId,
      { ...data, teacher: req.body.teacher },
      { new: true, runValidators: true }
    ).populate('teacher', 'name email department');

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    res.json({ course });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A course with this code already exists.'
      });
    }

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid course ID.' });
    }

    res.status(500).json({ message: 'Could not update the course.' });
  }
}

export async function deleteCourse(req, res) {
  try {
    const hasAttendance = await Attendance.exists({
      course: req.params.courseId
    });

    if (hasAttendance) {
      return res.status(409).json({
        message: 'This course has attendance records and cannot be deleted.'
      });
    }

    const course = await Course.findByIdAndDelete(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    res.json({ message: 'Course deleted.' });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: 'Invalid course ID.' });
    }

    res.status(500).json({
      message: 'Could not delete the course.'
    });
  }
}

export async function listTeacherCourses(req, res) {
  try {
    const courses = await Course.find({
      teacher: req.account._id
    })
      .populate('teacher', 'name email department')
      .sort({ department: 1, code: 1 });

    res.json({ courses });
  } catch {
    res.status(500).json({ message: 'Could not load your courses.' });
  }
}