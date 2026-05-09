// apps/web/server/utils/session-rpc.ts

import { getEnv } from "../env";
import {
  generateSessionId,
  verifySessionCookie,
  SESSION_COOKIE_NAME,
} from "../session";

// In TanStack Start, session ID needs to be extracted from request context
// For now, we'll use a simplified approach that generates a new session per request
// TODO: Integrate with TanStack Start's request context to properly read/set cookies

export async function getOrCreateSessionId(
  cookieHeader?: string
): Promise<string> {
  const env = getEnv();

  if (cookieHeader) {
    const cookieMatch = cookieHeader.match(
      new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`)
    );
    const sessionCookie = cookieMatch?.[1];

    if (sessionCookie) {
      const verified = await verifySessionCookie(sessionCookie, env.SESSION_SECRET);
      if (verified) {
        return verified;
      }
    }
  }

  // Generate and return new session ID
  return await generateSessionId(env.SESSION_SECRET);
}
