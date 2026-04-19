"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchSalaries } from "@/lib/api";
import { userMessages } from "@/lib/userMessages";
import { useAuth } from "@/context/AuthContext";
import { SalaryCard } from "@/components/SalaryCard";
import type { SalarySearchResult } from "@/lib/types";

export function HomeRecentSubmissions() {
  const { auth, isLoggedIn } = useAuth();
  const [salaries, setSalaries] = useState<SalarySearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.ready) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchSalaries({}, isLoggedIn ? auth.token : null)
      .then((data) => {
        if (!cancelled) setSalaries(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError(userMessages.couldNotLoadSalaries);
          setSalaries([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.ready, auth.token, isLoggedIn]);

  if (!auth.ready || loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
        Loading recent submissions…
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {error}
        </div>
      )}
      {!error && salaries.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center text-slate-500 dark:border-slate-600 dark:bg-slate-900/30 dark:text-slate-400">
          No salaries yet. Be the first to{" "}
          <Link href="/submit" className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
            submit
          </Link>
          .
        </div>
      )}
      {!error && salaries.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {salaries.slice(0, 9).map((s) => (
            <li key={s.id}>
              <SalaryCard salary={s} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
