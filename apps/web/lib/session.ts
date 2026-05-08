import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "vg_session";
const SEP = ".";

/** Cookie name for the anonymous session (`vg_session`). */
export const SESSION_COOKIE_NAME = COOKIE_NAME;

export function generateSessionId(): string {
  return randomUUID();
}

function sign(sessionId: string, secret: string): string {
  return createHmac("sha256", secret).update(sessionId).digest("hex");
}

/**
 * Serialized cookie payload: `{sessionId}.{hexHmac}`
 */
export function serializeSessionCookie(sessionId: string, secret: string): string {
  return `${sessionId}${SEP}${sign(sessionId, secret)}`;
}

/** Returns session id when signature matches; otherwise undefined. */
export function verifySessionCookie(
  cookieValue: string | undefined,
  secret: string,
): string | undefined {
  if (!cookieValue) return undefined;
  const idx = cookieValue.lastIndexOf(SEP);
  if (idx <= 0 || idx === cookieValue.length - 1) return undefined;
  const sessionId = cookieValue.slice(0, idx);
  const sig = cookieValue.slice(idx + SEP.length);
  const expected = sign(sessionId, secret);
  try {
    if (sig.length !== expected.length) return undefined;
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return undefined;
  } catch {
    return undefined;
  }
  return sessionId;
}
