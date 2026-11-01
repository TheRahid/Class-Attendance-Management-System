import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ClipboardList, Search, UserRound } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchAdminCourses,
  fetchAdminAttendance,
  fetchAdminStudentAttendance,
  fetchMyCourses,
  fetchTeacherAttendance,
  fetchTeacherStudentAttendance,
} from "../api/courses.js";
import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

export default function Reports() {
  const { account } = useAuth();
  const isTeacher = account.role === "teacher";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openedFromCourseList = useRef(false);
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [historyCourseId, setHistoryCourseId] = useState("");
  const [studentHistory, setStudentHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const selectedCourseId = searchParams.get("courseId") || "";
  const selectedSessionId = searchParams.get("sessionId") || "";
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ courseId: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

 
const loadRecords = useCallback(
  async (activeFilters) => {
    try {
      const result = isTeacher
        ? await fetchTeacherAttendance(activeFilters)
        : await fetchAdminAttendance(activeFilters);

      setRecords(result.records || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  },
  [isTeacher],
);


  

useEffect(() => {
  if (isTeacher || !selectedCourseId) return;

  let cancelled = false;

  async function fetchRecords() {
    try {
      const result = await fetchAdminAttendance({
        courseId: selectedCourseId,
        from: filters.from,
        to: filters.to,
      });

      if (!cancelled) {
        setRecords(result.records || []);
        setError("");
      }
    } catch (requestError) {
      if (!cancelled) {
        setError(requestError.message);
      }
    }
  }

  fetchRecords();

  return () => {
    cancelled = true;
  };
}, [
  isTeacher,
  selectedCourseId,
  filters.from,
  filters.to,
]);



  useEffect(() => {
    let cancelled = false;
    async function loadPage() {
    
      try {
        const result = await (isTeacher
          ? fetchMyCourses()
          : fetchAdminCourses());
        if (cancelled) return;
        setCourses(result.courses || []);
        if (isTeacher) {
          const attendance = await fetchTeacherAttendance({});
          if (!cancelled) setRecords(attendance.records || []);
        }
        if (!cancelled) setError("");
      } catch (requestError) {
        if (!cancelled) setError(requestError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPage();
    return () => {
      cancelled = true;
    };
  }, [isTeacher]);

  function openCourseReport(courseId) {
    openedFromCourseList.current = true;
    const dateFilters = { from: "", to: "" };
    setFilters({ courseId: "", ...dateFilters });
    setSearchParams({ courseId });
  }

  function openSession(sessionId) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("sessionId", sessionId);
      return next;
    });
  }

  function closeSession() {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("sessionId");
        return next;
      },
      { replace: true },
    );
  }

  function closeCourseReport() {
    setFilters({ courseId: "", from: "", to: "" });
    setError("");
    if (openedFromCourseList.current && window.history.state?.idx > 0) {
      openedFromCourseList.current = false;
      navigate(-1);
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  
function applyFilters(event) {
  event.preventDefault();
  setLoading(true);

  loadRecords({
    ...filters,
    courseId: isTeacher ? filters.courseId : selectedCourseId,
  });
}

  async function loadStudentHistory(event) {
    event.preventDefault();
    if (!studentId.trim()) return;
    setHistoryLoading(true);
    setStudentHistory(null);
    setError("");
    try {
      setStudentHistory(
        await (isTeacher
          ? fetchTeacherStudentAttendance(studentId.trim())
          : fetchAdminStudentAttendance(studentId.trim())),
      );
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  const selectedCourse = courses.find(
    (course) => course._id === selectedCourseId,
  );
  const selectedSession = records.find(
    (record) => String(record._id) === selectedSessionId,
  );
  const historyCourses = [
    ...new Map(courses.map((course) => [String(course._id), course])).values(),
  ];
  const visibleStudentHistory = studentHistory
    ? {
        ...studentHistory,
        history: historyCourseId
          ? studentHistory.history.filter(
              (record) => String(record.course?._id) === historyCourseId,
            )
          : studentHistory.history,
      }
    : null;
  const showReport = isTeacher || Boolean(selectedCourseId);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          {/* <h2 className="text-lg font-bold text-slate-900">
            {!isTeacher && selectedCourse
              ? `${selectedCourse.code} report`
              : "Attendance reports"}
          </h2> */}
          <p className="mt-1 text-sm text-slate-500">
            {selectedSessionId
              ? `${selectedSession?.course?.name || selectedCourse?.name || "Attendance session"}${selectedSession?.date ? ` · ${selectedSession.date}` : ""}`
              : isTeacher
              ? "Review attendance sessions recorded for your assigned courses."
              : selectedCourse
                ? `${selectedCourse.name} · ${selectedCourse.department}`
                : "Choose a course report or look up an individual student’s history."}
          </p>
        </div>
        {selectedSessionId ? (
          <button
            type="button"
            onClick={closeSession}
            className="flex items-center gap-2 rounded-lg border border-[#0297de] bg-white px-3 py-2.5 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
          >
            <ArrowLeft size={15} /> Back to sessions
          </button>
        ) : !isTeacher && selectedCourseId ? (
          <button
            type="button"
            onClick={closeCourseReport}
            className="flex items-center gap-2 rounded-lg border border-[#0297de] bg-white px-3 py-2.5 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
          >
            <ArrowLeft size={15} /> All courses
          </button>
        ) : null}
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {!selectedSessionId && <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
            <UserRound size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">
              Individual student attendance
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {isTeacher
                ? "Search by ID to view attendance in your assigned courses."
                : "Search by student ID to review the student’s recorded sessions."}
            </p>
          </div>
        </div>
        <form
          onSubmit={loadStudentHistory}
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
        >
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            Student ID
            <input
              required
              maxLength={30}
              value={studentId}
              onChange={(event) => {
                setStudentId(event.target.value);
                setStudentHistory(null);
              }}
              className={`${inputClass} mt-1 w-full`}
              placeholder="Enter student ID"
            />
          </label>
          <label className="min-w-0 text-xs font-semibold text-slate-600">
            Course
            <select
              value={historyCourseId}
              onChange={(event) => setHistoryCourseId(event.target.value)}
              className={`${inputClass} mt-1 w-full`}
            >
              <option value="">All courses</option>
              {historyCourses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} · {course.name}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={historyLoading || !studentId.trim()}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9] disabled:opacity-50"
          >
            <Search size={15} />
            {historyLoading ? "Searching…" : "Search history"}
          </button>
        </form>
      </div>}

      {!selectedSessionId && visibleStudentHistory && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                Student ID: {visibleStudentHistory.student.studentId}
              </h3>
              {visibleStudentHistory.student.names.length > 0 && (
                <p className="mt-1 text-sm text-slate-500">
                  {visibleStudentHistory.student.names.join(", ")} · Found on{" "}
                  {visibleStudentHistory.student.listCount} student list
                  {visibleStudentHistory.student.listCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              {visibleStudentHistory.history.length} session
              {visibleStudentHistory.history.length === 1 ? "" : "s"}
            </span>
          </div>
          {visibleStudentHistory.history.length ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-175 border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Semester / section</th>
                    <th className="px-4 py-3">Teacher</th>
                    <th className="px-4 py-3">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleStudentHistory.history.map((record, index) => (
                    <tr key={`${record._id}-${index}`}>
                      <td className="px-4 py-3 text-slate-700">
                        {record.date}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {record.course?.name || "Deleted course"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {record.course?.code || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.semester || "—"} ·{" "}
                        {record.section ? `Section ${record.section}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.teacher}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === "present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">
              {historyCourseId
                ? "No attendance sessions were found for this student ID in the selected course."
                : "No attendance sessions were found for this student ID."}
            </p>
          )}
        </div>
      )}

      {selectedSessionId && showReport && (selectedSession ? (
        <SessionDetail record={selectedSession} />
      ) : loading ? (
        <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading this attendance session…
        </p>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
          This attendance session could not be found.
        </p>
      ))}

      {!selectedSessionId && !isTeacher &&
        !selectedCourseId &&
        (loading ? (
          <p className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Loading courses…
          </p>
        ) : courses.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course._id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <ClipboardList size={18} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {course.code} · {course.department}
                </p>
                <h3 className="mt-1 font-semibold text-slate-900">
                  {course.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  {course.assignments?.length || 0} teacher-section assignment
                  {course.assignments?.length === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  onClick={() => openCourseReport(course._id)}
                  className="mt-4 w-full rounded-lg bg-[#0297de] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9]"
                >
                  View attendance report
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
            No courses are available yet.
          </div>
        ))}

      {showReport && !selectedSessionId && (
        <>
          <form
            onSubmit={applyFilters}
            className={`mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 ${isTeacher ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}
          >
            {isTeacher && (
              <label className="text-xs font-semibold text-slate-600">
                Course
                <select
                  value={filters.courseId}
                  onChange={(event) =>
                    setFilters({ ...filters, courseId: event.target.value })
                  }
                  className={`${inputClass} mt-1 w-full`}
                >
                  <option value="">All courses</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} · {course.name}
                      {course.assignment?.section
                        ? ` · Section ${course.assignment.section}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-xs font-semibold text-slate-600">
              From
              <input
                type="date"
                value={filters.from}
                onChange={(event) =>
                  setFilters({ ...filters, from: event.target.value })
                }
                className={`${inputClass} mt-1 w-full`}
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              To
              <input
                type="date"
                value={filters.to}
                onChange={(event) =>
                  setFilters({ ...filters, to: event.target.value })
                }
                className={`${inputClass} mt-1 w-full`}
              />
            </label>
            <button className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9]">
              <Search size={15} /> Apply filters
            </button>
          </form>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-190 border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  {isTeacher && <th className="px-4 py-3">Course</th>}
                  <th className="px-4 py-3">Semester</th>
                  <th className="px-4 py-3">Section</th>
                  {!isTeacher && <th className="px-4 py-3">Teacher</th>}
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Absent</th>
                  <th className="px-4 py-3">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record) => {
                  const entries = record.entries || [];
                  const present = entries.filter(
                    (entry) => entry.status === "present",
                  ).length;
                  const absent = entries.length - present;
                  const rate = entries.length
                    ? Math.round((present / entries.length) * 100)
                    : 0;
                  return (
                    <tr key={record._id}>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openSession(String(record._id))}
                          className="text-left font-medium text-[#0297de] hover:underline"
                        >
                          {record.date}
                          <span className="block text-[10px] font-normal text-slate-500">
                            View session
                          </span>
                        </button>
                      </td>
                      {isTeacher && (
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {record.course?.name || "Deleted course"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {record.course?.code || "—"}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-600">
                        {record.assignment?.semester || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.assignment?.section || "—"}
                      </td>
                      {!isTeacher && (
                        <td className="px-4 py-3 text-slate-600">
                          {record.teacher?.name || "Former teacher"}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-emerald-700">
                        {present}
                      </td>
                      <td className="px-4 py-3 font-medium text-rose-700">
                        {absent}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {loading && (
              <p className="p-8 text-center text-sm text-slate-500">
                Loading attendance records…
              </p>
            )}
            {!loading && records.length === 0 && (
              <div className="p-10 text-center">
                <ClipboardList
                  className="mx-auto mb-2 text-slate-300"
                  size={24}
                />
                <p className="text-sm text-slate-600">
                  No attendance records match these filters.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function SessionDetail({ record }) {
  const entries = record.entries || [];
  const presentCount = entries.filter(
    (entry) => entry.status === "present",
  ).length;
  const absentCount = entries.length - presentCount;
  const rate = entries.length
    ? Math.round((presentCount / entries.length) * 100)
    : 0;

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Attendance session
            </p>
            <h2 className="mt-1 break-words text-xl font-bold text-slate-900">
              {record.course?.name || "Deleted course"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {record.course?.code || "—"} · {record.date} · {record.assignment?.semester || record.semester || "No semester"} · Section {record.assignment?.section || record.section || "—"}
            </p>
            {record.teacher?.name && (
              <p className="mt-1 text-xs text-slate-500">
                Teacher: {record.teacher.name}
              </p>
            )}
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:min-w-72">
            <div className="rounded-lg bg-slate-100 p-3">
              <p className="text-[10px] text-slate-600 sm:text-xs">Students</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{entries.length}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-[10px] text-emerald-800 sm:text-xs">Present</p>
              <p className="mt-1 text-lg font-bold text-emerald-900">{presentCount}</p>
            </div>
            <div className="rounded-lg bg-rose-50 p-3">
              <p className="text-[10px] text-rose-800 sm:text-xs">Absent</p>
              <p className="mt-1 text-lg font-bold text-rose-900">{absentCount}</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">Attendance rate: {rate}%</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
          <h3 className="font-semibold text-slate-900">Student attendance list</h3>
          <p className="mt-1 text-xs text-slate-500">
            Each student’s attendance mark for this session.
          </p>
        </div>
        {entries.length ? (
          <ul className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
            {entries.map((entry, index) => (
              <li
                key={`${entry.studentId || "student"}-${index}`}
                className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-100 p-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-slate-800">
                    {entry.name || "Student"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {entry.studentId || "No student ID"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${entry.status === "present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
                >
                  {entry.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-center text-sm text-slate-500">
            No student marks were saved for this session.
          </p>
        )}
      </div>
    </section>
  );
}
 