import "server-only";
import { Redis } from "@upstash/redis";

let client: Redis | null | undefined;

/**
 * The hosted Redis client, or null when none is configured (local development, which falls back
 * to files). Vercel's Upstash integration injects KV_REST_API_URL / KV_REST_API_TOKEN; a database
 * created directly at Upstash uses UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN. Either works.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

/** True when running on Vercel, where the filesystem is read-only and can't hold a catalog. */
export const isOnVercel = () => Boolean(process.env.VERCEL);
