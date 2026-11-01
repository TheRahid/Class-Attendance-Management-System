import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import AuthFrame from "../components/AuthFrame.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

export default function Login() {
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("teacher");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });
  if (account) return <Navigate to="/overview" replace />;

  async function submit(values) {
    setServerError("");
    try {
      await login({ ...values, role });
      navigate("/overview", { replace: true });
    } catch (error) {
      setServerError(error.message);
    }
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Log in to your Chronos workspace."
    >
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {["teacher", "admin"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRole(item)}
            className={`rounded-lg px-3 py-2.5 text-sm font-semibold capitalize ${role === item ? "bg-[#0297de] text-white shadow-sm" : "text-[#0297de] hover:bg-sky-50"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <form
        onSubmit={handleSubmit(submit)}
        className="mt-6 space-y-4"
        noValidate
      >
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            {...register("email", {
              required: "Enter your email.",
              pattern: {
                value: emailPattern,
                message: "Enter a valid email address.",
              },
            })}
          />
          {errors.email && (
            <span className="mt-1 block text-xs text-rose-600">
              {errors.email.message}
            </span>
          )}
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <div className="relative">
            <input
              className={`${inputClass} pr-12`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password", {
                required: "Enter your password.",
                pattern: {
                  value: /^.{8,}$/,
                  message: "Password must be at least 8 characters.",
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#0297de] hover:bg-sky-50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <span className="mt-1 block text-xs text-rose-600">
              {errors.password.message}
            </span>
          )}
        </label>
        {serverError && (
          <p
            role="alert"
            className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {serverError}
          </p>
        )}
        <button
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#0297de] px-4 py-3 text-sm font-semibold text-white hover:bg-[#027fb9] disabled:opacity-60"
        >
          {isSubmitting ? "Signing in…" : `Log in as ${role}`}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Teacher account needed?{" "}
        <Link className="font-semibold text-emerald-700" to="/register">
          Register
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-slate-400">
        Admin account is configured by the project administrator.
      </p>
    </AuthFrame>
  );
}
