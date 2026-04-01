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

// Search — uses salary service approved list via gateway; filters run in the browser (search microservice optional).
export async function searchSalaries(params: import("./types").SalarySearchFilters) {
  const res = await bff("/api/salaries/approved");
  if (!res.ok) throw new Error("Search failed");
  const list = (await res.json()) as import("./types").SalarySearchResult[];
  return filterSalaryResults(list, params);
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

// Stats
export async function getStats(params: {
  country?: string;
  company?: string;
  role?: string;
  level?: string;
  currency?: string;
}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
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
