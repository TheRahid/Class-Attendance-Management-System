import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChartNoAxesColumn,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Brand from "./Brand.jsx";

export default function AppLayout() {
  const { account, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const displayName = account.role === "admin" ? "Administrator" : account.name;
  const links =
    account.role === "admin"
      ? [
          ["/overview", "Overview", LayoutDashboard],
          ["/admin/teachers", "Teachers", Users],
          ["/admin/rosters", "Student Lists", ClipboardList],
          ["/admin/courses", "Courses", BookOpen],
          ["/admin/assignments", "Teaching Assignments", ClipboardCheck],
          ["/admin/reports", "Reports", ChartNoAxesColumn],
        ]
      : [
          ["/overview", "Overview", LayoutDashboard],
          ["/teacher/courses", "My Courses", BookOpen],
          ["/teacher/attendance", "Attendance", ClipboardCheck],
          ["/teacher/reports", "Reports", ChartNoAxesColumn],
        ];
  const title =
    links.find(([to]) => location.pathname === to)?.[1] ||
    (account.role === "admin" ? "Admin dashboard" : "Overview");

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-600 pl-0 pr-0 pb-0 sm:pr-4 lg:pr-6">
      <div className="relative mx-auto flex min-h-screen w-full max-w-360 flex-col bg-white shadow-sm after:absolute after:inset-y-0 after:right-0 after:z-40 after:w-0.5 after:bg-linear-to-b after:from-[#02070A] after:to-[#1d8abd] after:content-[''] sm:rounded-2xl md:flex-row">
        <aside className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center gap-2 bg-linear-to-b from-[#02070A] to-[#0297de] px-3 text-white md:h-screen md:w-18 md:flex-col md:items-stretch md:gap-0 md:rounded-l-2xl md:p-2 lg:sticky lg:top-0 lg:w-56 lg:p-4">
          <div className="shrink-0 px-1 md:mb-6 md:px-0 lg:mb-9 lg:px-2">
            <Brand inverse centered compact />
          </div>
          <p className="mb-2 hidden px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 lg:block">
            Workspace
          </p>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={
              mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
            className="ml-auto rounded-lg p-2 text-white/90 hover:bg-white/10 md:hidden"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <nav
            id="primary-navigation"
            className={`${mobileMenuOpen ? "grid" : "hidden"} absolute left-0 right-0 top-full z-30 grid-cols-2 gap-1  p-3 shadow-lg md:static md:block md:flex-1 md:space-y-1 md:bg-transparent md:p-0 md:shadow-none`}
          >
            {links.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-xs ${isActive ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/10"} md:justify-center md:px-2 md:py-2.5 lg:justify-start lg:gap-3 lg:px-3 lg:text-sm`
                }
              >
                <Icon size={16} />
                <span className="md:hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto hidden border-t border-white/10 pt-4 lg:block">
            <div className="truncate text-sm font-semibold">{displayName}</div>
            <div className="mt-1 text-xs capitalize text-shadow-white">
              {account.role == "Teacher" ? "Teacher" : ""}
              {account.department ? `  ${account.department}` : ""}
            </div>
            <button
              onClick={signOut}
              className="mt-4 flex items-center gap-2 text-xs text-slate-300 hover:text-white"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
          <button
            onClick={signOut}
            aria-label="Log out"
            className="shrink-0 rounded-lg p-2 text-white/90 hover:bg-white/10 md:mt-auto lg:hidden"
          >
            <LogOut size={16} />
          </button>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8 xl:p-10">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8">
            <div>
              {account.role !== "admin" && (
                <p className="text-xs text-slate-500">Teacher workspace</p>
              )}
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {title}
              </h1>
            </div>
            <span className="max-w-[45vw] truncate rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600 sm:max-w-none">
              {displayName}
            </span>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
