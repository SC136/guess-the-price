import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getRedis, isOnVercel } from "./redis";
import { createRedisCatalog } from "./redis-catalog";
import type { Catalog, Product, ProductInput } from "./types";

// The catalog lives in Upstash Redis when it's configured (always the case on Vercel) and in a
// local JSON file otherwise, so `npm run dev` works with zero setup. Every other file only uses
// the functions exported at the bottom.

export type { ProductInput };

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "products.json");

// ---------- Local JSON file (development) ----------

// Reads and writes go through one queue so concurrent admin actions can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();
function exclusive<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function readAll(): Promise<Product[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Product[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(products: Product[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(products, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

const fileCatalog: Catalog = {
  async list() {
    const products = await exclusive(readAll);
    return products.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async get(id) {
    return (await exclusive(readAll)).find((p) => p.id === id);
  },

  create(input) {
    return exclusive(async () => {
      const now = new Date().toISOString();
      const product: Product = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
      await writeAll([...(await readAll()), product]);
      return product;
    });
  },

  update(id, patch) {
    return exclusive(async () => {
      const products = await readAll();
      const index = products.findIndex((p) => p.id === id);
      if (index === -1) return undefined;
      const before = products[index];
      const after: Product = { ...before, ...patch, updatedAt: new Date().toISOString() };
      products[index] = after;
      await writeAll(products);
      return { before, after };
    });
  },

  delete(id) {
    return exclusive(async () => {
      const products = await readAll();
      const removed = products.find((p) => p.id === id);
      if (!removed) return undefined;
      await writeAll(products.filter((p) => p.id !== id));
      return removed;
    });
  },
};

// ---------- Backend selection ----------

let redisCatalog: Catalog | undefined;

function catalog(): Catalog {
  const redis = getRedis();
  if (redis) return (redisCatalog ??= createRedisCatalog(redis));
  if (isOnVercel()) {
    throw new Error(
      "No database configured. In your Vercel project open Storage, add an Upstash Redis database, " +
        "connect it to this project and redeploy (see the README).",
    );
  }
  return fileCatalog;
}

/** Where the catalog is stored, for the admin dashboard's status line. */
export function catalogBackend(): "redis" | "file" | "missing" {
  if (getRedis()) return "redis";
  return isOnVercel() ? "missing" : "file";
}

// ---------- Public API ----------

export const listProducts = () => catalog().list();
export const getProduct = (id: string) => catalog().get(id);
export const createProduct = (input: ProductInput) => catalog().create(input);
export const updateProduct = (id: string, patch: Partial<ProductInput>) => catalog().update(id, patch);
export const deleteProduct = (id: string) => catalog().delete(id);

export async function listActiveProducts(): Promise<Product[]> {
  return (await listProducts()).filter((p) => p.active);
}
