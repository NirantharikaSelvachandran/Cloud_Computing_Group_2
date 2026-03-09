import Link from "next/link";
import { searchSalaries } from "@/lib/api";
import { SalaryCard } from "@/components/SalaryCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let salaries: Awaited<ReturnType<typeof searchSalaries>> = [];
  let error: string | null = null;
  try {
    salaries = await searchSalaries({});
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load salaries";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Tech salary transparency, by the community
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400">
          Submit anonymously. Search by country, company, and role. Log in only to vote and help surface trustworthy data.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/search"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
          >
            Search salaries
          </Link>
          <Link
            href="/submit"
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Submit salary
          </Link>
          <Link
            href="/stats"
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            View statistics
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">Recent submissions</h2>
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {error}. Make sure the BFF and search service are running.
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
      </section>
    </div>
  );
}
