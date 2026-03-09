// BFF API client - all requests go through the Backend-for-Frontend

const BFF_BASE = process.env.NEXT_PUBLIC_BFF_URL || "";

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
    throw new Error((err as { message?: string }).message || res.statusText);
  }
  return res.json();
}

export async function getSalary(id: string) {
  const res = await bff(`/api/salaries/${id}`);
  if (!res.ok) throw new Error("Salary not found");
  return res.json();
}

// Search
export async function searchSalaries(params: import("./types").SalarySearchFilters) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) search.set(k, String(v));
  });
  const q = search.toString();
  const res = await bff(`/api/search${q ? `?${q}` : ""}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json() as Promise<import("./types").SalarySearchResult[]>;
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
export async function getVotes(salaryId: string) {
  const res = await bff(`/api/votes/${salaryId}`);
  if (!res.ok) return { salaryId, upvotes: 0, downvotes: 0 };
  return res.json() as Promise<import("./types").VoteCounts>;
}

export async function vote(salaryId: string, userId: string, voteType: "UP" | "DOWN", token: string) {
  const res = await withAuth(token)(`/api/votes`, {
    method: "POST",
    body: JSON.stringify({ salaryId, userId, voteType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Vote failed");
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  const res = await bff("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || "Login failed");
  return data as import("./types").AuthResponse;
}

export async function register(email: string, password: string) {
  const res = await bff("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string }).message || "Registration failed");
  return data as import("./types").AuthResponse;
}
