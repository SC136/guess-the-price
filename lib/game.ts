import "server-only";
import { MAX_ROUNDS } from "./config";
import { generateOptions, OPTION_POINTS, scoreGuess, shuffle } from "./pricing";
import { getProduct, listActiveProducts } from "./store";
import type { AnswerResult, Mode, PublicRound } from "./types";

const OPTION_COUNT = 4;

/**
 * Picks the products for one game. The price and store link are deliberately left out so
 * they never reach the browser before the player has answered.
 */
export async function createRounds(mode: Mode): Promise<PublicRound[]> {
  const products = shuffle(await listActiveProducts()).slice(0, MAX_ROUNDS);
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    imageUrl: product.imageUrl,
    ...(mode === "options" ? { options: generateOptions(product.price, OPTION_COUNT) } : {}),
  }));
}

/** Scores an answer on the server and reveals the real price. Null if the product is gone. */
export async function checkAnswer(productId: string, mode: Mode, answer: number): Promise<AnswerResult | null> {
  const product = await getProduct(productId);
  if (!product || !product.active) return null;

  const { points, error, direction } = scoreGuess(answer, product.price);
  const base = { actual: product.price, error, direction, sourceUrl: product.sourceUrl };

  if (mode === "options") {
    const correct = answer === product.price;
    return { ...base, points: correct ? OPTION_POINTS : 0, correct };
  }
  return { ...base, points, correct: error <= 0.1 };
}
