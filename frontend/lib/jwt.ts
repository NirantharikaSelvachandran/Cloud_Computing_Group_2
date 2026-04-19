function decodeJwtPayload(token: string): { email?: string; exp?: number } | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { email?: string; exp?: number };
  } catch {
    return null;
  }
}

/** Decode email from JWT payload (client display only; verification is server-side). */
export function getEmailFromAccessToken(token: string): string | null {
  const json = decodeJwtPayload(token);
  return json && typeof json.email === "string" ? json.email : null;
}

/** True if JWT is missing, unreadable, or past `exp` (client-side hint; server still validates). */
export function isAccessTokenExpired(token: string): boolean {
  const json = decodeJwtPayload(token);
  if (!json) return true;
  if (typeof json.exp !== "number") return false;
  return Date.now() >= json.exp * 1000;
}
