import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { registerTeacher } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import AuthFrame from "../components/AuthFrame.jsx";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const personPattern = /^[A-Za-z][A-Za-z .'-]{1,59}$/;
const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

export default function Register() {
  const { account } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  if (account) return <Navigate to="/overview" replace />;

  async function submit(values) {
    setServerError("");
    try {
      const result = await registerTeacher(values);
      setSuccess(result.message);
    } catch (error) {
      setServerError(error.message);
    }
  }

  return (
    <AuthFrame
      title="Teacher registration"
      subtitle="An administrator must approve your account before you can log in."
    >
      {success ? (
        <div
          role="status"
          className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {success}
          <p className="mt-3">
            <Link className="font-semibold underline" to="/login">
              Go to login
            </Link>
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(submit)}
          className="mt-6 space-y-4"
          noValidate
        >
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              className={inputClass}
              autoComplete="name"
              {...register("name", {
                required: "Enter your name.",
                pattern: {
                  value: personPattern,
                  message:
                    "Use letters, spaces, apostrophes, dots, or hyphens.",
                },
              })}
            />
            {errors.name && (
              <span className="mt-1 block text-xs text-rose-600">
                {errors.name.message}
              </span>
            )}
          </label>
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
            Department
            <input
              className={inputClass}
              {...register("department", {
                required: "Enter your department.",
                pattern: {
                  value: /^[A-Za-z0-9 &().'-]{2,80}$/,
                  message: "Enter a valid department name.",
                },
              })}
            />
            {errors.department && (
              <span className="mt-1 block text-xs text-rose-600">
                {errors.department.message}
              </span>
            )}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <div className="relative">
              <input
                className={`${inputClass} pr-12`}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password", {
                  required: "Create a password.",
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                    message:
                      "Use 8+ characters with at least one letter and one number.",
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
            {isSubmitting ? "Submitting…" : "Request teacher account"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        Already approved?{" "}
        <Link className="font-semibold text-emerald-700" to="/login">
          Log in
        </Link>
      </p>
    </AuthFrame>
  );
}
 