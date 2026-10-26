import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChartNoAxesColumn,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppLayout() {
  const { account, logout } = useAuth();
  const navigate = useNavigate();

  const links =
    account.role === "admin"
      ? [
          ["/overview", "Overview", LayoutDashboard],
          ["/admin/teachers", "Teachers", Users],
          ["/admin/courses", "Courses", BookOpen],
        ]
      : [
          ["/overview", "Overview", LayoutDashboard],
          ["/teacher/courses", "My Courses", BookOpen],
          ["/teacher/attendance", "Attendance", ClipboardCheck],
          ["/teacher/reports", "Reports", ChartNoAxesColumn],
        ];

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 p-0 sm:p-5">
      <div className="mx-auto flex min-h-screen max-w-7xl overflow-hidden bg-white shadow-sm sm:min-h-[calc(100vh-2.5rem)] sm:rounded-2xl">
        <aside className="flex w-56 shrink-0 flex-col bg-slate-900 p-4 text-white">
          <div className="mb-9 px-2 text-xl font-bold">
            rollcall<span className="text-emerald-400">.</span>
          </div>

          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>

          <nav className="space-y-1">
            {links.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-4">
            <div className="text-sm font-semibold">{account.name}</div>
            <div className="mt-1 text-xs capitalize text-slate-400">
              {account.role}
              {account.department ? ` · ${account.department}` : ""}
            </div>
            <button
              onClick={signOut}
              className="mt-4 flex items-center gap-2 text-xs text-slate-300 hover:text-white"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-5 sm:p-8">
          <header className="mb-8">
            <p className="text-xs text-slate-500">
              {account.role === "admin" ? "Administration" : "Teacher workspace"}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {account.role === "admin" ? "Admin dashboard" : "Overview"}
            </h1>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}