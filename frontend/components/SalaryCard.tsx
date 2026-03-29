"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import type { SalarySearchResult } from "@/lib/types";
import Link from "next/link";

function formatAmount(amount: number, currency: string, period: string) {
  const p = period === "yearly" ? "/yr" : period === "monthly" ? "/mo" : "/hr";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(amount) + p;
}

export function SalaryCard({ salary, showVotes = true }: { salary: SalarySearchResult; showVotes?: boolean }) {
  const { isLoggedIn, auth } = useAuth();
  const [upvotes, setUpvotes] = useState(salary.upvotes ?? 0);
  const [downvotes, setDownvotes] = useState(salary.downvotes ?? 0);
  const [voting, setVoting] = useState<"up" | "down" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showVotes || !salary.id) return;
    let cancelled = false;
    api.getVotes(salary.id).then((v) => {
      if (!cancelled) {
        setUpvotes(v.upvotes);
        setDownvotes(v.downvotes);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [salary.id, showVotes]);

  const handleVote = useCallback(
    async (voteType: "UP" | "DOWN") => {
      if (!isLoggedIn || !salary.id || !auth.userId || !auth.token) {
        setError("Sign in to vote");
        return;
      }
      setError("");
      setVoting(voteType === "UP" ? "up" : "down");
      try {
        await api.vote(salary.id, auth.userId, voteType, auth.token);
        const v = await api.getVotes(salary.id);
        setUpvotes(v.upvotes);
        setDownvotes(v.downvotes);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Vote failed");
      } finally {
        setVoting(null);
      }
    },
    [isLoggedIn, salary.id, auth.userId, auth.token]
  );

  const id = salary.id;
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{salary.role}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {salary.company} · {salary.country}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">
            {salary.level}
            {salary.experienceYears != null ? ` · ${salary.experienceYears} yrs` : ""}
          </p>
        </div>
        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {formatAmount(salary.amount, salary.currency, salary.period)}
        </p>
      </div>
      {showVotes && (
        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-500">Trustworthy?</span>
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={() => handleVote("UP")}
                disabled={!!voting}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800 disabled:opacity-50"
                aria-label="Upvote"
              >
                ↑ {upvotes}
              </button>
              <button
                type="button"
                onClick={() => handleVote("DOWN")}
                disabled={!!voting}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800 disabled:opacity-50"
                aria-label="Downvote"
              >
                ↓ {downvotes}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Log in to vote
            </Link>
          )}
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
        </div>
      )}
    </article>
  );
}
