import mongoose from 'mongoose';
import Course from '../models/CourseSchema.js';
import Teacher from '../models/TeacherSchema.js';
import Attendance from '../models/AttendanceSchema.js';
import StudentRoster from '../models/StudentRoster.js';

const requiredCourseFields = ['code', 'name', 'department'];
const validSemesters = Array.from({ length: 8 }, (_, index) => `${index + 1}${['st', 'nd', 'rd'][index] || 'th'} semester`);
const clean = value => typeof value === 'string' ? value.trim() : '';
function cleanCourseInput(body = {}) {
  return { code: clean(body.code).toUpperCase(), name: clean(body.name), department: clean(body.department) };
}

async function validAssignedTeacher(teacherId) {
  if (!mongoose.isValidObjectId(teacherId)) return false;
  return Boolean(await Teacher.exists({ _id: teacherId, role: 'teacher', status: 'active' }));
}

function normalizeLegacyAssignments(course) {
  const result = course.toObject ? course.toObject() : { ...course };
  if (!result.assignments?.length && result.teacher) {
    result.assignments = [{
      _id: 'legacy', teacher: result.teacher, semester: result.semester || '',
      section: result.section || '', roster: result.roster || null,
      classTime: result.classTime || ''
    }];
  }
  return result;
}

async function validateAssignments(input) {
  if (!Array.isArray(input)) return { error: 'Course assignments must be a list.' };
  if (input.length > 50) return { error: 'A course can have up to 50 teacher-section assignments.' };

  const assignments = [];
  const seen = new Set();
  for (const item of input) {
    const teacherId = clean(item?.teacher);
    const semester = clean(item?.semester);
    const section = clean(item?.section);
    const rosterId = clean(item?.roster);
    const classTime = clean(item?.classTime);

    if (!await validAssignedTeacher(teacherId)) {
      return { error: 'Choose an approved teacher for every assignment.' };
    }
    if (!validSemesters.includes(semester)) {
      return { error: 'Choose a semester from 1st to 8th for every assignment.' };
    }
    if (semester.length > 40 || section.length > 10) {
      return { error: 'Semester or section is too long.' };
    }
    if (classTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(classTime)) {
      return { error: 'Enter a valid class time.' };
    }

    let roster = null;
    if (rosterId) {
      if (!mongoose.isValidObjectId(rosterId)) return { error: 'Choose a valid student list.' };
      roster = await StudentRoster.findById(rosterId);
      if (!roster) return { error: 'The selected student list was not found.' };
      if (section && section.toLowerCase() !== roster.section.toLowerCase()) {
        return { error: 'The selected student list does not match the assignment section.' };
      }
    }

    const resolvedSemester = semester;
    const resolvedSection = roster?.section || section;
    // One teacher may handle multiple lists for the same course and section.
    // Prevent only an exact repeated list assignment; without a roster, fall
    // back to the teacher + semester + section combination.
    const key = roster
      ? `${teacherId}:roster:${roster._id}`
      : `${teacherId}:group:${resolvedSemester.toLowerCase()}:${resolvedSection.toLowerCase()}`;
    if (seen.has(key)) return { error: 'The same teacher and section are listed more than once.' };
    seen.add(key);
    assignments.push({
      teacher: teacherId,
      semester: resolvedSemester,
      section: resolvedSection,
      roster: roster?._id || null,
      classTime
    });
  }
  return { assignments };
}

const populateAssignments = query => query
  .populate('assignments.teacher', 'name email department')
  .populate('assignments.roster', 'department batchNumber section students')
  .populate('teacher', 'name email department')
  .populate('roster', 'department batchNumber section students');

export async function listAdminCourses(_req, res) {
  try {
    const docs = await populateAssignments(Course.find()).sort({ department: 1, code: 1 });
    res.json({ courses: docs.map(normalizeLegacyAssignments) });
  } catch {
    res.status(500).json({ message: 'Could not load courses.' });
  }
}

