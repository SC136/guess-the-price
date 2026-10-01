import "server-only";
import { del, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MAX_IMAGE_BYTES, UPLOAD_URL_PREFIX } from "./config";
import { isOnVercel } from "./redis";
import { DATA_DIR } from "./store";

// Uploaded photos go to Vercel Blob when BLOB_READ_WRITE_TOKEN is set (always the case on a
// deployed site) and to DATA_DIR/uploads on disk otherwise, so local development needs no setup.

const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Locally stored names look like "<uuid>.jpg"; anything else is rejected (no path traversal). */
const STORED_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

const usesBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Where uploaded photos are stored, for the admin dashboard's status line. */
export function photoBackend(): "blob" | "disk" | "missing" {
  if (usesBlob()) return "blob";
  return isOnVercel() ? "missing" : "disk";
}

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
  if (file.size > MAX_IMAGE_BYTES) throw new Error(`Image must be ${MAX_IMAGE_BYTES / 1024 / 1024} MB or smaller.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = sniffExtension(bytes);
  if (!extension) throw new Error("Image must be a JPG, PNG or WebP file.");
  const name = `${randomUUID()}.${extension}`;

  if (usesBlob()) {
    const blob = await put(`products/${name}`, file, { access: "public", contentType: CONTENT_TYPES[extension] });
    return blob.url;
  }
  if (isOnVercel()) {
    throw new Error(
      "Photo uploads need a Vercel Blob store connected to this project. Paste an image address instead, or add one under Storage.",
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return UPLOAD_URL_PREFIX + name;
}

/** Deletes the stored file behind an upload URL. Ignores external image URLs. */
export async function removeUpload(imageUrl: string): Promise<void> {
  if (imageUrl.startsWith(UPLOAD_URL_PREFIX)) {
    const name = imageUrl.slice(UPLOAD_URL_PREFIX.length);
    if (STORED_NAME.test(name)) await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
    return;
  }

  // Only our own Blob store's files are ours to delete; hotlinked photos from other sites are not.
  if (usesBlob() && isBlobUrl(imageUrl)) {
    try {
      await del(imageUrl);
    } catch (error) {
      console.error("Could not delete blob", imageUrl, error);
    }
  }
}

function isBlobUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
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
