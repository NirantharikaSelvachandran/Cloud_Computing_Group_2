/** Decode email from JWT payload (client display only; verification is server-side). */
export function getEmailFromAccessToken(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { email?: string };
    return typeof json.email === "string" ? json.email : null;
  } catch {
    return null;
  }
}
