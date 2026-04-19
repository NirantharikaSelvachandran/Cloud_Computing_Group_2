/**
 * ISO 4217 codes that stats-service can convert (see backend/stats-service/Services/StatsService.cs `ToLkr`).
 * Submit and stats UI should only offer these so amounts can be included in aggregates.
 */
export const STATS_SUPPORTED_CURRENCIES = ["LKR", "USD", "EUR", "GBP", "INR", "AUD", "CAD"] as const;

export type StatsSupportedCurrency = (typeof STATS_SUPPORTED_CURRENCIES)[number];

export function isStatsSupportedCurrency(code: string): boolean {
  const u = code.trim().toUpperCase();
  return (STATS_SUPPORTED_CURRENCIES as readonly string[]).includes(u);
}

/** Safe for display: invalid codes (e.g. legacy "Other") fall back to number + code instead of throwing. */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  options?: { maximumFractionDigits?: number }
): string {
  const max = options?.maximumFractionDigits ?? 2;
  const code = (currencyCode || "USD").trim().toUpperCase() || "USD";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: max,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(undefined, { maximumFractionDigits: max })} ${code}`;
  }
}
