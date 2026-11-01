import mongoose from 'mongoose';
import Attendance from '../models/AttendanceSchema.js';
import Course from '../models/CourseSchema.js';
import StudentRoster from '../models/StudentRoster.js';

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

async function findTeacherAssignment(courseId, teacherId, assignmentId) {
  if (!mongoose.isValidObjectId(courseId)) return null;
  const course = await Course.findById(courseId);
  if (!course) return null;

  if (assignmentId === 'legacy' && course.teacher && String(course.teacher) === String(teacherId)) {
    return {
      course,
      assignment: {
        _id: 'legacy', teacher: course.teacher, semester: course.semester || '',
        section: course.section || '', roster: course.roster || null
      }
    };
  }

  if (!mongoose.isValidObjectId(assignmentId)) return null;
  const assignment = course.assignments.id(assignmentId);
  if (!assignment || String(assignment.teacher) !== String(teacherId)) return null;
  return { course, assignment };
}

async function assignmentData(courseId, teacherId, assignmentId) {
  const found = await findTeacherAssignment(courseId, teacherId, assignmentId);
  if (!found) return null;
  const roster = found.assignment.roster ? await StudentRoster.findById(found.assignment.roster) : null;
  return { ...found, roster };
}

function courseWithAssignment(course, assignment) {
  return {
    ...course.toObject(),
    semester: assignment.semester || '',
    section: assignment.section || ''
  };
}

export async function getCourseAttendance(req, res) {
  try {
    const assignmentId = req.query.assignmentId || 'legacy';
    const result = await assignmentData(req.params.courseId, req.account._id, assignmentId);
    if (!result) return res.status(404).json({ message: 'Assigned course section not found.' });
    const { course, assignment, roster } = result;
    if (!roster) return res.status(409).json({ message: 'No student list is assigned to this section. Ask an admin to assign one.' });

    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (!isValidDate(date)) return res.status(400).json({ message: 'Use a valid date in YYYY-MM-DD format.' });

    const attendance = await Attendance.findOne({ course: course._id, assignmentId: String(assignment._id), date });
    res.json({ course: courseWithAssignment(course, assignment), assignment, roster, attendance });
  } catch {
    res.status(500).json({ message: 'Could not load attendance for this course section.' });
  }
}

export async function saveAttendance(req, res) {
  try {
    const assignmentId = req.body.assignmentId || req.query.assignmentId || 'legacy';
    const result = await assignmentData(req.params.courseId, req.account._id, assignmentId);
    if (!result) return res.status(404).json({ message: 'Assigned course section not found.' });
    const { course, assignment, roster } = result;
    if (!roster) return res.status(409).json({ message: 'No student list is assigned to this section. Ask an admin to assign one.' });

    const { date, entries } = req.body;
    if (!isValidDate(date)) return res.status(400).json({ message: 'Use a valid date in YYYY-MM-DD format.' });
    if (!Array.isArray(entries) || entries.length !== roster.students.length) {
      return res.status(400).json({ message: 'Mark attendance for every student in the assigned student list.' });
    }

    const studentsById = new Map(roster.students.map(student => [student.studentId.toLowerCase(), student]));
    const seen = new Set();
    const savedEntries = [];
    for (const entry of entries) {
      const studentId = typeof entry?.studentId === 'string' ? entry.studentId.trim() : '';
      const normalizedId = studentId.toLowerCase();
      const student = studentsById.get(normalizedId);
      if (!student || seen.has(normalizedId) || !['present', 'absent'].includes(entry.status)) {
        return res.status(400).json({ message: 'Attendance entries do not match the assigned student list.' });
      }
      seen.add(normalizedId);
      savedEntries.push({ studentId: student.studentId, name: student.name, status: entry.status });
    }

    const attendance = await Attendance.create({
      course: course._id,
      assignmentId: String(assignment._id),
      roster: roster._id,
      teacher: req.account._id,
      semester: assignment.semester || '',
      section: assignment.section || '',
      date,
      entries: savedEntries
    });
    res.json({ attendance, message: 'Attendance saved.' });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Attendance has already been recorded for this section and date. It cannot be submitted again.' });
    res.status(500).json({ message: 'Could not save attendance.' });
  }
}

async function readAttendanceRecords(filter) {
  const docs = await Attendance.find(filter)
    .populate('course', 'code name department assignments semester section')
    .populate('teacher', 'name email')
    .sort({ date: -1, createdAt: -1 });
  return docs.map(doc => {
    const record = doc.toObject();
    const assignment = record.course?.assignments?.find(item => String(item._id) === record.assignmentId);
    record.assignment = {
      ...(assignment || {}),
      semester: record.semester || assignment?.semester || record.course?.semester || '',
      section: record.section || assignment?.section || record.course?.section || ''
    };
    return record;
  });
}

function addDateAndCourseFilters(req, res, filter) {
  if (req.query.courseId) {
    if (!mongoose.isValidObjectId(req.query.courseId)) {
      res.status(400).json({ message: 'Invalid course ID.' });
      return false;
    }
    filter.course = req.query.courseId;
  }
  if (req.query.from || req.query.to) {
    const from = req.query.from || '0000-01-01';
    const to = req.query.to || '9999-12-31';
    if (!isValidDate(from) || !isValidDate(to) || from > to) {
      res.status(400).json({ message: 'Choose a valid date range.' });
      return false;
    }
    filter.date = { $gte: from, $lte: to };
  }
  return true;
}

