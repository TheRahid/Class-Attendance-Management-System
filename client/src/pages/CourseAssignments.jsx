import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { fetchTeachers } from "../api/auth.js";
import {
  fetchAdminCourses,
  fetchAdminRosters,
  updateCourseAssignments,
} from "../api/courses.js";

const emptyAssignment = {
  teacher: "",
  semester: "",
  section: "",
  roster: "",
  classTime: "",
};
const semesterOptions = Array.from(
  { length: 8 },
  (_, index) => `${index + 1}${["st", "nd", "rd"][index] || "th"} semester`,
);
const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const idOf = (value) => value?._id || value || "";

function toAssignmentValues(assignments = []) {
  return assignments.map((assignment) => ({
    teacher: idOf(assignment.teacher),
    semester: assignment.semester || "",
    section: assignment.section || "",
    roster: idOf(assignment.roster),
    classTime: assignment.classTime || "",
  }));
}

export default function CourseAssignments() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [courseId, setCourseId] = useState(searchParams.get("courseId") || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const {
    control,
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { assignments: [] } });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "assignments",
  });
  const selectedCourse = courses.find((course) => course._id === courseId);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseData, teacherData, rosterData] = await Promise.all([
        fetchAdminCourses(),
        fetchTeachers(),
        fetchAdminRosters(),
      ]);
      const loadedCourses = courseData.courses || [];
      setCourses(loadedCourses);
      setTeachers(
        (teacherData.teachers || []).filter(
          (teacher) => teacher.status === "active",
        ),
      );
      setRosters(rosterData.rosters || []);
      setCourseId((current) =>
        loadedCourses.some((course) => course._id === current) ? current : "",
      );
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    const activeCourse = courses.find((course) => course._id === courseId);
    reset({ assignments: toAssignmentValues(activeCourse?.assignments) });
  }, [courseId, courses, reset]);

  function selectCourse(event) {
    const nextId = event.target.value;
    setCourseId(nextId);
    setSearchParams(nextId ? { courseId: nextId } : {}, { replace: true });
    setError("");
    setNotice("");
  }

  function goBack() {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else {
      navigate("/admin/courses", { replace: true });
    }
  }

  function chooseRoster(index, event) {
    const roster = rosters.find((item) => item._id === event.target.value);
    setValue(`assignments.${index}.roster`, roster?._id || "", {
      shouldValidate: true,
    });
    setValue(`assignments.${index}.section`, roster?.section || "", {
      shouldValidate: true,
    });
  }

  async function onSubmit(values) {
    if (!selectedCourse) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await updateCourseAssignments(
        selectedCourse._id,
        values.assignments || [],
      );
      setCourses((current) =>
        current.map((course) =>
          course._id === result.course._id ? result.course : course,
        ),
      );
      setNotice("Teaching assignments saved.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {/* <h2 className="text-lg font-bold text-slate-900">
            Teaching assignments
          </h2> */}
          <p className="mt-1 text-sm text-slate-500">
            Assign approved teachers to course sections. Course details are
            managed separately.
          </p>
        </div>
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-2 rounded-lg border border-[#0297de] bg-white px-3 py-2.5 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
        >
          <ArrowLeft size={15} /> Back
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
      {!teachers.length && !loading && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          There are no approved teachers to assign yet. Approve a teacher from
          Teachers first.
        </p>
      )}

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold text-slate-600">
          Choose a course
          <select
            value={courseId}
            onChange={selectCourse}
            className={inputClass}
          >
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} · {course.name} · {course.department}
              </option>
            ))}
          </select>
        </label>
        {courseId && (
          <p className="mt-2 text-xs text-slate-500">
            This course applies to every assignment row below. Select it once,
            then add a row for each teacher and section.
          </p>
        )}
      </div>

      {loading && (
        <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading courses and assignment options…
        </p>
      )}
      {!loading && !courses.length && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
          Create a course before adding teaching assignments.{" "}
          <Link
            className="font-semibold text-emerald-800 underline"
            to="/admin/courses"
          >
            Go to Courses
          </Link>
        </div>
      )}

      {selectedCourse && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4 rounded-xl bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">
              {selectedCourse.code} · {selectedCourse.name}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {selectedCourse.department}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Every row below belongs to this same course. Add one row for each
              teacher-section pairing, including additional sections of{" "}
              {selectedCourse.code}.
            </p>
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold text-slate-900">
              Assignments ({fields.length})
            </h4>
            <button
              type="button"
              onClick={() => append({ ...emptyAssignment })}
              disabled={!teachers.length}
              className="flex items-center gap-2 rounded-lg bg-[#0297de] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9] disabled:opacity-50"
            >
              <Plus size={15} /> Add another teacher / section
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => {
              const rosterId = watch(`assignments.${index}.roster`, "");
              return (
                <article
                  key={field.id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h5 className="text-sm font-semibold text-slate-800">
                      Assignment {index + 1}
                    </h5>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove assignment ${index + 1}`}
                      className="rounded-md border border-[#0297de] p-2 text-[#0297de] hover:bg-sky-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="text-xs font-semibold text-slate-600 xl:col-span-2">
                      Teacher
                      <select
                        {...register(`assignments.${index}.teacher`, {
                          required: "Choose an approved teacher.",
                        })}
                        className={inputClass}
                      >
                        <option value="">Select teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name} ·{" "}
                            {teacher.department || "No department"}
                          </option>
                        ))}
                      </select>
                      {errors.assignments?.[index]?.teacher && (
                        <span className="mt-1 block font-normal text-rose-600">
                          {errors.assignments[index].teacher.message}
                        </span>
                      )}
                    </label>
                    <label className="text-xs font-semibold text-slate-600 xl:col-span-2">
                      Student list (optional)
                      <select
                        {...register(`assignments.${index}.roster`)}
                        value={rosterId}
                        onChange={(event) => chooseRoster(index, event)}
                        className={inputClass}
                      >
                        <option value="">No list assigned</option>
                        {rosters.map((roster) => (
                          <option key={roster._id} value={roster._id}>
                            {roster.department} · Batch{" "}
                            {roster.batchNumber || roster.semester || "—"} ·
                            Section {roster.section} ({roster.students.length}{" "}
                            students)
                          </option>
                        ))}
                      </select>
                      {!rosters.length && (
                        <span className="mt-1 block font-normal text-amber-700">
                          Create a student list first from Student Lists.
                        </span>
                      )}
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Semester
                      <select
                        {...register(`assignments.${index}.semester`, {
                          required: "Choose a semester.",
                        })}
                        className={inputClass}
                      >
                        <option value="">Select semester</option>
                        {semesterOptions.map((semester) => (
                          <option key={semester} value={semester}>
                            {semester}
                          </option>
                        ))}
                      </select>
                      {errors.assignments?.[index]?.semester && (
                        <span className="mt-1 block font-normal text-rose-600">
                          {errors.assignments[index].semester.message}
                        </span>
                      )}
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Section
                      <input
                        readOnly={Boolean(rosterId)}
                        {...register(`assignments.${index}.section`)}
                        className={`${inputClass} read-only:bg-slate-100 read-only:text-slate-500`}
                        placeholder="Optional, e.g. A"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Class time
                      <input
                        type="time"
                        {...register(`assignments.${index}.classTime`)}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </article>
              );
            })}
            {!fields.length && (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-sm text-slate-600">
                  No teaching assignments for this course yet.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Add a row for each teacher and section, or leave it unassigned
                  for now.
                </p>
              </div>
            )}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9] disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving…" : "Save assignments"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
 