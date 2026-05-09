// apps/web/server/session.ts

import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "./env";

export const SESSION_COOKIE_NAME = "session";

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().SESSION_SECRET);
}

async function makeToken(sessionId: string): Promise<string> {
  return new SignJWT({ sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.sessionId as string;
  } catch {
    return null;
  }
}

/** Returns { sessionId, token } — creates a new session if cookie is missing/invalid. */
export async function getOrCreateSession(
  cookieValue: string | undefined
): Promise<{ sessionId: string; token: string }> {
  if (cookieValue) {
    const id = await verifyToken(cookieValue);
    if (id) return { sessionId: id, token: cookieValue };
  }
  const sessionId = crypto.randomUUID();
  const token = await makeToken(sessionId);
  return { sessionId, token };
}
