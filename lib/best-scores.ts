"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Mode } from "./types";

// Best scores live in the player's browser. Storage can be blocked (private mode), so every
// access is wrapped and the game works fine without it.

const KEY = "guess-the-price:best";
const CHANGED = "guess-the-price:best-changed";

type Best = Partial<Record<Mode, number>>;

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function parse(raw: string): Best {
  try {
    return (JSON.parse(raw) as Best | null) ?? {};
  } catch {
    return {};
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

/** The player's best score for a mode, or null if they haven't played it. */
export function useBestScore(mode: Mode): number | null {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  return useMemo(() => parse(raw)[mode] ?? null, [raw, mode]);
}

/** Saves the score if it beats the stored best. Returns whether it was a new record. */
export function recordScore(mode: Mode, score: number): { isRecord: boolean; best: number } {
  const best = parse(readRaw());
  const previous = best[mode] ?? 0;
  if (score <= previous) return { isRecord: false, best: previous };

  try {
    localStorage.setItem(KEY, JSON.stringify({ ...best, [mode]: score }));
    window.dispatchEvent(new Event(CHANGED));
  } catch {
    // Not persisted, but the player still sees the record on the results screen.
  }
  return { isRecord: true, best: score };
}
