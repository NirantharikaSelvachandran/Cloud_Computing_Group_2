// Shared types for salary transparency platform

export interface SalarySubmission {
  id?: string;
  country: string;
  company: string;
  role: string;
  level: string; // e.g. Junior, Mid, Senior, Lead
  currency: string;
  amount: number;
  period: "yearly" | "monthly" | "hourly";
  experienceYears?: number;
  submittedAt?: string;
  approved?: boolean;
}

export interface SalarySearchFilters {
  country?: string;
  company?: string;
  role?: string;
  level?: string;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  experienceYears?: number;
}

export interface SalarySearchResult extends SalarySubmission {
  id: string;
  /** Present on search-service responses (e.g. APPROVED). */
  status?: string;
  upvotes?: number;
  downvotes?: number;
}

export interface VoteCounts {
  salaryId: string;
  upvotes: number;
  downvotes: number;
}

export interface StatsResult {
  count: number;
  average: number;
  median?: number;
  p25?: number;
  p75?: number;
  p90?: number;
  currency: string;
  period: string;
  filters?: Record<string, string | number>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

/** Normalized client auth shape (maps identity-service `accessToken` to `token`). */
export interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  email?: string;
  message?: string;
}
