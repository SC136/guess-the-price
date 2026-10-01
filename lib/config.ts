/** Number of products per game. */
export const MAX_ROUNDS = 10;

/** ISO 4217 currency used to format every price. Set NEXT_PUBLIC_CURRENCY in .env.local. */
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "INR";

// Indian digit grouping (1,29,999) for rupees, standard grouping for everything else.
export const LOCALE = CURRENCY === "INR" ? "en-IN" : "en-US";

/** Where uploaded product photos are served from (see app/api/images/[name]/route.ts). */
export const UPLOAD_URL_PREFIX = "/api/images/";

/**
 * Largest product photo the admin can upload. Vercel Functions reject request bodies over 4.5 MB
 * before our code runs, so this stays safely below that.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
