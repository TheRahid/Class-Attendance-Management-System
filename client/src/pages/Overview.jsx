import { useEffect, useMemo, useState } from "react";
import { BookOpen, CheckCheck, ClipboardList, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchTeachers } from "../api/auth.js";
import {
  fetchAdminCourses,
  fetchAdminAttendance,
  fetchAdminRosters,
  fetchMyCourses,
  fetchTeacherAttendance,
} from "../api/courses.js";

const tileStyles = [
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-slate-100 text-slate-700",
];
const semesterOptions = Array.from(
  { length: 8 },
  (_, index) => `${index + 1}${["st", "nd", "rd"][index] || "th"} semester`,
);

function attendanceTotals(records) {
  return records.reduce(
    (total, record) => {
      const present = record.entries.filter(
        (entry) => entry.status === "present",
      ).length;
      return {
        present: total.present + present,
        marked: total.marked + record.entries.length,
      };
    },
    { present: 0, marked: 0 },
  );
}

function SemesterAttendanceOverview({ records, isAdmin }) {
  const [semester, setSemester] = useState("1st semester");
  const semesterRecords = records.filter(
    (record) =>
      (record.semester ||
        record.assignment?.semester ||
        record.course?.semester ||
        "") === semester,
  );
  const groups = new Map();

  semesterRecords.forEach((record) => {
    const course = record.course || {};
    const section =
      record.section || record.assignment?.section || course.section || "";
    const key = `${course._id || course.code || "course"}:${record.assignmentId || section}`;
    const group = groups.get(key) || {
      key,
      code: course.code || "Course",
      name: course.name || "",
      section,
      sessions: 0,
      present: 0,
      marked: 0,
    };
    group.sessions += 1;
    group.present += record.entries.filter(
      (entry) => entry.status === "present",
    ).length;
    group.marked += record.entries.length;
    groups.set(key, group);
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Semester attendance overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "Institute-wide attendance summary"
              : "Attendance summary for your assigned courses"}
          </p>
        </div>
        <label className="text-xs font-semibold text-slate-600">
          Semester
          <select
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            className="mt-1 block min-w-44 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0297de] focus:ring-2 focus:ring-sky-100"
          >
            {semesterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Course and section breakdown
          </h3>
          <Link
            to={isAdmin ? "/admin/reports" : "/teacher/reports"}
            className="text-xs font-semibold text-[#0297de] hover:underline"
          >
            View detailed reports →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-155 text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Present</th>
                <th className="px-4 py-3">Absent</th>
                <th className="px-4 py-3">Attendance rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...groups.values()].map((group) => {
                const groupRate = group.marked
                  ? Math.round((group.present / group.marked) * 100)
                  : 0;
                return (
                  <tr key={group.key}>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800">
                        {group.code}
                      </span>
                      {group.name && (
                        <span className="ml-2 text-slate-500">
                          {group.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {group.section || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {group.sessions}
                    </td>
                    <td className="px-4 py-3 text-emerald-700">
                      {group.present}
                    </td>
                    <td className="px-4 py-3 text-rose-700">
                      {group.marked - group.present}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {groupRate}%
                    </td>
                  </tr>
                );
              })}
              {!groups.size && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No attendance records for {semester} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Attendance rate = present attendance marks ÷ all recorded attendance marks × 100.
        </p> */}
      </div>
    </section>
  );
}

export default function Overview() {
  const { account } = useAuth();
  const isAdmin = account.role === "admin";
  const [data, setData] = useState({
    courses: [],
    records: [],
    teachers: [],
    rosters: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const requests = isAdmin
      ? Promise.all([
          fetchAdminCourses(),
          fetchAdminAttendance({}),
          fetchTeachers(),
          fetchAdminRosters(),
        ])
      : Promise.all([fetchMyCourses(), fetchTeacherAttendance({})]);
    requests
      .then((results) => {
        if (cancelled) return;
        if (isAdmin) {
          const [courseData, attendanceData, teacherData, rosterData] = results;
          setData({
            courses: courseData.courses || [],
            records: attendanceData.records || [],
            teachers: teacherData.teachers || [],
            rosters: rosterData.rosters || [],
          });
        } else {
          const [courseData, attendanceData] = results;
          setData({
            courses: courseData.courses || [],
            records: attendanceData.records || [],
            teachers: [],
            rosters: [],
          });
        }
        setError("");
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const totals = useMemo(() => attendanceTotals(data.records), [data.records]);
  const overallRate = totals.marked
    ? Math.round((totals.present / totals.marked) * 100)
    : 0;

  if (loading)
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading your overview…
      </p>
    );

  if (isAdmin) {
    const pending = data.teachers.filter(
      (teacher) => teacher.status === "pending",
    ).length;
    const activeTeachers = data.teachers.filter(
      (teacher) => teacher.status === "active",
    ).length;
    const tiles = [
      ["Active teachers", activeTeachers, Users],
      ["Courses", data.courses.length, BookOpen],
      ["Student lists", data.rosters.length, ClipboardList],
    ];
    return (
      <div className="space-y-6">
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        {pending > 0 && (
          <Link
            to="/admin/teachers"
            className="block rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          >
            {pending} teacher registration{pending === 1 ? "" : "s"} waiting for
            approval. Review teachers →
          </Link>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {tiles.map(([label, value, Icon], index) => (
            <div key={label} className={`rounded-xl p-4 ${tileStyles[index]}`}>
              <div className="flex items-center justify-between text-xs font-medium uppercase">
                <span>{label}</span>
                <Icon size={16} />
              </div>
              <div className="mt-3 text-2xl font-bold">{value}</div>
            </div>
          ))}
        </div>
        <SemesterAttendanceOverview records={data.records} isAdmin />
        <div className="grid gap-3 text-center sm:grid-cols-2">
          <Link
            to="/admin/teachers"
            className="rounded-xl border border-[#0297de] bg-white p-4 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
          >
            Manage teacher accounts
          </Link>
          <Link
            to="/admin/courses"
            className="rounded-xl border border-[#0297de] bg-white p-4 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
          >
            Manage courses
          </Link>
          <Link
            to="/admin/assignments"
            className="rounded-xl border border-[#0297de] bg-white p-4 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
          >
            Assign teachers and lists
          </Link>
          <Link
            to="/admin/reports"
            className="rounded-xl border border-[#0297de] bg-white p-4 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
          >
            View reports →
          </Link>
        </div>
      </div>
    );
  }

  const courseRows = data.courses.map((course) => {
    const assignmentId = String(course.assignment?._id || "");
    const records = data.records.filter(
      (record) =>
        String(record.course?._id || record.course) === String(course._id) &&
        record.assignmentId === assignmentId,
    );
    const totalsForCourse = attendanceTotals(records);
    const rate = totalsForCourse.marked
      ? Math.round((totalsForCourse.present / totalsForCourse.marked) * 100)
      : null;
    return { course, records, rate };
  });

  return (
    <div className="space-y-7">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Assigned sections", data.courses.length, BookOpen],
          ["Sessions recorded", data.records.length, CheckCheck],
          [
            "Overall attendance",
            totals.marked ? `${overallRate}%` : "—",
            ClipboardList,
          ],
        ].map(([label, value, Icon], index) => (
          <div key={label} className={`rounded-xl p-4 ${tileStyles[index]}`}>
            <div className="flex items-center justify-between text-xs font-medium uppercase">
              <span>{label}</span>
              <Icon size={16} />
            </div>
            <div className="mt-3 text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
            Your courses
          </h2>
          <Link
            to="/teacher/courses"
            className="text-xs font-semibold text-emerald-800 hover:underline"
          >
            All courses →
          </Link>
        </div>
        {courseRows.length ? (
          <div className="space-y-3">
            {courseRows.map(({ course, records, rate }) => (
              <article
                key={`${course._id}-${course.assignment?._id}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {course.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {course.code} ·{" "}
                      {course.assignment?.semester || "No semester"} ·{" "}
                      {course.assignment?.section
                        ? `Section ${course.assignment.section}`
                        : "No section"}
                      {course.assignment?.classTime
                        ? ` · ${course.assignment.classTime}`
                        : ""}
                    </p>
                  </div>
                  <Link
                    to="/teacher/attendance"
                    className="rounded-lg bg-[#0297de] px-3 py-2 text-xs font-semibold text-white hover:bg-[#027fb9]"
                  >
                    Take attendance
                  </Link>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${rate || 0}%` }}
                    />
                  </div>
                  <span className="min-w-10 text-right text-xs font-semibold text-slate-700">
                    {rate === null ? "—" : `${rate}%`}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {records.length} session{records.length === 1 ? "" : "s"} ·
                  Attendance can be recorded anytime
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm text-slate-600">
              No courses have been assigned to you yet.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Your administrator can assign a course and student list.
            </p>
          </div>
        )}
      </section>
      <SemesterAttendanceOverview records={data.records} isAdmin={false} />
    </div>
  );
}
