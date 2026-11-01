import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCourse,
  deleteCourse,
  fetchAdminCourses,
  updateCourse,
} from "../api/courses.js";

const emptyCourse = { code: "", name: "", department: "" };
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function CourseManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyCourse });

const load = useCallback(async () => {
  try {
    const result = await fetchAdminCourses();
    setCourses(result.courses || []);
    setError("");
  } catch (requestError) {
    setError(requestError.message);
  }
}, []);

  useEffect(() => {
  let cancelled = false;

  async function fetchCourses() {
    try {
      const result = await fetchAdminCourses();

      if (!cancelled) {
        setCourses(result.courses || []);
        setError("");
      }
    } catch (requestError) {
      if (!cancelled) {
        setError(requestError.message);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  }

  fetchCourses();

  return () => {
    cancelled = true;
  };
}, []);

  function startCreate() {
    setEditing(null);
    reset(emptyCourse);
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  function startEdit(course) {
    setEditing(course);
    reset({
      code: course.code || "",
      name: course.name || "",
      department: course.department || "",
    });
    setError("");
    setNotice("");
    setFormOpen(true);
  }

  async function onSubmit(values) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = { ...values, code: values.code.toUpperCase() };
      if (editing) await updateCourse(editing._id, payload);
      else await createCourse(payload);
      setNotice(
        editing
          ? "Course details updated."
          : "Course created. Add its teaching assignments separately.",
      );
      setFormOpen(false);
      setEditing(null);
      reset(emptyCourse);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeCourse(course) {
    if (!window.confirm(`Delete ${course.code} — ${course.name}?`)) return;
    setError("");
    setNotice("");
    try {
      await deleteCourse(course._id);
      setNotice(`${course.code} deleted.`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {/* <h2 className="text-lg font-bold text-slate-900">Courses</h2> */}
          <p className="mt-1 text-sm text-slate-500">
            Create and maintain course details here. Manage teachers and
            sections separately.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9]"
        >
          <Plus size={16} /> Add course
        </button>
      </div>
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
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">
              {editing ? "Edit course details" : "Create a course"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Teacher, semester, section, and student list are configured from
              Teaching Assignments.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Course code
              <input
                {...register("code", {
                  required: "Enter a course code.",
                  pattern: {
                    value: /^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/,
                    message: "Use 2–12 letters, numbers, spaces, or hyphens.",
                  },
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
                {...register("name", {
                  required: "Enter a course name.",
                  pattern: {
                    value: /^[A-Za-z0-9][A-Za-z0-9 ,.'&()/-]{1,79}$/,
                    message: "Enter a valid name (2–80 characters).",
                  },
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
                {...register("department", {
                  required: "Enter a department.",
                  pattern: {
                    value: /^[A-Za-z][A-Za-z0-9 &/-]{1,49}$/,
                    message: "Enter a valid department name.",
                  },
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
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-[#0297de] bg-white px-4 py-2.5 text-sm font-medium text-[#0297de] hover:bg-sky-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9] disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save course" : "Create course"}
            </button>
          </div>
        </form>
      )}

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 xl:block">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Teaching assignments</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((course) => (
              <tr key={course._id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">
                    {course.name}
                  </div>
                  <div className="text-xs text-slate-500">{course.code}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {course.department}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {course.assignments?.length ? (
                    <div className="space-y-1">
                      {course.assignments.map((assignment) => (
                        <div key={assignment._id || assignment.teacher?._id}>
                          {assignment.teacher?.name || "Teacher"} ·{" "}
                          {assignment.semester || "No semester"} ·{" "}
                          {assignment.section
                            ? `Section ${assignment.section}`
                            : "No section"}
                          {assignment.classTime
                            ? ` · ${assignment.classTime}`
                            : ""}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">None yet</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        navigate(`/admin/assignments?courseId=${course._id}`, {
                          state: {
                            from: `${location.pathname}${location.search}`,
                          },
                        })
                      }
                      className="rounded-md border border-[#0297de] px-3 py-2 text-xs font-semibold text-[#0297de] hover:bg-sky-50"
                    >
                      Manage assignments
                    </button>
                    <button
                      onClick={() => startEdit(course)}
                      aria-label={`Edit ${course.code}`}
                      className="rounded-md border border-[#0297de] p-2 text-[#0297de] hover:bg-sky-50"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => removeCourse(course)}
                      aria-label={`Delete ${course.code}`}
                      className="rounded-md border border-[#0297de] p-2 text-[#0297de] hover:bg-sky-50"
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

      <div className="space-y-3 xl:hidden">
        {loading && (
          <p className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
            Loading courses…
          </p>
        )}
        {!loading && courses.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <BookOpen className="mx-auto mb-2 text-slate-300" size={24} />
            <p className="text-sm text-slate-500">
              No courses yet. Add a course to get started.
            </p>
          </div>
        )}
        {courses.map((course) => (
          <article
            key={course._id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="wrap-break-word text-sm font-semibold text-slate-900">
                  {course.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">{course.code}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {course.department}
              </span>
            </div>
            {course.assignments?.length ? (
              <details className="mt-3 text-xs text-slate-600">
                <summary className="cursor-pointer font-medium text-slate-700">
                  {course.assignments.length} teaching assignment
                  {course.assignments.length === 1 ? "" : "s"}
                </summary>
                <ul className="mt-2 space-y-1 border-l-2 border-slate-100 pl-3">
                  {course.assignments.map((assignment) => (
                    <li
                      key={assignment._id || assignment.teacher?._id}
                      className="wrap-break-word"
                    >
                      {assignment.teacher?.name || "Teacher"} ·{" "}
                      {assignment.semester || "No semester"} ·{" "}
                      {assignment.section
                        ? `Section ${assignment.section}`
                        : "No section"}
                      {assignment.classTime ? ` · ${assignment.classTime}` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                No teaching assignments yet.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  navigate(`/admin/assignments?courseId=${course._id}`, {
                    state: {
                      from: `${location.pathname}${location.search}`,
                    },
                  })
                }
                className="flex-1 rounded-md border border-[#0297de] px-3 py-2 text-xs font-semibold text-[#0297de] hover:bg-sky-50"
              >
                Manage assignments
              </button>
              <button
                onClick={() => startEdit(course)}
                aria-label={`Edit ${course.code}`}
                className="rounded-md border border-[#0297de] p-2 text-[#0297de] hover:bg-sky-50"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => removeCourse(course)}
                aria-label={`Delete ${course.code}`}
                className="rounded-md border border-[#0297de] p-2 text-[#0297de] hover:bg-sky-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
  