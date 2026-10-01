"use server";

import { checkAnswer, createRounds } from "@/lib/game";
import { isMode, type AnswerResult, type PublicRound } from "@/lib/types";

// These are public: anyone can play. Inputs still come from the network, so validate them.

export async function startGame(mode: string): Promise<PublicRound[]> {
  if (!isMode(mode)) return [];
  return createRounds(mode);
}

export async function submitAnswer(mode: string, productId: string, answer: number): Promise<AnswerResult | null> {
  if (!isMode(mode) || typeof productId !== "string") return null;
  if (typeof answer !== "number" || !Number.isFinite(answer) || answer <= 0 || answer >= 1e9) return null;
  return checkAnswer(productId, mode, answer);
}