export async function createCourse(req, res) {
  try {
    const data = cleanCourseInput(req.body);
    if (requiredCourseFields.some(field => !data[field])) {
      return res.status(400).json({ message: 'Course code, name, and department are required.' });
    }
    const course = await Course.create(data);
    const populatedCourse = await populateAssignments(Course.findById(course._id));
    res.status(201).json({ course: normalizeLegacyAssignments(populatedCourse) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A course with this code already exists.' });
    res.status(500).json({ message: 'Could not create the course.' });
  }
}

export async function updateCourse(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.courseId)) return res.status(400).json({ message: 'Invalid course ID.' });
    const data = cleanCourseInput(req.body);
    if (requiredCourseFields.some(field => !data[field])) {
      return res.status(400).json({ message: 'Course code, name, and department are required.' });
    }
    const course = await populateAssignments(Course.findByIdAndUpdate(
      req.params.courseId,
      data,
      { new: true, runValidators: true }
    ));
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ course: normalizeLegacyAssignments(course) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A course with this code already exists.' });
    if (error instanceof mongoose.Error.CastError) return res.status(400).json({ message: 'Invalid course ID.' });
    res.status(500).json({ message: 'Could not update the course.' });
  }
}

export async function updateCourseAssignments(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.courseId)) return res.status(400).json({ message: 'Invalid course ID.' });
    const currentCourse = await Course.findById(req.params.courseId);
    if (!currentCourse) return res.status(404).json({ message: 'Course not found.' });
    const result = await validateAssignments(req.body.assignments ?? []);
    if (result.error) return res.status(400).json({ message: result.error });

    // Snapshot the old assignment metadata so historical student records remain
    // attributable after assignment rows are replaced or removed.
    for (const assignment of currentCourse.assignments) {
      await Attendance.updateMany(
        { course: currentCourse._id, assignmentId: String(assignment._id) },
        {
          $set: {
            roster: assignment.roster || null,
            semester: assignment.semester || '',
            section: assignment.section || ''
          }
        }
      );
    }
    if (currentCourse.teacher) {
      await Attendance.updateMany(
        { course: currentCourse._id, assignmentId: 'legacy' },
        {
          $set: {
            roster: currentCourse.roster || null,
            semester: currentCourse.semester || '',
            section: currentCourse.section || ''
          }
        }
      );
    }

    currentCourse.assignments = result.assignments;
    currentCourse.teacher = null;
    currentCourse.roster = null;
    currentCourse.semester = '';
    currentCourse.section = '';
    await currentCourse.save();
    await currentCourse.populate([
      { path: 'assignments.teacher', select: 'name email department' },
      { path: 'assignments.roster', select: 'department semester section students' }
    ]);
    res.json({ course: normalizeLegacyAssignments(currentCourse) });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) return res.status(400).json({ message: 'Invalid course or assignment ID.' });
    res.status(500).json({ message: 'Could not save course assignments.' });
  }
}

export async function deleteCourse(req, res) {
  try {
    const hasAttendance = await Attendance.exists({ course: req.params.courseId });
    if (hasAttendance) return res.status(409).json({ message: 'This course has attendance records and cannot be deleted.' });
    const course = await Course.findByIdAndDelete(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json({ message: 'Course deleted.' });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) return res.status(400).json({ message: 'Invalid course ID.' });
    res.status(500).json({ message: 'Could not delete the course.' });
  }
}

export async function listTeacherCourses(req, res) {
  try {
    const docs = await populateAssignments(Course.find({
      $or: [{ 'assignments.teacher': req.account._id }, { teacher: req.account._id }]
    })).sort({ department: 1, code: 1 });
    const courses = [];
    for (const doc of docs) {
      const course = normalizeLegacyAssignments(doc);
      for (const assignment of course.assignments || []) {
        const teacherId = assignment.teacher?._id || assignment.teacher;
        if (String(teacherId) !== String(req.account._id)) continue;
        courses.push({ ...course, assignments: undefined, assignment });
      }
    }
    res.json({ courses });
  } catch {
    res.status(500).json({ message: 'Could not load your courses.' });
  }
}
