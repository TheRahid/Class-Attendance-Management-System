
import { useCallback, useEffect, useState } from "react";
import {
  fetchTeachers,
  updateTeacherStatus,
} from "../api/auth.js";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadTeachers = useCallback(async () => {
    setLoading(true);

    try {
      const result = await fetchTeachers();
      setTeachers(result.teachers);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const result = await fetchTeachers();

        if (!ignore) {
          setTeachers(result.teachers);
          setError("");
        }
      } catch (requestError) {
        if (!ignore) {
          setError(requestError.message || "Failed to load teachers.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  async function changeStatus(id, status) {
    try {
      setUpdatingId(id);
      setError("");

      await updateTeacherStatus(id, status);
      await loadTeachers();
    } catch (requestError) {
      setError(requestError.message || "Failed to update teacher status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        Teachers
      </h2>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-150 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
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
                  <div className="font-semibold">{teacher.name}</div>
                  <div className="text-xs text-slate-500">
                    {teacher.email}
                  </div>
                </td>

                <td className="px-4 py-3">
                  {teacher.department}
                </td>

                <td className="px-4 py-3 capitalize">
                  {teacher.status}
                </td>

                <td className="px-4 py-3">
                  {teacher.status === "pending" ? (
                    <button
                      disabled={updatingId === teacher._id}
                      onClick={() =>
                        changeStatus(teacher._id, "active")
                      }
                      className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === teacher._id
                        ? "Updating..."
                        : "Approve"}
                    </button>
                  ) : (
                    <button
                      disabled={updatingId === teacher._id}
                      onClick={() =>
                        changeStatus(
                          teacher._id,
                          teacher.status === "active"
                            ? "suspended"
                            : "active"
                        )
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatingId === teacher._id
                        ? "Updating..."
                        : teacher.status === "active"
                          ? "Suspend"
                          : "Reactivate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <p className="p-5 text-sm text-slate-500">
            Loading teachers…
          </p>
        )}

        {!loading && teachers.length === 0 && !error && (
          <p className="p-5 text-sm text-slate-500">
            No teacher registrations yet.
          </p>
        )}
      </div>
    </section>
  );
}
