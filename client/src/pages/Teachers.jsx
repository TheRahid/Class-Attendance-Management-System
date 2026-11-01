import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteTeacherAccount,
  fetchTeachers,
  setTeacherStatus,
} from "../api/auth.js";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  let cancelled = false;

  async function loadTeachers() {
    try {
      const result = await fetchTeachers();

      if (cancelled) return;

      setTeachers(result.teachers || []);
      setError("");
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

  loadTeachers();

  return () => {
    cancelled = true;
  };
}, []);

  async function refreshTeachers() {
  try {
    const result = await fetchTeachers();
    setTeachers(result.teachers || []);
    setError("");
  } catch (requestError) {
    setError(requestError.message);
  }
}
  async function changeStatus(id, status) {
  try {
    setError("");
    await setTeacherStatus(id, status);
    await refreshTeachers();
  } catch (requestError) {
    setError(requestError.message);
  }
}

  async function removeTeacher(teacher) {
    const confirmed = window.confirm(
      `Delete ${teacher.name}'s account? Their course assignments will be removed, but attendance history will be kept.`,
    );
    if (!confirmed) return;

    setDeletingId(teacher._id);
    setError("");
    setNotice("");
    try {
      const result = await deleteTeacherAccount(teacher._id);
      setTeachers((current) =>
        current.filter((item) => item._id !== teacher._id),
      );
      setNotice(result.message || "Teacher account deleted.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDeletingId("");
    }
  }

  const pendingCount = teachers.filter(
    (teacher) => teacher.status === "pending",
  ).length;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          {/* <h2 className="text-lg font-bold text-slate-900">Teachers</h2> */}
          <p className="mt-1 text-sm text-slate-500">
            Approve registrations or suspend teacher access.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          {pendingCount} pending
        </span>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teachers.map((teacher) => (
              <tr key={teacher._id}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-slate-800">
                    {teacher.name}
                  </div>
                  <div className="text-xs text-slate-500">{teacher.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {teacher.department}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${teacher.status === "active" ? "bg-emerald-50 text-emerald-700" : teacher.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {teacher.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {teacher.status === "pending" ? (
                      <button
                        onClick={() => changeStatus(teacher._id, "active")}
                        className="rounded-lg bg-[#0297de] px-3 py-2 text-xs font-semibold text-white hover:bg-[#027fb9]"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          changeStatus(
                            teacher._id,
                            teacher.status === "active"
                              ? "suspended"
                              : "active",
                          )
                        }
                        className="rounded-lg border border-[#0297de] px-3 py-2 text-xs font-semibold text-[#0297de] hover:bg-sky-50"
                      >
                        {teacher.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTeacher(teacher)}
                      disabled={deletingId === teacher._id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0297de] px-3 py-2 text-xs font-semibold text-[#0297de] hover:bg-sky-50 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      {deletingId === teacher._id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && teachers.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            No teacher registrations yet.
          </div>
        )}
        {loading && (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading teachers…
          </div>
        )}
      </div>
    </section>
  );
}
 