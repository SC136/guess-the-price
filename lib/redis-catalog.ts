// Redis-backed catalog. Products live in one hash (id -> product) so a single product can be
// read, replaced or deleted without touching the others.
//
// Deliberately free of framework and Node-only imports: it takes the Redis client as an argument,
// so it can be unit-tested with a fake client and reused by scripts/migrate-catalog.ts.
import type { Catalog, Product } from "./types";

export const PRODUCTS_KEY = "guess-the-price:products";

/** The few Redis commands the catalog needs. Upstash's client implements all of them. */
export interface CatalogRedis {
  hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null>;
  hget<T>(key: string, field: string): Promise<T | null>;
  hset(key: string, fields: Record<string, unknown>): Promise<unknown>;
  hdel(key: string, ...fields: string[]): Promise<unknown>;
}

export function createRedisCatalog(redis: CatalogRedis, newId: () => string = () => crypto.randomUUID()): Catalog {
  return {
    async list() {
      const all = await redis.hgetall<Record<string, Product>>(PRODUCTS_KEY);
      return Object.values(all ?? {}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async get(id) {
      return (await redis.hget<Product>(PRODUCTS_KEY, id)) ?? undefined;
    },

    async create(input) {
      const now = new Date().toISOString();
      const product: Product = { ...input, id: newId(), createdAt: now, updatedAt: now };
      await redis.hset(PRODUCTS_KEY, { [product.id]: product });
      return product;
    },

    async update(id, patch) {
      const before = await redis.hget<Product>(PRODUCTS_KEY, id);
      if (!before) return undefined;
      const after: Product = { ...before, ...patch, updatedAt: new Date().toISOString() };
      await redis.hset(PRODUCTS_KEY, { [id]: after });
      return { before, after };
    },

    async delete(id) {
      const removed = await redis.hget<Product>(PRODUCTS_KEY, id);
      if (!removed) return undefined;
      await redis.hdel(PRODUCTS_KEY, id);
      return removed;
    },
  };
}
