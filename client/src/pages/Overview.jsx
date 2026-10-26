import { useAuth } from "../context/AuthContext.jsx";

export default function Overview() {
  const { account } = useAuth();

  if (account.role === "admin") {
    return (
      <section className="rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Teacher account management
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Open the Teachers page to approve or suspend teacher accounts.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Classes today", "0", "bg-emerald-50"],
          ["To mark", "0", "bg-amber-50"],
          ["Semester rate", "—", "bg-slate-100"],
        ].map(([label, value, color]) => (
          <div key={label} className={`rounded-xl p-5 ${color}`}>
            <div className="text-xs uppercase text-slate-600">{label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase text-slate-800">Up next</h2>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 text-sm text-slate-600">
          Your assigned courses will appear here.
        </div>
      </section>
    </div>
  );
}