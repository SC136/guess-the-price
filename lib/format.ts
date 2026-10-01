import { CURRENCY, LOCALE } from "./config";
import { hasCents } from "./pricing";

/**
 * Formats a price in the configured currency. Whole-number prices drop the decimals unless
 * `decimals` is given, so multiple-choice options can all share the real price's format.
 */
export function formatPrice(value: number, decimals: number = hasCents(value) ? 2 : 0): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPoints(points: number): string {
  return points.toLocaleString("en-US");
}

/** "https://www.amazon.in/dp/B0..." -> "amazon.in" */
export function storeName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the store";
  }
}

/** The currency symbol on its own ("₹", "$"...), for input prefixes. */
export function currencySymbol(): string {
  const parts = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? CURRENCY;
}
