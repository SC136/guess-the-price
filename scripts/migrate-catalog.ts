// Copies the local catalog (data/products.json) into Upstash Redis, uploading any photos stored on
// local disk to Vercel Blob. Safe to re-run: products are upserted by id and nothing is deleted.
//
//   vercel env pull .env.vercel --environment=production    # gets the Redis/Blob credentials
//   npm run migrate:catalog -- --dry-run                     # preview, changes nothing
//   npm run migrate:catalog                                  # do it
//
// Credentials are read from .env.vercel (see the npm script) or from the environment.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { put } from "@vercel/blob";
import { PRODUCTS_KEY } from "../lib/redis-catalog.ts";
import type { Product } from "../lib/types.ts";

const UPLOAD_PREFIX = "/api/images/";
const CONTENT_TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

const dryRun = process.argv.includes("--dry-run");
const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve("data");

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

let products: Product[];
try {
  products = JSON.parse(await readFile(path.join(dataDir, "products.json"), "utf8")) as Product[];
} catch {
  fail(`Could not read ${path.join(dataDir, "products.json")}. Run this from the project folder, or set DATA_DIR.`);
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const localPhotos = products.filter((p) => p.imageUrl.startsWith(UPLOAD_PREFIX));

if (!dryRun && (!redisUrl || !redisToken)) {
  fail(
    "No Redis credentials found. Create the Upstash Redis database in Vercel (Storage tab), then run\n" +
      "  vercel env pull .env.vercel --environment=production\nand try again.",
  );
}
if (!dryRun && localPhotos.length > 0 && !blobToken) {
  fail(
    `${localPhotos.length} product(s) use photos stored on this computer, which need a Vercel Blob store to move.\n` +
      "Create a public Blob store in Vercel (Storage tab), pull the env vars again, and retry.",
  );
}

console.log(`${dryRun ? "[dry run] " : ""}${products.length} product(s) in ${path.join(dataDir, "products.json")}`);
if (redisUrl) console.log(`Target Redis: ${new URL(redisUrl).host}`);

const migrated: Product[] = [];
for (const product of products) {
  let imageUrl = product.imageUrl;
  if (imageUrl.startsWith(UPLOAD_PREFIX)) {
    const name = imageUrl.slice(UPLOAD_PREFIX.length);
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) fail(`Unexpected photo name for "${product.name}": ${name}`);
    console.log(`  photo   ${product.name}: ${dryRun ? "would upload" : "uploading"} ${name} to Vercel Blob`);
    if (!dryRun) {
      const bytes = await readFile(path.join(dataDir, "uploads", name));
      const blob = await put(`products/${name}`, bytes, {
        access: "public",
        contentType: CONTENT_TYPES[name.split(".")[1]],
        allowOverwrite: true,
      });
      imageUrl = blob.url;
    }
  }
  migrated.push({ ...product, imageUrl });
  console.log(`  product ${product.name}`);
}

if (dryRun) {
  console.log(`\nDry run complete: would write ${migrated.length} product(s). Nothing was changed.`);
} else if (migrated.length > 0) {
  const redis = new Redis({ url: redisUrl!, token: redisToken! });
  await redis.hset(PRODUCTS_KEY, Object.fromEntries(migrated.map((p) => [p.id, p])));
  console.log(`\nDone: wrote ${migrated.length} product(s) to Redis.`);
}
