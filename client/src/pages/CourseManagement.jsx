
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { BookOpen, Pencil, Plus, Trash2, X } from 'lucide-react';
import { fetchTeachers } from '../api/auth.js';
import {
  createCourse,
  deleteCourse,
  fetchAdminCourses,
  updateCourse
} from '../api/courses.js';

const emptyCourse = {
  code: '',
  name: '',
  department: '',
  semester: '',
  classTime: '',
  room: '',
  teacher: ''
};

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: emptyCourse });

  // Refresh data after creating, editing, or deleting a course.
  // Do not set loading synchronously here; this function is also
  // called from event handlers.
  const load = useCallback(async () => {
    try {
      const [courseData, teacherData] = await Promise.all([
        fetchAdminCourses(),
        fetchTeachers()
      ]);

      setCourses(courseData.courses || []);
      setTeachers(
        (teacherData.teachers || []).filter(
          teacher => teacher.status === 'active'
        )
      );
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Failed to load course data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data asynchronously and avoid state updates
  // if the component unmounts before the requests finish.
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const [courseData, teacherData] = await Promise.all([
          fetchAdminCourses(),
          fetchTeachers()
        ]);

        if (cancelled) return;

        setCourses(courseData.courses || []);
        setTeachers(
          (teacherData.teachers || []).filter(
            teacher => teacher.status === 'active'
          )
        );
        setError('');
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || 'Failed to load course data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  function startCreate() {
    setEditing(null);
    reset(emptyCourse);
    setError('');
    setNotice('');
    setFormOpen(true);
  }

  function startEdit(course) {
    setEditing(course);

    reset({
      code: course.code || '',
      name: course.name || '',
      department: course.department || '',
      semester: course.semester || '',
      classTime: course.classTime || '',
      room: course.room || '',
      teacher: course.teacher?._id || ''
    });

    setError('');
    setNotice('');
    setFormOpen(true);
  }

  async function onSubmit(values) {
    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      ...values,
      code: values.code.toUpperCase()
    };

    try {
      if (editing) {
        await updateCourse(editing._id, payload);
      } else {
        await createCourse(payload);
      }

      setNotice(
        editing ? 'Course updated.' : 'Course created and assigned.'
      );
      setFormOpen(false);
      setEditing(null);
      reset(emptyCourse);
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Failed to save the course.');
    } finally {
      setSaving(false);
    }
  }

  async function removeCourse(course) {
    const confirmed = window.confirm(
      `Delete ${course.code} — ${course.name}?`
    );

    if (!confirmed) return;

    setError('');
    setNotice('');

    try {
      await deleteCourse(course._id);
      setNotice(`${course.code} deleted.`);
      await load();
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete the course.');
    }
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Courses</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create courses and assign them to approved teachers.
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          disabled={!teachers.length || loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} />
          Add course
        </button>
      </div>

      {!teachers.length && !loading && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          Approve at least one teacher before assigning a course.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              {editing ? 'Edit course' : 'New course'}
            </h3>

            <button
              type="button"
              onClick={() => setFormOpen(false)}
              aria-label="Close form"
              className="rounded-md p-1 text-slate-500 hover:bg-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Course code
              <input
                {...register('code', {
                  required: 'Enter a course code.',
                  pattern: {
                    value: /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/,
                    message:
                      'Use 2–12 letters, numbers, spaces, or hyphens.'
                  }
                })}
                className={inputClass}
                placeholder="CSE 101"
              />
              {errors.code && (
                <span className="mt-1 block font-normal text-rose-600">
                  {errors.code.message}
                </span>
              )}
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Course name
              <input
                {...register('name', {
                  required: 'Enter a course name.',
                  pattern: {
                    value: /^[A-Za-z0-9][A-Za-z0-9 ,.'&()/-]{1,79}$/,
                    message: 'Enter a valid name (2–80 characters).'
                  }
                })}
                className={inputClass}
                placeholder="Introduction to Programming"
              />
              {errors.name && (
                <span className="mt-1 block font-normal text-rose-600">
                  {errors.name.message}
                </span>
              )}
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Department
              <input
                {...register('department', {
                  required: 'Enter a department.',
                  pattern: {
                    value: /^[A-Za-z][A-Za-z0-9 &/-]{1,49}$/,
                    message: 'Enter a valid department name.'
                  }
                })}
                className={inputClass}
                placeholder="Computer Science"
              />
              {errors.department && (
                <span className="mt-1 block font-normal text-rose-600">
                  {errors.department.message}
                </span>
              )}
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Semester
              <input
                {...register('semester', {
                  required: 'Enter a semester.',
                  pattern: {
                    value: /^[A-Za-z0-9][A-Za-z0-9 .&/-]{1,39}$/,
                    message: 'Enter a valid semester.'
                  }
                })}
                className={inputClass}
                placeholder="Fall 2026"
              />
              {errors.semester && (
                <span className="mt-1 block font-normal text-rose-600">
                  {errors.semester.message}
                </span>
              )}
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Class time
              <input
                {...register('classTime', {
                  maxLength: {
                    value: 60,
                    message: 'Keep the class time under 60 characters.'
                  }
                })}
                className={inputClass}
                placeholder="Sun, Tue · 11:00 AM"
              />
              {errors.classTime && (
                <span className="mt-1 block font-normal text-rose-600">
                  {errors.classTime.message}
                </span>
              )}
            </label>

            <label className="text-xs font-semibold text-slate-600">
              Room
              <input
                {...register('room', {
                  maxLength: {
                    value: 30,
                    message: 'Keep the room under 30 characters.'
                  }
                })}
                className={inputClass}
                placeholder="Room 204"
              />
              {errors.room && (
                <span className="mt-1 block font-normal text-rose-600">
                  {errors.room.message}
                </span>
              )}
            </label>

            <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">
              Assign teacher
              <select
                {...register('teacher', {
                  required: 'Choose a teacher.'
                })}
                className={inputClass}
              >
                <option value="">Select an approved teacher</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.name} · {teacher.department || 'No department'}
                  </option>
                ))}
              </select>
              {errors.teacher && (
                <span className="mt-1 block font-normal text-rose-600">
                  {errors.teacher.message}
                </span>
              )}
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving
                ? 'Saving…'
                : editing
                  ? 'Save changes'
                  : 'Create course'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {courses.map(course => (
              <tr key={course._id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">
                    {course.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {course.code}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {course.department}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {course.semester}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {course.teacher?.name || 'Unassigned'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {[course.classTime, course.room]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(course)}
                      aria-label={`Edit ${course.code}`}
                      className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCourse(course)}
                      aria-label={`Delete ${course.code}`}
                      className="rounded-md border border-slate-200 p-2 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <p className="p-8 text-center text-sm text-slate-500">
            Loading courses…
          </p>
        )}

        {!loading && courses.length === 0 && (
          <div className="p-10 text-center">
            <BookOpen className="mx-auto mb-2 text-slate-300" size={24} />
            <p className="text-sm text-slate-500">
              No courses yet. Add a course to get started.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
