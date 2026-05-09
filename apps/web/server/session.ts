// apps/web/server/session.ts

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "sessionId";

async function getSecretKey(secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  return encoder.encode(secret);
}

export async function generateSessionId(secret: string): Promise<string> {
  const jwt = await new SignJWT({ sessionId: crypto.randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(await getSecretKey(secret));

  return jwt;
}

export async function verifySessionCookie(
  token: string | undefined,
  secret: string
): Promise<string | null> {
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, await getSecretKey(secret));
    return verified.payload.sessionId as string;
  } catch {
    return null;
  }
}
