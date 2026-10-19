import Link from "next/link";
import { connection } from "next/server";
import { BestScore } from "@/components/BestScore";
import { Footer } from "@/components/Footer";
import { SetupNeeded } from "@/components/SetupNeeded";
import { MAX_ROUNDS } from "@/lib/config";
import { currencySymbol } from "@/lib/format";
import { catalogBackend, listActiveProducts } from "@/lib/store";

export default async function Home() {
  await connection(); // the catalog changes at runtime, so never prerender this page
  const needsSetup = catalogBackend() === "missing";
  const productCount = needsSetup ? 0 : (await listActiveProducts()).length;

  return (
    <main className="app">
      <header className="brand">
        <span className="brand-mark" aria-hidden="true">
          {currencySymbol()}
        </span>
        <h1>Guess the Price</h1>
        <p>Real products. Real prices. How well do you know the shelf?</p>
      </header>

      {needsSetup ? (
        <SetupNeeded />
      ) : productCount === 0 ? (
        <section className="empty-state">
          <h2>No products yet</h2>
          <p>The game needs real products to guess. Add some in the admin dashboard to get started.</p>
          <Link href="/admin" className="btn btn-primary">
            Open the admin dashboard
          </Link>
        </section>
      ) : (
        <>
          <div className="mode-grid">
            <Link href="/play/options" className="mode-card">
              <span className="mode-title">Pick the price</span>
              <span className="mode-desc">Four prices, only one is real. Earn 100 points for every right pick.</span>
              <BestScore mode="options" />
            </Link>
            <Link href="/play/guess" className="mode-card">
              <span className="mode-title">Exact guess</span>
              <span className="mode-desc">
                Type your own number. The closer you land, the more you score, up to 1,000 per round.
              </span>
              <BestScore mode="guess" />
            </Link>
          </div>
          <p className="fine-print">
            {Math.min(productCount, MAX_ROUNDS)} products per game · {productCount} in the catalog
          </p>
        </>
      )}

      <Footer showAdmin={true} />
    </main>
  );
}
