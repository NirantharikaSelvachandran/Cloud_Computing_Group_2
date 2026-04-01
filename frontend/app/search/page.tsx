"use client";

import { useState } from "react";
import { searchSalaries } from "@/lib/api";
import { SalaryCard } from "@/components/SalaryCard";
import type { SalarySearchResult, SalarySearchFilters } from "@/lib/types";

const LEVELS = ["Junior", "Mid", "Senior", "Lead", "Principal", "Other"];

export default function SearchPage() {
  const [filters, setFilters] = useState<SalarySearchFilters>({});
  const [results, setResults] = useState<SalarySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchSalaries(filters);
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search salaries</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Filter by country, company, role, and level. No login required.
      </p>

      <form onSubmit={handleSearch} className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Country
            </label>
            <input
              id="country"
              type="text"
              value={filters.country ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value || undefined }))}
              placeholder="e.g. UK, Sri Lanka"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Company
            </label>
            <input
              id="company"
              type="text"
              value={filters.company ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, company: e.target.value || undefined }))}
              placeholder="Company name"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>
            <input
              id="role"
              type="text"
              value={filters.role ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value || undefined }))}
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
              value={filters.level ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, level: e.target.value || undefined }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Any</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters({});
              setResults([]);
              setSearched(false);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium dark:border-slate-600 dark:text-slate-300"
          >
            Clear
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {searched && !loading && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </h2>
          {results.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No salaries match your filters.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((s) => (
                <li key={s.id}>
                  <SalaryCard salary={s} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
