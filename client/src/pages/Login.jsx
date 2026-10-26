import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext.jsx";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

export default function Login() {
  const { account, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("teacher");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

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
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-xl font-bold text-slate-900">
          rollcall<span className="text-emerald-600">.</span>
        </div>

        <h1 className="mt-8 text-2xl font-bold text-slate-900">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Log in to your workspace.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {["teacher", "admin"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRole(item)}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold capitalize ${
                role === item
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
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
              type="email"
              className={inputClass}
              {...register("email", {
                required: "Enter your email.",
                pattern: {
                  value: emailRegex,
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
            <input
              type="password"
              className={inputClass}
              {...register("password", {
                required: "Enter your password.",
                pattern: {
                  value: /^.{8,}$/,
                  message: "Password must be at least 8 characters.",
                },
              })}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-rose-600">
                {errors.password.message}
              </span>
            )}
          </label>

          {serverError && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {serverError}
            </p>
          )}

          <button
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : `Log in as ${role}`}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Need a teacher account?{" "}
          <Link className="font-semibold text-emerald-700" to="/register">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}