export async function listAttendanceRecords(req, res) {
  try {
    const filter = {};
    if (!addDateAndCourseFilters(req, res, filter)) return;
    res.json({ records: await readAttendanceRecords(filter) });
  } catch {
    res.status(500).json({ message: 'Could not load attendance records.' });
  }
}

async function findStudentAttendanceHistory(studentId, teacherId = null) {
  const normalizedId = studentId.trim();
  const escapedId = normalizedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const studentIdPattern = new RegExp(`^${escapedId}$`, 'i');
  const rosters = await StudentRoster.find({ 'students.studentId': studentIdPattern });
  let studentLists = rosters.flatMap(roster => {
    const student = roster.students.find(item => studentIdPattern.test(item.studentId));
    return student ? [{ roster, student }] : [];
  });

  if (teacherId) {
    const assignedCourses = await Course.find({
      $or: [{ 'assignments.teacher': teacherId }, { teacher: teacherId }]
    });
    const allowedRosterIds = new Set();
    for (const course of assignedCourses) {
      for (const assignment of course.assignments) {
        if (String(assignment.teacher) === String(teacherId) && assignment.roster) {
          allowedRosterIds.add(String(assignment.roster));
        }
      }
      if (String(course.teacher) === String(teacherId) && course.roster) {
        allowedRosterIds.add(String(course.roster));
      }
    }
    studentLists = studentLists.filter(item => allowedRosterIds.has(String(item.roster._id)));
  }

  if (!studentLists.length) return { student: { studentId: normalizedId, names: [], listCount: 0 }, history: [] };

  const rosterById = new Map(studentLists.map(item => [String(item.roster._id), item]));
  const docs = await Attendance.find({ 'entries.studentId': studentIdPattern })
    .populate('course', 'code name department assignments semester section roster teacher')
    .populate('teacher', 'name email')
    .sort({ date: -1, createdAt: -1 });

  const history = [];
  for (const doc of docs) {
    const record = doc.toObject();
    const course = record.course;
    if (!course) continue;
    const assignment = course.assignments?.find(item => String(item._id) === record.assignmentId);
    const recordRosterId = record.roster || assignment?.roster ||
      (record.assignmentId === 'legacy' ? course.roster : null);
    const matchedList = rosterById.get(String(recordRosterId || ''));
    if (!matchedList) continue;

    if (teacherId) {
      const teacherHasAssignment = course.assignments?.some(item =>
        String(item.teacher) === String(teacherId) && String(item.roster || '') === String(matchedList.roster._id)
      );
      const teacherHasLegacyAssignment = record.assignmentId === 'legacy' &&
        String(course.teacher || '') === String(teacherId) && String(course.roster || '') === String(matchedList.roster._id);
      if (!teacherHasAssignment && !teacherHasLegacyAssignment) continue;
    }

    const entry = record.entries.find(item => item.studentId.toLowerCase() === matchedList.student.studentId.toLowerCase());
    if (!entry) continue;
    history.push({
      _id: record._id,
      date: record.date,
      status: entry.status,
      course: { _id: course._id, code: course.code, name: course.name, department: course.department },
      department: matchedList.roster.department,
      semester: record.semester || assignment?.semester || course.semester || matchedList.roster.semester,
      section: record.section || assignment?.section || course.section || matchedList.roster.section,
      teacher: record.teacher?.name || 'Former teacher'
    });
  }

  return {
    student: {
      studentId: normalizedId,
      names: [...new Set(studentLists.map(item => item.student.name))],
      listCount: studentLists.length
    },
    history
  };
}

export async function getStudentAttendanceHistory(req, res) {
  try {
    const { studentId } = req.query;
    if (typeof studentId !== 'string' || !studentId.trim() || studentId.trim().length > 30) {
      return res.status(400).json({ message: 'Enter a valid student ID.' });
    }
    res.json(await findStudentAttendanceHistory(studentId));
  } catch {
    res.status(500).json({ message: 'Could not load the student attendance history.' });
  }
}

export async function getTeacherStudentAttendanceHistory(req, res) {
  try {
    const { studentId } = req.query;
    if (typeof studentId !== 'string' || !studentId.trim() || studentId.trim().length > 30) {
      return res.status(400).json({ message: 'Enter a valid student ID.' });
    }
    const result = await findStudentAttendanceHistory(studentId, req.account._id);
    if (!result.student.listCount) {
      return res.status(404).json({ message: 'No student with this ID was found in your assigned courses.' });
    }
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Could not load the student attendance history.' });
  }
}

export async function listTeacherAttendanceRecords(req, res) {
  try {
    const filter = { teacher: req.account._id };
    if (!addDateAndCourseFilters(req, res, filter)) return;
    res.json({ records: await readAttendanceRecords(filter) });
  } catch {
    res.status(500).json({ message: 'Could not load your attendance records.' });
  }
}
