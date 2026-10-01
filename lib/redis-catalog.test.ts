import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { createRedisCatalog, PRODUCTS_KEY, type CatalogRedis } from "./redis-catalog.ts";
import type { ProductInput } from "./types.ts";

// A fake Redis hash store. Like Upstash's client it serialises values to JSON on write and parses
// them on read, so the catalog is tested against real round-tripping (no shared object references).
function fakeRedis() {
  const hashes = new Map<string, Map<string, string>>();
  const hash = (key: string) => hashes.get(key) ?? hashes.set(key, new Map()).get(key)!;
  const client: CatalogRedis = {
    async hgetall<T extends Record<string, unknown>>(key: string) {
      const h = hashes.get(key);
      if (!h || h.size === 0) return null; // Redis returns nothing for a missing/empty hash
      return Object.fromEntries([...h].map(([field, json]) => [field, JSON.parse(json)])) as T;
    },
    async hget<T>(key: string, field: string) {
      const json = hashes.get(key)?.get(field);
      return json === undefined ? null : (JSON.parse(json) as T);
    },
    async hset(key: string, fields: Record<string, unknown>) {
      for (const [field, value] of Object.entries(fields)) hash(key).set(field, JSON.stringify(value));
      return Object.keys(fields).length;
    },
    async hdel(key: string, ...fields: string[]) {
      for (const field of fields) hashes.get(key)?.delete(field);
      return fields.length;
    },
  };
  return { client, hashes };
}

const input = (name: string, extra: Partial<ProductInput> = {}): ProductInput => ({
  name,
  description: "",
  category: "Camera Gear",
  price: 5000,
  sourceUrl: "https://example.com/p",
  imageUrl: "https://example.com/p.jpg",
  active: true,
  ...extra,
});

describe("redis catalog", () => {
  let ids = 0;
  let redis: ReturnType<typeof fakeRedis>;
  let catalog: ReturnType<typeof createRedisCatalog>;

  beforeEach(() => {
    ids = 0;
    redis = fakeRedis();
    catalog = createRedisCatalog(redis.client, () => `id-${++ids}`);
  });

  it("starts empty", async () => {
    assert.deepEqual(await catalog.list(), []);
    assert.equal(await catalog.get("nope"), undefined);
  });

  it("creates products with an id and timestamps, stored under one hash", async () => {
    const product = await catalog.create(input("Lens cap"));
    assert.equal(product.id, "id-1");
    assert.equal(product.createdAt, product.updatedAt);
    assert.deepEqual(await catalog.get("id-1"), product);
    assert.deepEqual([...redis.hashes.keys()], [PRODUCTS_KEY]);
  });

  it("lists newest first", async () => {
    const a = await catalog.create(input("A"));
    await new Promise((resolve) => setTimeout(resolve, 5));
    const b = await catalog.create(input("B"));
    assert.deepEqual((await catalog.list()).map((p) => p.id), [b.id, a.id]);
  });

  it("updates only the given fields and returns the previous version", async () => {
    const created = await catalog.create(input("Hood", { price: 33000 }));
    await new Promise((resolve) => setTimeout(resolve, 5));
    const result = await catalog.update(created.id, { price: 34000, active: false });

    assert.ok(result);
    assert.equal(result.before.price, 33000);
    assert.equal(result.after.price, 34000);
    assert.equal(result.after.active, false);
    assert.equal(result.after.name, "Hood");
    assert.equal(result.after.createdAt, created.createdAt);
    assert.notEqual(result.after.updatedAt, created.updatedAt);
    assert.equal((await catalog.get(created.id))?.price, 34000);
  });

  it("returns undefined when updating or deleting something that doesn't exist", async () => {
    assert.equal(await catalog.update("missing", { price: 1 }), undefined);
    assert.equal(await catalog.delete("missing"), undefined);
  });

  it("deletes a product and returns it, leaving the others", async () => {
    const keep = await catalog.create(input("Keep"));
    const drop = await catalog.create(input("Drop"));
    const removed = await catalog.delete(drop.id);

    assert.equal(removed?.name, "Drop");
    assert.deepEqual((await catalog.list()).map((p) => p.id), [keep.id]);
    assert.equal(await catalog.get(drop.id), undefined);
  });

  it("round-trips awkward text unchanged", async () => {
    const description = 'Line one\r\nLine "two" — ₹5,000 {"not":"json"}';
    const created = await catalog.create(input("Weird", { description }));
    assert.equal((await catalog.get(created.id))?.description, description);
  });
});
