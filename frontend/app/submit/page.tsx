"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitSalary } from "@/lib/api";
import { STATS_SUPPORTED_CURRENCIES, isStatsSupportedCurrency } from "@/lib/currencies";
import { FormFieldError } from "@/components/FormFieldError";
import { userMessages } from "@/lib/userMessages";
import type { SalarySubmission } from "@/lib/types";

const LEVELS = ["Junior", "Mid", "Senior", "Lead", "Principal", "Other"];
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

type FieldKey = "country" | "company" | "role" | "amount" | "currency" | "experienceYears";
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function SubmitPage() {
  const [form, setForm] = useState<SalarySubmission>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  function clearField(key: FieldKey) {
    setFieldErrors((f) => ({ ...f, [key]: undefined }));
  }

  function validate(): boolean {
    const err: FieldErrors = {};
    const country = form.country.trim();
    if (!country) err.country = "Country is required.";
    else if (country.length < 2) err.country = "Please enter a valid country name.";

    if (!form.company.trim()) err.company = "Company is required.";
    if (!form.role.trim()) err.role = "Role is required.";

    if (form.amount == null || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      err.amount = "Please enter a valid amount greater than zero.";
    }

    if (!isStatsSupportedCurrency(form.currency)) {
      err.currency = "Please choose a supported currency from the list.";
    }

    if (form.experienceYears != null) {
      const y = Number(form.experienceYears);
      if (!Number.isFinite(y) || y < 0 || y > 50) {
        err.experienceYears = "Years of experience must be between 0 and 50.";
      }
    }

    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await submitSalary({
        ...form,
        amount: Number(form.amount),
        experienceYears: form.experienceYears != null ? Number(form.experienceYears) : undefined,
      });
      setSuccess(true);
      setForm(initial);
      setFieldErrors({});
      setTimeout(() => {
        router.push("/search");
        router.refresh();
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : userMessages.couldNotSubmit);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `mt-1 w-full rounded-lg border bg-white px-3 py-2 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500"
        : "border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-slate-600"
    }`;

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

      <form noValidate onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/50">
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
              aria-invalid={fieldErrors.country ? "true" : "false"}
              aria-describedby={fieldErrors.country ? "submit-country-error" : undefined}
              value={form.country}
              onChange={(e) => {
                clearField("country");
                setForm((f) => ({ ...f, country: e.target.value }));
              }}
              className={inputClass(!!fieldErrors.country)}
            />
            <FormFieldError id="submit-country-error" message={fieldErrors.country} />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Company *
            </label>
            <input
              id="company"
              type="text"
              aria-invalid={fieldErrors.company ? "true" : "false"}
              aria-describedby={fieldErrors.company ? "submit-company-error" : undefined}
              value={form.company}
              onChange={(e) => {
                clearField("company");
                setForm((f) => ({ ...f, company: e.target.value }));
              }}
              className={inputClass(!!fieldErrors.company)}
            />
            <FormFieldError id="submit-company-error" message={fieldErrors.company} />
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
              aria-invalid={fieldErrors.role ? "true" : "false"}
              aria-describedby={fieldErrors.role ? "submit-role-error" : undefined}
              value={form.role}
              onChange={(e) => {
                clearField("role");
                setForm((f) => ({ ...f, role: e.target.value }));
              }}
              placeholder="e.g. Software Engineer"
              className={inputClass(!!fieldErrors.role)}
            />
            <FormFieldError id="submit-role-error" message={fieldErrors.role} />
          </div>
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Level
            </label>
            <select
              id="level"
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
              step="any"
              aria-invalid={fieldErrors.amount ? "true" : "false"}
              aria-describedby={fieldErrors.amount ? "submit-amount-error" : undefined}
              value={form.amount === 0 ? "" : form.amount}
              onChange={(e) => {
                clearField("amount");
                const v = e.target.value;
                setForm((f) => ({ ...f, amount: v === "" ? 0 : Number(v) }));
              }}
              className={inputClass(!!fieldErrors.amount)}
            />
            <FormFieldError id="submit-amount-error" message={fieldErrors.amount} />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Currency
            </label>
            <select
              id="currency"
              value={form.currency}
              onChange={(e) => {
                clearField("currency");
                setForm((f) => ({ ...f, currency: e.target.value }));
              }}
              aria-invalid={fieldErrors.currency ? "true" : "false"}
              aria-describedby={fieldErrors.currency ? "submit-currency-error" : undefined}
              className={inputClass(!!fieldErrors.currency)}
            >
              {STATS_SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FormFieldError id="submit-currency-error" message={fieldErrors.currency} />
          </div>
          <div>
            <label htmlFor="period" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Period
            </label>
            <select
              id="period"
              value={form.period}
              onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as SalarySubmission["period"] }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
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
            aria-invalid={fieldErrors.experienceYears ? "true" : "false"}
            aria-describedby={fieldErrors.experienceYears ? "submit-exp-error" : undefined}
            value={form.experienceYears ?? ""}
            onChange={(e) => {
              clearField("experienceYears");
              const v = e.target.value;
              setForm((f) => ({
                ...f,
                experienceYears: v === "" ? undefined : Number(v),
              }));
            }}
            className={inputClass(!!fieldErrors.experienceYears)}
          />
          <FormFieldError id="submit-exp-error" message={fieldErrors.experienceYears} />
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
