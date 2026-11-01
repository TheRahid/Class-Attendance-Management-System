import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Save } from "lucide-react";
import {
  fetchCourseAttendance,
  fetchMyCourses,
  saveCourseAttendance,
} from "../api/courses.js";

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function Attendance() {
  const [courses, setCourses] = useState([]);
  const [assignmentId, setAssignmentId] = useState("");
  const [date, setDate] = useState(localToday);
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [attendanceRecorded, setAttendanceRecorded] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchMyCourses()
      .then((result) => {
        if (cancelled) return;
        const assignedCourses = result.courses || [];
        setCourses(assignedCourses);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingCourses(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAssignment = courses.find(
    (item) => String(item.assignment?._id) === String(assignmentId),
  );
  const courseId = selectedAssignment?._id || "";


useEffect(() => {
  if (!courseId || !assignmentId || !date) {
    return undefined;
  }

  let cancelled = false;

  async function loadAttendance() {
    setLoadingSession(true);
    setError("");
    setNotice("");

    try {
      const result = await fetchCourseAttendance(
        courseId,
        assignmentId,
        date,
      );

      if (cancelled) return;

      const roster = result.roster?.students || [];

      const savedMarks = Object.fromEntries(
        (result.attendance?.entries || []).map((entry) => [
          entry.studentId,
          entry.status,
        ]),
      );

      setCourse(result.course);
      setStudents(roster);
      setAttendanceRecorded(Boolean(result.attendance));

      setMarks(
        Object.fromEntries(
          roster.map((student) => [
            student.studentId,
            savedMarks[student.studentId] || "",
          ]),
        ),
      );
    } catch (requestError) {
      if (!cancelled) {
        setError(requestError.message);
      }
    } finally {
      if (!cancelled) {
        setLoadingSession(false);
      }
    }
  }

  loadAttendance();

  return () => {
    cancelled = true;
  };
}, [courseId, assignmentId, date]);


  const presentCount = useMemo(
    () => Object.values(marks).filter((status) => status === "present").length,
    [marks],
  );
  const absentCount = useMemo(
    () => Object.values(marks).filter((status) => status === "absent").length,
    [marks],
  );
  const allMarked =
    students.length > 0 &&
    students.every((student) => marks[student.studentId]);

  async function persistAttendance() {
    if (!courseId || !assignmentId || !allMarked) return;
    setSavingAttendance(true);
    setError("");
    setNotice("");

    try {
      await saveCourseAttendance(
        courseId,
        assignmentId,
        date,
        students.map((student) => ({
          studentId: student.studentId,
          status: marks[student.studentId],
        })),
      );
      setAttendanceRecorded(true);
      setNotice(`Attendance saved for ${date}.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingAttendance(false);
    }
  }

  if (loadingCourses) {
    return (
      <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
        Loading your courses…
      </p>
    );
  }

  if (!courses.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
        <ClipboardCheck className="mx-auto mb-2 text-slate-300" size={24} />
        <p className="text-sm text-slate-600">
          No courses have been assigned to you yet.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">Take attendance</h2>
        <p className="mt-1 text-sm text-slate-500">
          Select your course and class date, then mark every student.
        </p>
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

      <div className="mb-5 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          Course / section
          <select
            value={assignmentId}
            onChange={(event) => setAssignmentId(event.target.value)}
            className={inputClass}
          >
            <option value="">Choose a course / section</option>
            {courses.map((item) => (
              <option
                key={`${item._id}-${item.assignment?._id}`}
                value={item.assignment?._id}
              >
                {item.code} · {item.name} ·{" "}
                {item.assignment?.semester || "No semester"} ·{" "}
                {item.assignment?.section
                  ? `Section ${item.assignment.section}`
                  : "No section"}
                {item.assignment?.classTime
                  ? ` · ${item.assignment.classTime}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Class date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {loadingSession && (
        <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading this class roster…
        </p>
      )}

      {!selectedAssignment && !loadingSession && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <ClipboardCheck className="mx-auto mb-2 text-slate-300" size={24} />
          <p className="text-sm text-slate-600">
            Select a course section to load its student list.
          </p>
        </div>
      )}

      {course && !loadingSession && (
        <>
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">
              Assigned student list
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {course.department} · {course.semester || "No semester"} ·{" "}
              {course.section ? `Section ${course.section}` : "No section"}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              This list is managed by the administrator and shared with courses
              assigned to this section.
            </p>
          </div>

          {attendanceRecorded && (
            <p
              role="status"
              className="mb-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800"
            >
              Attendance for this section and date has already been recorded. It
              cannot be submitted again.
            </p>
          )}

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-800">Present</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {presentCount}
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-4">
              <p className="text-xs text-rose-800">Absent</p>
              <p className="mt-1 text-2xl font-bold text-rose-900">
                {absentCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-xs text-slate-600">Students</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {students.length}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-150 border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.studentId}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.studentId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {student.department || course.department}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          disabled={attendanceRecorded}
                          onClick={() =>
                            setMarks((current) => ({
                              ...current,
                              [student.studentId]: "present",
                            }))
                          }
                          aria-pressed={marks[student.studentId] === "present"}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${marks[student.studentId] === "present" ? "bg-[#0297de] text-white" : "border border-[#0297de] text-[#0297de] hover:bg-sky-50"}`}
                        >
                          Present
                        </button>
                        <button
                          disabled={attendanceRecorded}
                          onClick={() =>
                            setMarks((current) => ({
                              ...current,
                              [student.studentId]: "absent",
                            }))
                          }
                          aria-pressed={marks[student.studentId] === "absent"}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${marks[student.studentId] === "absent" ? "bg-[#0297de] text-white" : "border border-[#0297de] text-[#0297de] hover:bg-sky-50"}`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {students.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-600">
                  No student roster is assigned to this course.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Ask an administrator to create and assign the roster.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {allMarked
                ? "Every student has been marked."
                : `${students.length - presentCount - absentCount} student(s) still need a mark.`}
            </p>
            <button
              onClick={persistAttendance}
              disabled={!allMarked || savingAttendance || attendanceRecorded}
              className="flex items-center gap-2 rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {savingAttendance
                ? "Saving attendance…"
                : attendanceRecorded
                  ? "Attendance recorded"
                  : "Save attendance"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
 