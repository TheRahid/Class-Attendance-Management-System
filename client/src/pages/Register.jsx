import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { registerTeacher } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

export default function Register() {
  const { account } = useAuth();
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
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-xl font-bold text-slate-900">
          rollcall<span className="text-emerald-600">.</span>
        </div>

        <h1 className="mt-8 text-2xl font-bold text-slate-900">
          Teacher registration
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          An administrator must approve your account before you can log in.
        </p>

        {success ? (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            {success}
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
                {...register("name", {
                  required: "Enter your name.",
                  pattern: {
                    value: /^[A-Za-z][A-Za-z .'-]{1,59}$/,
                    message: "Use letters, spaces, apostrophes, dots, or hyphens.",
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
                type="email"
                className={inputClass}
                {...register("email", {
                  required: "Enter your email.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
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
              <input
                type="password"
                className={inputClass}
                {...register("password", {
                  required: "Create a password.",
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                    message: "Use 8+ characters with at least one letter and one number.",
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
      </section>
    </main>
  );
}