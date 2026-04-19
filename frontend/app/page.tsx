import Link from "next/link";
import { HomeRecentSubmissions } from "@/components/HomeRecentSubmissions";

export default function HomePage() {
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
        <HomeRecentSubmissions />
      </section>
    </div>
  );
}
