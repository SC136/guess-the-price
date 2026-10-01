"use client";

import { useEffect, useState } from "react";
import { currencySymbol, formatPrice } from "@/lib/format";
import { hasCents, parsePrice } from "@/lib/pricing";

interface OptionsAnswerProps {
  options: number[];
  /** Set once the round has been answered, to colour the right and wrong picks. */
  reveal?: { picked: number; actual: number };
  busy: boolean;
  onPick: (price: number) => void;
}

export function OptionsAnswer({ options, reveal, busy, onPick }: OptionsAnswerProps) {
  const locked = busy || !!reveal;
  // Every option is shown with the same decimals so the real price can't be spotted by format.
  const decimals = options.some(hasCents) ? 2 : 0;

  // Keys 1-4 pick an option.
  useEffect(() => {
    if (locked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const choice = options[Number(event.key) - 1];
      if (choice !== undefined) onPick(choice);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, options, onPick]);

  return (
    <div className="options" role="group" aria-label="Price options">
      {options.map((price, i) => {
        let state = "";
        if (reveal) {
          if (price === reveal.actual) state = "is-correct";
          else if (price === reveal.picked) state = "is-wrong";
        }
        return (
          <button
            key={price}
            type="button"
            className={`option ${state}`}
            disabled={locked}
            onClick={() => onPick(price)}
          >
            <kbd aria-hidden="true">{i + 1}</kbd>
            <span>{formatPrice(price, decimals)}</span>
          </button>
        );
      })}
    </div>
  );
}

interface GuessAnswerProps {
  locked: boolean;
  onGuess: (price: number) => void;
}

export function GuessAnswer({ locked, onGuess }: GuessAnswerProps) {
  const [error, setError] = useState("");

  return (
    <form
      className="guess"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (locked) return;
        const guess = parsePrice(String(new FormData(event.currentTarget).get("guess") ?? ""));
        if (guess === null) {
          setError("Enter a price above zero, like 1299 or 49.99");
          return;
        }
        setError("");
        onGuess(guess);
      }}
    >
      <label htmlFor="guess-input" className="sr-only">
        Your price guess
      </label>
      <div className="guess-field">
        <span className="guess-prefix" aria-hidden="true">
          {currencySymbol()}
        </span>
        <input
          id="guess-input"
          name="guess"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          autoFocus
          disabled={locked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "guess-error" : undefined}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={locked}>
        Lock it in
      </button>
      <p id="guess-error" className="guess-error" role="alert">
        {error}
      </p>
    </form>
  );
}
