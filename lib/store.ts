import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Product } from "./types";

// A small JSON-file catalog: no database to install, and plenty for a price game.
// To host on a read-only filesystem (e.g. Vercel), replace this module with a hosted DB;
// every other file only uses the functions exported here.

export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "products.json");

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

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

export async function listProducts(): Promise<Product[]> {
  const products = await exclusive(readAll);
  return products.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listActiveProducts(): Promise<Product[]> {
  return (await listProducts()).filter((p) => p.active);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  return (await exclusive(readAll)).find((p) => p.id === id);
}

export function createProduct(input: ProductInput): Promise<Product> {
  return exclusive(async () => {
    const now = new Date().toISOString();
    const product: Product = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    await writeAll([...(await readAll()), product]);
    return product;
  });
}

/** Returns the previous version too, so callers can clean up a replaced image. */
export function updateProduct(
  id: string,
  patch: Partial<ProductInput>,
): Promise<{ before: Product; after: Product } | undefined> {
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
}

export function deleteProduct(id: string): Promise<Product | undefined> {
  return exclusive(async () => {
    const products = await readAll();
    const removed = products.find((p) => p.id === id);
    if (!removed) return undefined;
    await writeAll(products.filter((p) => p.id !== id));
    return removed;
  });
}
