import "server-only";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { UPLOAD_URL_PREFIX } from "./config";
import { DATA_DIR } from "./store";

const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Stored names look like "<uuid>.jpg"; anything else is rejected (no path traversal). */
const STORED_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

// Trust the file's own bytes rather than the browser-supplied MIME type or filename.
function sniffExtension(bytes: Uint8Array): "jpg" | "png" | "webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/** Saves an uploaded photo and returns the URL it will be served from. */
export async function saveUpload(file: File): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Image must be 5 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = sniffExtension(bytes);
  if (!extension) throw new Error("Image must be a JPG, PNG or WebP file.");

  const name = `${randomUUID()}.${extension}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return UPLOAD_URL_PREFIX + name;
}

/** Deletes the stored file behind an upload URL. Ignores external image URLs. */
export async function removeUpload(imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith(UPLOAD_URL_PREFIX)) return;
  const name = imageUrl.slice(UPLOAD_URL_PREFIX.length);
  if (!STORED_NAME.test(name)) return;
  await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
}

export async function readUpload(name: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!STORED_NAME.test(name)) return null;
  try {
    const data = await fs.readFile(path.join(UPLOAD_DIR, name));
    return { data, contentType: CONTENT_TYPES[name.split(".")[1]] };
  } catch {
    return null;
  }
}
