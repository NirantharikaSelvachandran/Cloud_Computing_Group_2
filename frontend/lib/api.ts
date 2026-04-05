// BFF API client - all requests go through the Backend-for-Frontend

import { getEmailFromAccessToken } from "./jwt";
import type { AuthResponse } from "./types";

const BFF_BASE = process.env.NEXT_PUBLIC_BFF_URL || "";

function parseErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.title === "string") return o.title;
    const errs = o.errors;
    if (errs && typeof errs === "object") {
      const first = Object.values(errs as Record<string, string[]>).flat()[0];
      if (first) return String(first);
    }
  }
  return fallback;
}

/** Maps identity-service JSON (`accessToken`, `userId`) to the shape AuthContext expects. */
function normalizeAuth(data: Record<string, unknown>): AuthResponse {
  const accessToken =
    (typeof data.accessToken === "string" && data.accessToken) ||
    (typeof data.token === "string" && data.token) ||
    "";
  const userId = data.userId != null ? String(data.userId) : "";
  const email =
    (typeof data.email === "string" && data.email) || getEmailFromAccessToken(accessToken) || undefined;
  return { token: accessToken, userId, email, accessToken, refreshToken: typeof data.refreshToken === "string" ? data.refreshToken : undefined };
}

function bff(path: string, init?: RequestInit): Promise<Response> {
  const url = BFF_BASE ? `${BFF_BASE}${path}` : path;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

function withAuth(token: string | null) {
  return (path: string, init?: RequestInit) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...init?.headers,
    };
    if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    const url = BFF_BASE ? `${BFF_BASE}${path}` : path;
    return fetch(url, { ...init, headers });
  };
}

// Salaries
export async function submitSalary(data: import("./types").SalarySubmission) {
  const res = await bff("/api/salaries/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, res.statusText));
  }
  return res.json();
}

export async function getSalary(id: string) {
  const res = await bff(`/api/salaries/${id}`);
  if (!res.ok) throw new Error("Salary not found");
  return res.json();
}

// Search — search-service via gateway: `/api/search` (all approved) or `/api/search/filter?…` when the gateway routes it.
// If `/api/search/filter` is not configured in Ocelot (404), falls back to `/api/search` and applies filters in the browser.
export async function searchSalaries(params: import("./types").SalarySearchFilters) {
  const search = buildSearchServiceQuery(params);
  const q = search.toString();

  let list: import("./types").SalarySearchResult[];

  if (q) {
    const filterRes = await bff(`/api/search/filter?${q}`);
    if (filterRes.ok) {
      list = (await filterRes.json()) as import("./types").SalarySearchResult[];
    } else if (filterRes.status === 404) {
      const allRes = await bff("/api/search");
      if (!allRes.ok) throw new Error("Search failed");
      list = (await allRes.json()) as import("./types").SalarySearchResult[];
      return filterSalaryResults(Array.isArray(list) ? list : [], params);
    } else {
      throw new Error("Search failed");
    }
  } else {
    const res = await bff("/api/search");
    if (!res.ok) throw new Error("Search failed");
    list = (await res.json()) as import("./types").SalarySearchResult[];
  }

  if (!Array.isArray(list)) list = [];
  return applyCurrencyFilter(list, params);
}

function buildSearchServiceQuery(p: import("./types").SalarySearchFilters): URLSearchParams {
  const search = new URLSearchParams();
  if (p.country?.trim()) search.set("country", p.country.trim());
  if (p.company?.trim()) search.set("company", p.company.trim());
  if (p.role?.trim()) search.set("role", p.role.trim());
  if (p.level?.trim()) search.set("level", p.level.trim());
  if (p.minAmount != null && Number.isFinite(p.minAmount)) search.set("minAmount", String(p.minAmount));
  if (p.maxAmount != null && Number.isFinite(p.maxAmount)) search.set("maxAmount", String(p.maxAmount));
  if (p.experienceYears != null && Number.isFinite(p.experienceYears)) {
    search.set("minExperience", String(p.experienceYears));
    search.set("maxExperience", String(p.experienceYears));
  }
  return search;
}

function applyCurrencyFilter(
  list: import("./types").SalarySearchResult[],
  p: import("./types").SalarySearchFilters
): import("./types").SalarySearchResult[] {
  if (!p.currency?.trim()) return list;
  const c = p.currency.trim().toUpperCase();
  return list.filter((s) => s.currency.toUpperCase() === c);
}

function filterSalaryResults(
  list: import("./types").SalarySearchResult[],
  p: import("./types").SalarySearchFilters
): import("./types").SalarySearchResult[] {
  return list.filter((s) => {
    if (p.country?.trim()) {
      if (!s.country.toLowerCase().includes(p.country.trim().toLowerCase())) return false;
    }
    if (p.company?.trim()) {
      if (!s.company.toLowerCase().includes(p.company.trim().toLowerCase())) return false;
    }
    if (p.role?.trim()) {
      if (!s.role.toLowerCase().includes(p.role.trim().toLowerCase())) return false;
    }
    if (p.level?.trim()) {
      if (s.level.toLowerCase() !== p.level.trim().toLowerCase()) return false;
    }
    if (p.currency?.trim()) {
      if (s.currency.toUpperCase() !== p.currency.trim().toUpperCase()) return false;
    }
    if (p.minAmount != null && Number.isFinite(p.minAmount) && s.amount < p.minAmount) return false;
    if (p.maxAmount != null && Number.isFinite(p.maxAmount) && s.amount > p.maxAmount) return false;
    if (p.experienceYears != null && s.experienceYears !== p.experienceYears) return false;
    return true;
  });
}

// Stats — stats-service: GET /stats?country=&role=&currency=&period=
export async function getStats(params: {
  country?: string;
  role?: string;
  currency?: string;
  period?: string;
}) {
  const search = new URLSearchParams();
  if (params.country) search.set("country", params.country);
  if (params.role) search.set("role", params.role);
  if (params.currency) search.set("currency", params.currency);
  if (params.period) search.set("period", params.period);
  const q = search.toString();
  const res = await bff(`/api/stats${q ? `?${q}` : ""}`);
  if (!res.ok) throw new Error("Stats failed");
  return res.json() as Promise<import("./types").StatsResult>;
}

// Votes (require auth)
export async function getVotes(salaryId: string, token: string) {
  const res = await withAuth(token)(`/api/votes/${salaryId}`);
  if (!res.ok) return { salaryId, upvotes: 0, downvotes: 0 };
  return res.json() as Promise<import("./types").VoteCounts>;
}

export async function vote(salaryId: string, voteType: "UP" | "DOWN", token: string) {
  const res = await withAuth(token)(`/api/votes`, {
    method: "POST",
    body: JSON.stringify({ salaryId, voteType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(err, "Vote failed"));
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  // Gateway: /api/auth/{everything} → /identity/{everything}; identity routes live under /identity/auth/…
  const res = await bff("/api/auth/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(parseErrorMessage(data, "Login failed"));
  return normalizeAuth(data);
}

export async function register(email: string, password: string) {
  const res = await bff("/api/auth/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(parseErrorMessage(data, "Registration failed"));
  return normalizeAuth(data);
}
