export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  const parsed: Record<string, string> = {};
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey?.trim();
    if (!key) {
      continue;
    }
    parsed[key] = decodeURIComponent(rest.join('=').trim());
  }
  return parsed;
}
