export type Mode = "options" | "guess";

export const MODES: readonly Mode[] = ["options", "guess"];

export function isMode(value: string): value is Mode {
  return (MODES as readonly string[]).includes(value);
}

/** A product as stored in the catalog (server only: it contains the price). */
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  /** Link to the product on the store, shown as a "Buy" button after the player answers. */
  sourceUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fields an admin supplies when creating or editing a product. */
export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

/** Storage-agnostic catalog operations; implemented by the local JSON file and by Redis. */
export interface Catalog {
  list(): Promise<Product[]>;
  get(id: string): Promise<Product | undefined>;
  create(input: ProductInput): Promise<Product>;
  /** Returns the previous version too, so callers can clean up a replaced image. */
  update(id: string, patch: Partial<ProductInput>): Promise<{ before: Product; after: Product } | undefined>;
  delete(id: string): Promise<Product | undefined>;
}

/** What the player is allowed to see before answering: no price, no store link. */
export interface PublicRound {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  /** Multiple-choice mode only: the real price shuffled in with decoys. */
  options?: number[];
}

/** Returned by the server once the player has answered a round. */
export interface AnswerResult {
  actual: number;
  points: number;
  correct: boolean;
  /** Relative error |guess - actual| / actual. */
  error: number;
  direction: "high" | "low" | "exact";
  sourceUrl: string;
}

/** One finished round, kept client-side for the results screen. */
export interface RoundResult {
  round: PublicRound;
  answer: number;
  result: AnswerResult;
}
