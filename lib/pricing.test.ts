// Run with `npm test` (Node's built-in test runner; TypeScript is stripped natively).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { generateOptions, guessVerdict, hasCents, parsePrice, rankFor, scoreGuess } from "./pricing.ts";

// A spread of realistic retail prices: charm (...99, ...9), round, decimal and arbitrary.
const PRICES = [
  3.5, 4.5, 5.5, 12.37, 19.99, 24.99, 59.99, 129.99, 399.99,
  59, 99, 149, 199, 249, 299, 349, 449, 499, 599, 699, 799, 999, 1099, 1299, 1499, 1549, 1999,
  2499, 2999, 3499, 4999, 6999, 9999, 12999, 14999, 19999, 24999, 29999, 49999, 79999, 119999,
  74990, 1200, 5500, 24000, 850, 120, 28, 22, 5, 3,
];

const endsInNines = (v: number) => Math.round(v * 100) % 100 === 99 || (Number.isInteger(v) && v % 10 === 9);

describe("generateOptions", () => {
  it("returns four distinct, positive options that include the real price", () => {
    for (const price of PRICES) {
      for (let run = 0; run < 500; run++) {
        const options = generateOptions(price);
        assert.equal(options.length, 4, `${price}`);
        assert.ok(options.includes(price), `${price} missing from ${options}`);
        assert.equal(new Set(options).size, 4, `${price} has duplicates: ${options}`);
        assert.ok(options.every((o) => o > 0), `${price} has a non-positive option: ${options}`);
      }
    }
  });

  it("keeps decoys in a believable range of the real price", () => {
    for (const price of PRICES) {
      for (let run = 0; run < 200; run++) {
        for (const option of generateOptions(price)) {
          assert.ok(option / price > 0.2 && option / price < 4.5, `${price}: ${option} is out of range`);
        }
      }
    }
  });

  it("does not leak the answer through formatting", () => {
    for (const price of PRICES.filter(endsInNines)) {
      for (let run = 0; run < 200; run++) {
        for (const option of generateOptions(price)) {
          assert.ok(endsInNines(option), `${price}: decoy ${option} breaks the pricing pattern`);
        }
      }
    }
    // The UI shows every option with the real price's decimal places, so whole-number
    // prices must never get fractional decoys.
    for (const price of PRICES.filter((p) => !hasCents(p))) {
      for (let run = 0; run < 200; run++) {
        for (const option of generateOptions(price)) {
          assert.ok(Number.isInteger(option), `${price}: ${option} gained decimals`);
        }
      }
    }
  });
});

describe("generateOptions for Indian-style prices", () => {
  // Real listings often sit 10 or 100 below a round number (74,990 / 1,89,900).
  const INDIAN_PRICES = [1080, 2490, 5000, 10000, 12990, 33000, 74990, 149990, 189900, 279900, 449900, 599990, 629900, 715000, 890000, 5089000];

  it("returns four distinct options that include the real price", () => {
    for (const price of INDIAN_PRICES) {
      for (let run = 0; run < 500; run++) {
        const options = generateOptions(price);
        assert.equal(new Set(options).size, 4, `${price}: ${options}`);
        assert.ok(options.includes(price), `${price} missing from ${options}`);
        assert.ok(options.every((o) => o > 0 && Number.isInteger(o)), `${price}: bad option in ${options}`);
      }
    }
  });

  it("makes decoys end the same way as the real price", () => {
    const lastTwo = (n: number) => String(n).slice(-2);
    for (const price of [2490, 12990, 74990, 149990, 189900, 279900, 449900, 599990, 629900]) {
      for (let run = 0; run < 300; run++) {
        for (const option of generateOptions(price)) {
          assert.equal(lastTwo(option), lastTwo(price), `${price}: decoy ${option} ends differently`);
        }
      }
    }
  });
});

describe("scoreGuess", () => {
  const points = (guess: number, actual: number) => scoreGuess(guess, actual).points;

  it("rewards exact guesses with the maximum", () => {
    assert.equal(points(100, 100), 1000);
  });

  it("scores symmetrically around the real price", () => {
    assert.equal(points(110, 100), 810);
    assert.equal(points(90, 100), 810);
    assert.equal(points(150, 100), 250);
    assert.equal(points(50, 100), 250);
  });

  it("gives nothing for guesses off by 100% or more", () => {
    assert.equal(points(200, 100), 0);
    assert.equal(points(10_000, 100), 0);
  });

  it("reports direction and relative error", () => {
    assert.deepEqual(scoreGuess(120, 100).direction, "high");
    assert.deepEqual(scoreGuess(80, 100).direction, "low");
    assert.deepEqual(scoreGuess(100, 100).direction, "exact");
    assert.ok(Math.abs(scoreGuess(120, 100).error - 0.2) < 1e-9);
  });
});

describe("parsePrice", () => {
  it("accepts common price formats", () => {
    assert.equal(parsePrice("49.99"), 49.99);
    assert.equal(parsePrice("1,299"), 1299);
    assert.equal(parsePrice("₹1,29,999"), 129999);
    assert.equal(parsePrice("$ 5"), 5);
    assert.equal(parsePrice(".5"), 0.5);
    assert.equal(parsePrice("12."), 12);
  });

  it("rejects anything else", () => {
    for (const bad of ["", "abc", "0", "-5", "1e5", "1.2.3", "$", "12abc", "1e9", "1000000000"]) {
      assert.equal(parsePrice(bad), null, bad);
    }
  });
});

describe("verdicts and ranks", () => {
  it("maps error to a verdict", () => {
    assert.equal(guessVerdict(0).title, "Spot on!");
    assert.equal(guessVerdict(0.08).tone, "good");
    assert.equal(guessVerdict(0.2).tone, "ok");
    assert.equal(guessVerdict(0.9).tone, "bad");
  });

  it("uses lower rank thresholds for the harder mode", () => {
    assert.equal(rankFor(0.8, "options"), "Savvy shopper");
    assert.equal(rankFor(0.8, "guess"), "Retail wizard");
    assert.equal(rankFor(0, "guess"), "Price check needed");
  });
});
