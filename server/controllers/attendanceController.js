import mongoose from 'mongoose';
import Attendance from '../models/AttendanceSchema.js';
import Course from '../models/CourseSchema.js';

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
}

async function findOwnedCourse(courseId, teacherId) {
  if (!mongoose.isValidObjectId(courseId)) {
    return null;
  }

  return Course.findOne({
    _id: courseId,
    teacher: teacherId
  });
}

export async function getCourseAttendance(req, res) {
  try {
    const course = await findOwnedCourse(
      req.params.courseId,
      req.account._id
    );

    if (!course) {
      return res.status(404).json({
        message: 'Assigned course not found.'
      });
    }

    const date = req.query.date ||
      new Date().toISOString().slice(0, 10);

    if (!isValidDate(date)) {
      return res.status(400).json({
        message: 'Use a valid date in YYYY-MM-DD format.'
      });
    }

    const attendance = await Attendance.findOne({
      course: course._id,
      date
    });

    res.json({ course, attendance });
  } catch {
    res.status(500).json({
      message: 'Could not load attendance for this course.'
    });
  }
}

export async function updateCourseStudents(req, res) {
  try {
    const course = await findOwnedCourse(
      req.params.courseId,
      req.account._id
    );

    if (!course) {
      return res.status(404).json({
        message: 'Assigned course not found.'
      });
    }

    if (!Array.isArray(req.body.students)) {
      return res.status(400).json({
        message: 'Students must be provided as a list.'
      });
    }

    if (req.body.students.length > 500) {
      return res.status(400).json({
        message: 'A course can have at most 500 students.'
      });
    }

    const students = [];
    const ids = new Set();

    for (const item of req.body.students) {
      const studentId =
        typeof item.studentId === 'string'
          ? item.studentId.trim()
          : '';

      const name =
        typeof item.name === 'string'
          ? item.name.trim()
          : '';

      const department =
        typeof item.department === 'string'
          ? item.department.trim()
          : '';

      const normalizedId = studentId.toLowerCase();

      if (
        !studentId ||
        studentId.length > 30 ||
        !name ||
        name.length > 100 ||
        department.length > 80
      ) {
        return res.status(400).json({
          message: 'Each student needs a valid ID and name.'
        });
      }

      if (ids.has(normalizedId)) {
        return res.status(400).json({
          message: `Student ID ${studentId} appears more than once.`
        });
      }

      ids.add(normalizedId);
      students.push({ studentId, name, department });
    }

    course.students = students;
    await course.save();

    res.json({ students: course.students });
  } catch {
    res.status(500).json({
      message: 'Could not save the course student list.'
    });
  }
}

export async function saveAttendance(req, res) {
  try {
    const course = await findOwnedCourse(
      req.params.courseId,
      req.account._id
    );

    if (!course) {
      return res.status(404).json({
        message: 'Assigned course not found.'
      });
    }

    const { date, entries } = req.body;

    if (!isValidDate(date)) {
      return res.status(400).json({
        message: 'Use a valid date in YYYY-MM-DD format.'
      });
    }

    if (
      !Array.isArray(entries) ||
      entries.length !== course.students.length
    ) {
      return res.status(400).json({
        message: 'Mark attendance for every student on the course list.'
      });
    }

    const studentsById = new Map(
      course.students.map(student => [
        student.studentId.toLowerCase(),
        student
      ])
    );

    const seen = new Set();
    const savedEntries = [];

    for (const entry of entries) {
      const studentId =
        typeof entry.studentId === 'string'
          ? entry.studentId.trim()
          : '';

      const normalizedId = studentId.toLowerCase();
      const student = studentsById.get(normalizedId);

      if (
        !student ||
        seen.has(normalizedId) ||
        !['present', 'absent'].includes(entry.status)
      ) {
        return res.status(400).json({
          message: 'Attendance entries do not match the current student list.'
        });
      }

      seen.add(normalizedId);

      savedEntries.push({
        studentId: student.studentId,
        name: student.name,
        status: entry.status
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { course: course._id, date },
      {
        $set: {
          teacher: req.account._id,
          entries: savedEntries
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json({
      attendance,
      message: 'Attendance saved.'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Attendance for this date is being saved. Please retry.'
      });
    }

    res.status(500).json({
      message: 'Could not save attendance.'
    });
  }
}

export async function listAttendanceRecords(req, res) {
  try {
    const filter = {};

    if (req.query.courseId) {
      if (!mongoose.isValidObjectId(req.query.courseId)) {
        return res.status(400).json({
          message: 'Invalid course ID.'
        });
      }

      filter.course = req.query.courseId;
    }

    if (req.query.from || req.query.to) {
      const from = req.query.from || '0000-01-01';
      const to = req.query.to || '9999-12-31';

      if (!isValidDate(from) || !isValidDate(to) || from > to) {
        return res.status(400).json({
          message: 'Choose a valid date range.'
        });
      }

      filter.date = { $gte: from, $lte: to };
    }

    const records = await Attendance.find(filter)
      .populate('course', 'code name department semester')
      .populate('teacher', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.json({ records });
  } catch {
    res.status(500).json({
      message: 'Could not load attendance records.'
    });
  }
}