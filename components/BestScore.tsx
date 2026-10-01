"use client";

import { useBestScore } from "@/lib/best-scores";
import { formatPoints } from "@/lib/format";
import type { Mode } from "@/lib/types";

export function BestScore({ mode }: { mode: Mode }) {
  const best = useBestScore(mode);
  return <span className="mode-best">{best === null ? "No score yet" : `Best: ${formatPoints(best)} pts`}</span>;
}
