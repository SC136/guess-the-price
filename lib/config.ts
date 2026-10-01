/** Number of products per game. */
export const MAX_ROUNDS = 10;

/** ISO 4217 currency used to format every price. Set NEXT_PUBLIC_CURRENCY in .env.local. */
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "INR";

// Indian digit grouping (1,29,999) for rupees, standard grouping for everything else.
export const LOCALE = CURRENCY === "INR" ? "en-IN" : "en-US";

/** Where uploaded product photos are served from (see app/api/images/[name]/route.ts). */
export const UPLOAD_URL_PREFIX = "/api/images/";
