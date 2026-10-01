import type { PublicRound } from "@/lib/types";
import { ProductImage } from "./ProductImage";

export function ProductCard({ round }: { round: PublicRound }) {
  return (
    <article className="product">
      <div className="product-photo">
        <ProductImage src={round.imageUrl} alt={round.name} />
      </div>
      <span className="chip">{round.category}</span>
      <h2>{round.name}</h2>
      {round.description && <p className="product-desc">{round.description}</p>}
      <p className="question">What does it cost?</p>
    </article>
  );
}
