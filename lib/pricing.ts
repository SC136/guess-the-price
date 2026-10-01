// Pure pricing logic: parsing, scoring and multiple-choice generation.
// No framework or Node imports, so it runs on the server, in the browser and under `node --test`.

export const OPTION_POINTS = 100; // multiple-choice mode: flat reward for the right pick
export const GUESS_MAX_POINTS = 1000; // exact-guess mode: reward for a perfect guess

// Decoys are drawn between 0.4x and 2.5x the real price and must differ from each other
// (and from the answer) by at least this fraction.
const MIN_OPTION_GAP = 0.12;
const FACTOR_RANGE = [Math.log(0.4), Math.log(2.5)] as const;
const STEPS = [
  100000, 50000, 25000, 10000, 5000, 2500, 1000, 500, 250, 100, 50, 25, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01,
];
// "Psychological" prices sit just under a round number: 1,299 (1 below), 74,990 (10 below) or
// 1,89,900 (100 below). Decoys for such prices use the same pattern so the real one doesn't stand out.
const CHARM_OFFSETS = [1, 10, 100];
const CHARM_UNITS = [100000, 10000, 1000, 100, 10];

const toCents = (n: number) => Math.round(n * 100);
const roundCents = (n: number) => Math.round(n * 100) / 100;

export const hasCents = (price: number) => toCents(price) % 100 !== 0;

/** Accepts "49.99", "1,299", "₹1,299", ".5". Returns a positive number or null. */
export function parsePrice(text: string): number | null {
  const cleaned = text.replace(/[,\s$₹€£]/g, "");
  if (!/^(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const value = roundCents(Number(cleaned));
  return value > 0 && value < 1e9 ? value : null;
}

/**
 * Exact-guess scoring. Closer guesses are rewarded steeply:
 * within 10% is ~810 points, 25% off ~560, 50% off 250, 100%+ off 0.
 */
export function scoreGuess(guess: number, actual: number) {
  const error = Math.abs(guess - actual) / actual;
  const points = Math.round(GUESS_MAX_POINTS * Math.max(0, 1 - error) ** 2);
  const direction = guess > actual ? "high" : guess < actual ? "low" : "exact";
  return { points, error, direction } as const;
}

export type Tone = "good" | "ok" | "bad";

export function guessVerdict(error: number): { title: string; tone: Tone } {
  if (error <= 0.02) return { title: "Spot on!", tone: "good" };
  if (error <= 0.1) return { title: "So close!", tone: "good" };
  if (error <= 0.25) return { title: "Nice guess", tone: "ok" };
  if (error <= 0.5) return { title: "Not quite", tone: "ok" };
  return { title: "Way off", tone: "bad" };
}

// Minimum fraction of the maximum score needed for each rank, per mode.
// Exact-guess is much harder to max out, so its thresholds are lower.
const RANKS = [
  { title: "Retail wizard", min: { options: 0.9, guess: 0.75 } },
  { title: "Savvy shopper", min: { options: 0.7, guess: 0.55 } },
  { title: "Bargain hunter", min: { options: 0.5, guess: 0.35 } },
  { title: "Window shopper", min: { options: 0.3, guess: 0.15 } },
  { title: "Price check needed", min: { options: 0, guess: 0 } },
];

export function rankFor(fraction: number, mode: "options" | "guess"): string {
  return (RANKS.find((rank) => fraction >= rank.min[mode]) ?? RANKS[RANKS.length - 1]).title;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Returns a function that snaps a raw number to the same "price style" as `actual`
 * (x.99 endings, ...9/...99/...990/...900 endings, round numbers) so the real price can't be
 * spotted just by how it looks.
 */
function priceSnapper(actual: number): (value: number) => number {
  if (toCents(actual) % 100 === 99) {
    return (v) => roundCents(Math.max(1, Math.round(v)) - 0.01);
  }
  if (Number.isInteger(actual)) {
    for (const offset of CHARM_OFFSETS) {
      const unit = CHARM_UNITS.find((u) => u > offset && u <= actual / 2 && (actual + offset) % u === 0);
      if (unit) return (v) => Math.max(unit, Math.round(v / unit) * unit) - offset;
    }
  }
  const smallest = Number.isInteger(actual) ? 1 : 0.01;
  const divides = (step: number) => Math.abs(actual / step - Math.round(actual / step)) < 1e-9;
  const step = STEPS.find((s) => s >= smallest && s <= actual / 10 && divides(s)) ?? smallest;
  return (v) => roundCents(Math.max(step, Math.round(v / step) * step));
}

/** Returns `count` shuffled prices: the real one plus plausible but clearly different decoys. */
export function generateOptions(actual: number, count = 4, rng: () => number = Math.random): number[] {
  const snap = priceSnapper(actual);
  const options = [actual];
  const isDistinct = (v: number) =>
    v > 0 && options.every((o) => Math.abs(v - o) / Math.min(v, o) >= MIN_OPTION_GAP);

  for (let tries = 0; options.length < count && tries < 500; tries++) {
    const factor = Math.exp(FACTOR_RANGE[0] + rng() * (FACTOR_RANGE[1] - FACTOR_RANGE[0]));
    const candidate = snap(actual * factor);
    if (isDistinct(candidate)) options.push(candidate);
  }
  // Safety net for pathological inputs: march upwards until we have enough.
  for (let factor = 2; options.length < count; factor *= 1.5) {
    const candidate = snap(actual * factor);
    if (isDistinct(candidate)) options.push(candidate);
  }
  return shuffle(options, rng);
}
