/**
 * An applicant- or agency-supplied URL, only when it is plain https.
 *
 * The admin console opens links that outsiders supplied: document uploads in
 * an iframe or an img, an agency's website as a link. A `javascript:` or
 * `data:` URL there runs inside the console, where a desk member is signed in,
 * so anything that doesn't parse as an absolute `https:` URL is refused and the
 * caller shows "link unavailable" instead. Returns the normalised href.
 */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
