"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { startGame, submitAnswer } from "@/app/actions/game";
import { recordScore } from "@/lib/best-scores";
import { formatPoints } from "@/lib/format";
import { GUESS_MAX_POINTS, OPTION_POINTS } from "@/lib/pricing";
import type { Mode, PublicRound, RoundResult } from "@/lib/types";
import { GuessAnswer, OptionsAnswer } from "./AnswerInputs";
import { Feedback } from "./Feedback";
import { ProductCard } from "./ProductCard";
import { Summary } from "./Summary";

const MAX_PER_ROUND: Record<Mode, number> = { options: OPTION_POINTS, guess: GUESS_MAX_POINTS };

export function Game({ mode, initialRounds }: { mode: Mode; initialRounds: PublicRound[] }) {
  const [rounds, setRounds] = useState(initialRounds);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [current, setCurrent] = useState<RoundResult | null>(null); // the round just answered
  const [summary, setSummary] = useState<{ isRecord: boolean; best: number } | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, startTransition] = useTransition();
  const nextRef = useRef<HTMLButtonElement>(null);

  const round = rounds[index];
  const score = results.reduce((sum, entry) => sum + entry.result.points, 0);

  // Move focus to "Next" so Enter continues without reaching for the mouse.
  useEffect(() => {
    if (current) nextRef.current?.focus();
  }, [current]);

  if (rounds.length === 0) return <EmptyCatalog />;

  function goNext() {
    setNotice("");
    if (index + 1 >= rounds.length) {
      setSummary(recordScore(mode, score));
      return;
    }
    setIndex(index + 1);
    setCurrent(null);
  }

  function answer(value: number) {
    if (!round || current || busy) return;
    startTransition(async () => {
      const result = await submitAnswer(mode, round.id, value);
      if (!result) {
        // The admin removed or hid this product mid-game.
        setNotice("A product was just removed from the catalog, so it was skipped.");
        goNext();
        return;
      }
      const entry: RoundResult = { round, answer: value, result };
      setResults((previous) => [...previous, entry]);
      setCurrent(entry);
    });
  }

  function playAgain() {
    startTransition(async () => {
      const next = await startGame(mode);
      setRounds(next);
      setIndex(0);
      setResults([]);
      setCurrent(null);
      setSummary(null);
      setNotice("");
    });
  }

  if (summary) {
    return (
      <Summary
        mode={mode}
        results={results}
        score={score}
        maxScore={results.length * MAX_PER_ROUND[mode]}
        isRecord={summary.isRecord}
        best={summary.best}
        busy={busy}
        onPlayAgain={playAgain}
      />
    );
  }

  const answered = current ? index + 1 : index;

  return (
    <>
      <div className="hud">
        <span className="hud-round">
          Round {index + 1} / {rounds.length}
        </span>
        <div className="progress" role="presentation">
          <div className="progress-fill" style={{ width: `${(answered / rounds.length) * 100}%` }} />
        </div>
        <span className="hud-score">{formatPoints(score)} pts</span>
      </div>

      {notice && <p className="notice">{notice}</p>}

      <ProductCard key={`product-${round.id}`} round={round} />

      {mode === "options" && round.options ? (
        <OptionsAnswer
          key={`answer-${round.id}`}
          options={round.options}
          reveal={current ? { picked: current.answer, actual: current.result.actual } : undefined}
          busy={busy}
          onPick={answer}
        />
      ) : (
        <GuessAnswer key={`answer-${round.id}`} locked={busy || !!current} onGuess={answer} />
      )}

      {current && (
        <Feedback
          key={`feedback-${round.id}`}
          ref={nextRef}
          mode={mode}
          answer={current.answer}
          result={current.result}
          isLast={index + 1 >= rounds.length}
          onNext={goNext}
        />
      )}
    </>
  );
}

function EmptyCatalog() {
  return (
    <section className="empty-state">
      <h2>No products to guess yet</h2>
      <p>The catalog is empty. Add real products in the admin dashboard, then come back to play.</p>
      <Link href="/admin" className="btn btn-primary">
        Open the admin dashboard
      </Link>
    </section>
  );
}
