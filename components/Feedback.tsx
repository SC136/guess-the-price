"use client";

import { forwardRef } from "react";
import { formatPoints, formatPrice, storeName } from "@/lib/format";
import { guessVerdict, hasCents, type Tone } from "@/lib/pricing";
import type { AnswerResult, Mode } from "@/lib/types";
import { useCountUp } from "./useCountUp";

interface FeedbackProps {
  mode: Mode;
  answer: number;
  result: AnswerResult;
  isLast: boolean;
  onNext: () => void;
}

/** A number line showing where the guess landed relative to the real price. */
function Scale({ guess, actual }: { guess: number; actual: number }) {
  const max = Math.max(guess, actual) * 1.15;
  const pos = (value: number) => Math.min(97, Math.max(3, (value / max) * 100));
  const left = Math.min(pos(guess), pos(actual));
  const right = Math.max(pos(guess), pos(actual));

  return (
    <div className="scale" aria-hidden="true">
      <div className="scale-track" />
      <div className="scale-gap" style={{ left: `${left}%`, width: `${right - left}%` }} />
      <div className="pin pin-actual" style={{ left: `${pos(actual)}%` }}>
        <span className="pin-label">Actual</span>
      </div>
      <div className="pin pin-guess" style={{ left: `${pos(guess)}%` }}>
        <span className="pin-label">You</span>
      </div>
    </div>
  );
}

export const Feedback = forwardRef<HTMLButtonElement, FeedbackProps>(function Feedback(
  { mode, answer, result, isLast, onNext },
  nextRef,
) {
  const shownPoints = useCountUp(result.points);
  const decimals = hasCents(result.actual) ? 2 : 0;

  let title: string;
  let tone: Tone;
  let stats: [string, string][];
  if (mode === "options") {
    title = result.correct ? "Correct!" : "Not this time";
    tone = result.correct ? "good" : "bad";
    stats = [
      ["Your pick", formatPrice(answer, decimals)],
      ["Actual price", formatPrice(result.actual, decimals)],
    ];
  } else {
    ({ title, tone } = guessVerdict(result.error));
    const percent = Math.round(result.error * 100);
    const amount = result.error < 0.01 ? "<1%" : percent > 999 ? ">999%" : `${percent}%`;
    const off = result.direction === "exact" ? "Exact" : `${amount} too ${result.direction}`;
    stats = [
      ["Your guess", formatPrice(answer)],
      ["Actual price", formatPrice(result.actual)],
      ["Off by", off],
    ];
  }

  return (
    <div className={`feedback is-${tone}`} aria-live="polite">
      <div className="feedback-head">
        <h3 className="feedback-title">{title}</h3>
        <span className="points-badge">+{formatPoints(shownPoints)}</span>
      </div>

      <dl className="stats">
        {stats.map(([label, value]) => (
          <div className="stat" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {mode === "guess" && <Scale guess={answer} actual={result.actual} />}

      <div className="feedback-actions">
        <a
          className="btn btn-buy"
          href={result.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
        >
          Buy this product on <span className="nowrap">{storeName(result.sourceUrl)} ↗</span>
        </a>
        <button type="button" className="btn btn-primary" onClick={onNext} ref={nextRef}>
          {isLast ? "See results" : "Next product"}
        </button>
      </div>
    </div>
  );
});
