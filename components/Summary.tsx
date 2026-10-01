"use client";

import Link from "next/link";
import { formatPoints, formatPrice, storeName } from "@/lib/format";
import { hasCents, rankFor } from "@/lib/pricing";
import type { Mode, RoundResult } from "@/lib/types";
import { ProductImage } from "./ProductImage";
import { useCountUp } from "./useCountUp";

const MODE_NAME: Record<Mode, string> = { options: "Pick the price", guess: "Exact guess" };

interface SummaryProps {
  mode: Mode;
  results: RoundResult[];
  score: number;
  maxScore: number;
  isRecord: boolean;
  best: number;
  busy: boolean;
  onPlayAgain: () => void;
}

export function Summary({ mode, results, score, maxScore, isRecord, best, busy, onPlayAgain }: SummaryProps) {
  const shownScore = useCountUp(score, 900);

  return (
    <>
      <section className="end-card">
        <h2>{rankFor(maxScore ? score / maxScore : 0, mode)}</h2>
        <p className="end-mode">{MODE_NAME[mode]}</p>
        <p className="end-score">
          <strong>{formatPoints(shownScore)}</strong>
          <span> / {formatPoints(maxScore)}</span>
        </p>
        {isRecord ? (
          <p className="end-record">New best score!</p>
        ) : (
          <p className="end-best">Your best: {formatPoints(best)}</p>
        )}
      </section>

      <ol className="results-list">
        {results.map(({ round, answer, result }) => {
          const decimals = hasCents(result.actual) ? 2 : 0;
          const detail =
            mode === "options"
              ? `Picked ${formatPrice(answer, decimals)} · Actual ${formatPrice(result.actual, decimals)}`
              : `Guessed ${formatPrice(answer)} · Actual ${formatPrice(result.actual)}`;
          return (
            <li key={round.id} className={`result ${result.correct ? "is-hit" : "is-miss"}`}>
              <ProductImage src={round.imageUrl} alt="" className="result-thumb" />
              <div className="result-text">
                <strong>{round.name}</strong>
                <span>{detail}</span>
                <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer nofollow sponsored">
                  Buy on {storeName(result.sourceUrl)} ↗
                </a>
              </div>
              <span className="result-points">+{formatPoints(result.points)}</span>
            </li>
          );
        })}
      </ol>

      <div className="end-actions">
        <button type="button" className="btn btn-primary" onClick={onPlayAgain} disabled={busy}>
          {busy ? "Loading…" : "Play again"}
        </button>
        <Link href="/" className="btn btn-ghost">
          Change mode
        </Link>
      </div>
    </>
  );
}
