import * as z from "zod";
import { parsePrice } from "./pricing";

const httpUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(2000, `${label} is too long.`)
    .refine((value) => {
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    }, `${label} must be a full web address starting with http:// or https://`);

export const ProductSchema = z.object({
  name: z.string().trim().min(2, "Enter the product name.").max(140, "Name is too long (140 max)."),
  description: z.string().trim().max(500, "Description is too long (500 max)."),
  category: z.string().trim().min(1, "Enter a category.").max(40, "Category is too long (40 max)."),
  price: z
    .string()
    .transform((value, ctx) => {
      const price = parsePrice(value);
      if (price === null) ctx.addIssue({ code: "custom", message: "Enter a price above zero, like 1299 or 49.99." });
      return price ?? 0;
    }),
  sourceUrl: httpUrl("Product link"),
  /** Optional: only needed when pasting an image address instead of uploading a file. */
  imageUrl: z.union([httpUrl("Image address"), z.literal("")]),
});

export type FieldErrors = Partial<Record<keyof z.input<typeof ProductSchema> | "image" | "form", string>>;
