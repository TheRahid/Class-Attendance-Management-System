import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Pencil, Plus, Save, X } from "lucide-react";
import {
  createAdminRoster,
  fetchAdminRosters,
  updateAdminRoster,
} from "../api/courses.js";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const blankGroup = { department: "", batchNumber: "", section: "A" };

export default function StudentRosters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const createMode = searchParams.get("new") === "1";
  const editingRosterId = searchParams.get("rosterId") || "";
  const [rosters, setRosters] = useState([]);
  const [group, setGroup] = useState(blankGroup);
  const [students, setStudents] = useState([]);
  const [draft, setDraft] = useState({
    studentId: "",
    name: "",
    department: "",
  });

  const formOpen = createMode || Boolean(editingRosterId);

const editing = rosters.find(
  (roster) => roster._id === editingRosterId
) || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  

  useEffect(() => {
  let cancelled = false;

  async function loadRosters() {
    try {
      const result = await fetchAdminRosters();

      if (cancelled) return;

      setRosters(result.rosters || []);
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

  loadRosters();

  return () => {
    cancelled = true;
  };
}, []);

  

  function startCreate() {
    setError("");
    setNotice("");
    setSearchParams({ new: "1" });
  }

  function startEdit(roster) {
    setError("");
    setNotice("");
    setSearchParams({ rosterId: roster._id });
  }

  function closeEditor() {
  setSearchParams({}, { replace: true });
}

  function addStudent(event) {
    event.preventDefault();
    const studentId = draft.studentId.trim();
    const name = draft.name.trim();
    const department = draft.department.trim();

    if (!/^[A-Za-z0-9-]{1,30}$/.test(studentId)) {
      setError("Student ID must contain 1–30 letters, numbers, or hyphens.");
      return;
    }
    if (!name || name.length > 100) {
      setError("Enter a student name (up to 100 characters).");
      return;
    }
    if (
      students.some(
        (student) =>
          student.studentId.toLowerCase() === studentId.toLowerCase(),
      )
    ) {
      setError("That student ID is already on this roster.");
      return;
    }

    setStudents((current) => [...current, { studentId, name, department }]);
    setDraft({ studentId: "", name: "", department: "" });
    setError("");
  }

  function removeStudent(studentId) {
    setStudents((current) =>
      current.filter((student) => student.studentId !== studentId),
    );
  }

  async function saveRoster(event) {
  event.preventDefault();
  setError("");
  setNotice("");
  setSaving(true);

  try {
    if (editing) {
      await updateAdminRoster(editing._id, students);
      setNotice("Student list updated.");
    } else {
      await createAdminRoster({ ...group, students });
      setNotice("Student roster created. You can now assign it to courses.");
    }

    closeEditor();

    // Refresh roster list
    const result = await fetchAdminRosters();
    setRosters(result.rosters || []);
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
          {/* <h2 className="text-lg font-bold text-slate-900">Student lists</h2> */}
          <p className="mt-1 text-sm text-slate-500">
            Create one list for each department, batch, and section. Select the
            semester separately for each teaching assignment.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9]"
        >
          <Plus size={16} /> New student list
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
          onSubmit={saveRoster}
          className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                {editing ? "Edit student list" : "Create student list"}
              </h3>
              {editing && (
                <p className="mt-1 text-xs text-slate-500">
                  This list is shared with every course assigned to this
                  section.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={closeEditor}
              aria-label="Close form"
              className="rounded-md p-1 text-[#0297de] hover:bg-sky-50"
            >
              <X size={18} />
            </button>
          </div>

          {editing && (
            <p className="mb-3 text-xs text-slate-500">
              The batch number identifies this student group and cannot be
              changed after creation. Select a semester from 1st to 8th when
              assigning the list to a course.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-600">
              Department
              <input
                required
                disabled={Boolean(editing)}
                value={group.department}
                onChange={(event) =>
                  setGroup({ ...group, department: event.target.value })
                }
                className={inputClass}
                placeholder="Computer Science"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Batch number
              <input
                required
                disabled={Boolean(editing)}
                maxLength={30}
                value={group.batchNumber}
                onChange={(event) =>
                  setGroup({ ...group, batchNumber: event.target.value })
                }
                className={inputClass}
                placeholder="2026"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Section
              <input
                required
                disabled={Boolean(editing)}
                value={group.section}
                onChange={(event) =>
                  setGroup({ ...group, section: event.target.value })
                }
                className={inputClass}
                placeholder="A"
              />
            </label>
          </div>

          <div className="mt-5">
            <h4 className="mb-2 text-sm font-semibold text-slate-800">
              Students ({students.length})
            </h4>
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white">
              {students.length ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Student ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.studentId}>
                        <td className="px-3 py-2">{student.studentId}</td>
                        <td className="px-3 py-2">{student.name}</td>
                        <td className="px-3 py-2">
                          {student.department || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeStudent(student.studentId)}
                            className="text-xs font-semibold text-[#0297de] hover:text-[#027fb9]"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-5 text-center text-sm text-slate-500">
                  No students added to this list yet.
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-slate-600">
              Add a student
            </p>
            <div className="grid gap-3 sm:grid-cols-4">
              <input
                aria-label="Student ID"
                value={draft.studentId}
                onChange={(event) =>
                  setDraft({ ...draft, studentId: event.target.value })
                }
                className={inputClass}
                placeholder="Student ID"
              />
              <input
                aria-label="Student name"
                value={draft.name}
                onChange={(event) =>
                  setDraft({ ...draft, name: event.target.value })
                }
                className={inputClass}
                placeholder="Student name"
              />
              <input
                aria-label="Student department"
                value={draft.department}
                onChange={(event) =>
                  setDraft({ ...draft, department: event.target.value })
                }
                className={inputClass}
                placeholder="Department (optional)"
              />
              <button
                type="button"
                onClick={addStudent}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#0297de] px-3 py-2.5 text-sm font-semibold text-[#0297de] hover:bg-sky-50"
              >
                <Plus size={15} /> Add student
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-lg border border-[#0297de] bg-white px-4 py-2.5 text-sm text-[#0297de] hover:bg-sky-50"
            >
              Cancel
            </button>
            <button
              disabled={saving || students.length === 0}
              className="rounded-lg bg-[#0297de] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#027fb9] disabled:opacity-50"
            >
              <Save size={15} className="mr-2 inline" />
              {saving ? "Saving…" : editing ? "Save list" : "Create list"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rosters.map((roster) => (
          <article
            key={roster._id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {roster.department}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Batch {roster.batchNumber || roster.semester || "—"} · Section{" "}
                  {roster.section}
                </p>
              </div>
              <button
                onClick={() => startEdit(roster)}
                className="rounded-lg border border-[#0297de] p-2 text-[#0297de] hover:bg-sky-50"
                aria-label={`Edit ${roster.section} roster`}
              >
                <Pencil size={15} />
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-700">
              {roster.students.length} students
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Assign this list to courses and choose its semester in Teaching
              Assignments.
            </p>
          </article>
        ))}
      </div>

      {loading && (
        <p className="p-8 text-center text-sm text-slate-500">
          Loading student lists…
        </p>
      )}
      {!loading && rosters.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <ClipboardList className="mx-auto mb-2 text-slate-300" size={24} />
          <p className="text-sm text-slate-600">
            No student lists yet. Create a batch and section list before adding
            its courses.
          </p>
        </div>
      )}
    </section>
  );
}
 