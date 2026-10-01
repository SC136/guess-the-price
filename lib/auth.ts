import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getRedis } from "./redis";

const COOKIE = "admin_session";
const SESSION_HOURS = 12;

function sessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}

/** Constant-time password check. Returns false if ADMIN_PASSWORD isn't configured. */
export function passwordMatches(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(candidate), digest(expected));
}

export async function createSession(): Promise<void> {
  const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(sessionKey());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** True when the request carries a valid admin session. Memoised per request. */
export const isAdmin = cache(async (): Promise<boolean> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
});

/**
 * Call at the top of every admin page AND every admin server action: server actions can be
 * invoked by direct POST, so a page-level check alone doesn't protect them.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

// --- Login throttling: 8 failures per client per 15 minutes. ---
// Serverless instances don't share memory (and restart often), so on a deployed site the counters
// live in Redis. Locally the in-memory map is enough.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; resetAt: number }>();

async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  // Hashed so raw IP addresses never end up as Redis keys.
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

const redisKey = (client: string) => `guess-the-price:login-failures:${client}`;

export async function isLockedOut(): Promise<boolean> {
  const client = await clientKey();
  const redis = getRedis();
  if (redis) return ((await redis.get<number>(redisKey(client))) ?? 0) >= MAX_FAILURES;

  const entry = failures.get(client);
  return !!entry && entry.resetAt > Date.now() && entry.count >= MAX_FAILURES;
}

export async function recordLoginFailure(): Promise<void> {
  const client = await clientKey();
  const redis = getRedis();
  if (redis) {
    const key = redisKey(client);
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_MS / 1000);
    return;
  }

  const now = Date.now();
  const entry = failures.get(client);
  if (!entry || entry.resetAt <= now) failures.set(client, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}

export async function clearLoginFailures(): Promise<void> {
  const client = await clientKey();
  const redis = getRedis();
  if (redis) await redis.del(redisKey(client));
  else failures.delete(client);
}
