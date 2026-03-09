"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitSalary } from "@/lib/api";
import type { SalarySubmission } from "@/lib/types";

const LEVELS = ["Junior", "Mid", "Senior", "Lead", "Principal", "Other"];
const CURRENCIES = ["USD", "EUR", "GBP", "LKR", "INR", "AUD", "CAD", "Other"];
const PERIODS: { value: SalarySubmission["period"]; label: string }[] = [
  { value: "yearly", label: "Per year" },
  { value: "monthly", label: "Per month" },
  { value: "hourly", label: "Per hour" },
];

const initial: SalarySubmission = {
  country: "",
  company: "",
  role: "",
  level: "Mid",
  currency: "USD",
  amount: 0,
  period: "yearly",
  experienceYears: undefined,
};

export default function SubmitPage() {
  const [form, setForm] = useState<SalarySubmission>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.country.trim() || !form.company.trim() || !form.role.trim() || form.amount <= 0) {
      setError("Please fill country, company, role, and a positive amount.");
      return;
    }
    setLoading(true);
    try {
      await submitSalary({
        ...form,
        amount: Number(form.amount),
        experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
      });
      setSuccess(true);
      setForm(initial);
      setTimeout(() => {
        router.push("/search");
        router.refresh();
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 dark:border-emerald-800 dark:bg-emerald-900/20">
          <h2 className="text-xl font-semibold text-emerald-800 dark:text-emerald-200">Thank you</h2>
          <p className="mt-2 text-emerald-700 dark:text-emerald-300">
            Your submission was recorded anonymously. The community can vote on it once it appears in search.
          </p>
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">Redirecting to search…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submit salary</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Anonymous. No login required. Your identity is never stored with this data.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/50">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Country *
            </label>
            <input
              id="country"
              type="text"
              required
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Company *
            </label>
            <input
              id="company"
              type="text"
              required
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Role *
            </label>
            <input
              id="role"
              type="text"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Software Engineer"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Level
            </label>
            <select
              id="level"
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Amount *
            </label>
            <input
              id="amount"
              type="number"
              min={1}
              required
              value={form.amount || ""}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Currency
            </label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Period
            </label>
            <select
              id="period"
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as SalarySubmission["period"] }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="experienceYears" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Years of experience (optional)
          </label>
          <input
            id="experienceYears"
            type="number"
            min={0}
            max={50}
            value={form.experienceYears ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value ? Number(e.target.value) : undefined }))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 sm:w-auto sm:min-w-[140px]"
        >
          {loading ? "Submitting…" : "Submit anonymously"}
        </button>
      </form>
    </div>
  );
}
