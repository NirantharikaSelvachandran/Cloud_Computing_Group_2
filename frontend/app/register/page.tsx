"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FormFieldError } from "@/components/FormFieldError";
import { userMessages } from "@/lib/userMessages";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type FieldErrors = { email?: string; password?: string; confirm?: string };

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  function validate(): boolean {
    const next: FieldErrors = {};
    const em = email.trim();
    if (!em) next.email = "Email is required.";
    else if (!emailOk(em)) next.email = "Please enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (!confirm) next.confirm = "Please confirm your password.";
    else if (password !== confirm) next.confirm = "Passwords do not match.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim(), password);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : userMessages.signUpProblem);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600"
    }`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/50">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Register to vote on submissions and report issues. Your email is never stored with salary data.
        </p>
        <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={fieldErrors.email ? "true" : "false"}
              aria-describedby={fieldErrors.email ? "reg-email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
              className={inputClass(!!fieldErrors.email)}
            />
            <FormFieldError id="reg-email-error" message={fieldErrors.email} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={fieldErrors.password ? "true" : "false"}
              aria-describedby={fieldErrors.password ? "reg-password-error" : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((f) => ({ ...f, password: undefined, confirm: undefined }));
              }}
              className={inputClass(!!fieldErrors.password)}
            />
            <FormFieldError id="reg-password-error" message={fieldErrors.password} />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              aria-invalid={fieldErrors.confirm ? "true" : "false"}
              aria-describedby={fieldErrors.confirm ? "reg-confirm-error" : undefined}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setFieldErrors((f) => ({ ...f, confirm: undefined }));
              }}
              className={inputClass(!!fieldErrors.confirm)}
            />
            <FormFieldError id="reg-confirm-error" message={fieldErrors.confirm} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
