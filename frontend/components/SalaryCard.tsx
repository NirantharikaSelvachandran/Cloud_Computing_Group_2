"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { formatCurrencyAmount } from "@/lib/currencies";
import { userMessages } from "@/lib/userMessages";
import type { SalarySearchResult } from "@/lib/types";
import Link from "next/link";

function formatAmount(amount: number, currency: string, period: string) {
  const p = period === "yearly" ? "/yr" : period === "monthly" ? "/mo" : "/hr";
  return formatCurrencyAmount(amount, currency || "USD") + p;
}

export function SalaryCard({ salary, showVotes = true }: { salary: SalarySearchResult; showVotes?: boolean }) {
  const { isLoggedIn, auth, logout } = useAuth();
  const [upvotes, setUpvotes] = useState(salary.upvotes ?? 0);
  const [downvotes, setDownvotes] = useState(salary.downvotes ?? 0);
  const [voting, setVoting] = useState<"up" | "down" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showVotes || !salary.id || !auth.token) return;
    let cancelled = false;
    api
      .getVotes(salary.id, auth.token)
      .then((v) => {
        if (!cancelled) {
          setUpvotes(v.upvotes);
          setDownvotes(v.downvotes);
        }
      })
      .catch((e) => {
        if (!cancelled && e instanceof api.UnauthorizedError) {
          setUpvotes(salary.upvotes ?? 0);
          setDownvotes(salary.downvotes ?? 0);
          logout();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showVotes, salary.id, salary.upvotes, salary.downvotes, auth.token, logout]);

  const handleVote = useCallback(
    async (voteType: "UP" | "DOWN") => {
      if (!isLoggedIn || !salary.id || !auth.token) {
        setError("Sign in to vote");
        return;
      }
      setError("");
      setVoting(voteType === "UP" ? "up" : "down");
      try {
        await api.vote(salary.id, voteType, auth.token);
        const v = await api.getVotes(salary.id, auth.token);
        setUpvotes(v.upvotes);
        setDownvotes(v.downvotes);
      } catch (e) {
        if (e instanceof api.UnauthorizedError) {
          setUpvotes(salary.upvotes ?? 0);
          setDownvotes(salary.downvotes ?? 0);
          logout();
          setError(e.message);
        } else {
          setError(e instanceof Error ? e.message : userMessages.couldNotVote);
        }
      } finally {
        setVoting(null);
      }
    },
    [isLoggedIn, salary.id, auth.token, salary.upvotes, salary.downvotes, logout]
  );

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900 dark:text-white">{salary.role}</p>
            {salary.status && salary.status.toUpperCase() !== "APPROVED" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                Pending approval
              </span>
            )}
          </div>
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
