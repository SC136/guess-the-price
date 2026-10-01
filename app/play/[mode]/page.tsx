import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Game } from "@/components/Game";
import { createRounds } from "@/lib/game";
import { isMode } from "@/lib/types";

export const metadata: Metadata = { title: "Play" };

export default async function PlayPage({ params }: PageProps<"/play/[mode]">) {
  const { mode } = await params;
  if (!isMode(mode)) notFound();

  await connection(); // every visit gets a fresh random set of products
  const rounds = await createRounds(mode);

  return (
    <main className="app">
      <nav className="back">
        <Link href="/">← Change mode</Link>
      </nav>
      <Game mode={mode} initialRounds={rounds} />
    </main>
  );
}
