"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FormFieldError } from "@/components/FormFieldError";
import { userMessages } from "@/lib/userMessages";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

type FieldErrors = { email?: string; password?: string };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function validate(): boolean {
    const next: FieldErrors = {};
    const em = email.trim();
    if (!em) next.email = "Email is required.";
    else if (!emailOk(em)) next.email = "Please enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : userMessages.signInProblem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/50">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Required for voting and reporting. Your identity is never linked to salary data.
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
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((f) => ({ ...f, email: undefined }));
              }}
              className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white ${
                fieldErrors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600"
              }`}
            />
            <FormFieldError id="email-error" message={fieldErrors.email} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={fieldErrors.password ? "true" : "false"}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((f) => ({ ...f, password: undefined }));
              }}
              className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 dark:bg-slate-800 dark:text-white ${
                fieldErrors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
                  : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600"
              }`}
            />
            <FormFieldError id="password-error" message={fieldErrors.password} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          No account?{" "}
          <Link href="/register" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
