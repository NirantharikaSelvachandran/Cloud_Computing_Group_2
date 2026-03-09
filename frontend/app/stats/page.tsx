"use client";

import { useState, useEffect } from "react";
import { getStats } from "@/lib/api";
import type { StatsResult } from "@/lib/types";

export default function StatsPage() {
  const [country, setCountry] = useState("");
  const [role, setRole] = useState("");
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!country.trim() && !role.trim()) {
        setStats(null);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await getStats({ country: country || undefined, role: role || undefined });
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load stats");
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const t = setTimeout(run, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [country, role]);

  function formatNum(n: number, currency: string) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(n);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Salary statistics</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Aggregated insights by location and role. No login required.
      </p>

      <div className="mt-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="stats-country" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Country
          </label>
          <input
            id="stats-country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. UK"
            className="mt-1 w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="stats-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Role
          </label>
          <input
            id="stats-role"
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Software Engineer"
            className="mt-1 w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-6 text-slate-500 dark:text-slate-400">Loading statistics…</div>
      )}

      {!loading && !error && stats && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Summary</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Based on {stats.count} submission{stats.count !== 1 ? "s" : ""} ({stats.currency} {stats.period})
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Average</dt>
              <dd className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatNum(stats.average, stats.currency)}
              </dd>
            </div>
            {stats.median != null && (
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Median</dt>
                <dd className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {formatNum(stats.median, stats.currency)}
                </dd>
              </div>
            )}
            {stats.p25 != null && (
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">25th %</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {formatNum(stats.p25, stats.currency)}
                </dd>
              </div>
            )}
            {stats.p75 != null && (
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">75th %</dt>
                <dd className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {formatNum(stats.p75, stats.currency)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {!loading && !stats && (country || role) && !error && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-8 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
          No statistics available for this filter. Try different values or ensure the stats service is running.
        </div>
      )}

      {!country && !role && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900/50">
          <p className="text-slate-600 dark:text-slate-400">
            Enter a country and/or role above to see aggregated salary statistics.
          </p>
        </div>
      )}
    </div>
  );
}
