import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DeleteProductButton } from "@/components/DeleteProductButton";
import { ProductImage } from "@/components/ProductImage";
import { SetupNeeded } from "@/components/SetupNeeded";
import { requireAdmin } from "@/lib/auth";
import { MAX_ROUNDS } from "@/lib/config";
import { formatPrice, storeName } from "@/lib/format";
import { photoBackend } from "@/lib/images";
import { catalogBackend, listProducts } from "@/lib/store";
import { toggleProductAction } from "./actions";

// The admin layout's title template only applies to child segments, not to this page itself.
export const metadata: Metadata = { title: { absolute: "Products · Admin" } };

export default async function AdminDashboard() {
  await requireAdmin();
  await connection();
  if (catalogBackend() === "missing") return <SetupNeeded />;
  const products = await listProducts();
  const activeCount = products.filter((p) => p.active).length;

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Products</h1>
          <p className="muted">
            {products.length === 0
              ? "Nothing here yet."
              : `${activeCount} of ${products.length} active. Each game uses up to ${MAX_ROUNDS} random active products.`}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-dark">
          + Add product
        </Link>
      </div>

      <p className="storage-status">
        Catalog: {catalogBackend() === "redis" ? "Upstash Redis" : "local file (data/products.json)"} · Photos:{" "}
        {photoBackend() === "blob"
          ? "Vercel Blob"
          : photoBackend() === "disk"
            ? "local disk"
            : "no Blob store connected (paste image addresses instead of uploading)"}
      </p>

      {products.length === 0 ? (
        <section className="admin-card empty">
          <h2>Add your first real product</h2>
          <p className="muted">
            Find a product on Amazon, Flipkart or any store, then add its name, photo, current price and link. Players
            guess the price and get a buy link after answering.
          </p>
          <Link href="/admin/products/new" className="btn btn-dark">
            Add a product
          </Link>
        </section>
      ) : (
        <ul className="product-list">
          {products.map((product) => (
            <li key={product.id} className={`product-row ${product.active ? "" : "is-inactive"}`}>
              <ProductImage src={product.imageUrl} alt={product.name} className="row-thumb" />
              <div className="row-main">
                <strong>{product.name}</strong>
                <span className="muted">
                  {product.category} ·{" "}
                  <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {storeName(product.sourceUrl)} ↗
                  </a>
                </span>
              </div>
              <span className="row-price">{formatPrice(product.price)}</span>
              <div className="row-actions">
                <form action={toggleProductAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="active" value={String(!product.active)} />
                  <button
                    type="submit"
                    className={`status-pill ${product.active ? "on" : "off"}`}
                    title={product.active ? "Click to hide from the game" : "Click to show in the game"}
                  >
                    {product.active ? "Active" : "Hidden"}
                  </button>
                </form>
                <Link href={`/admin/products/${product.id}/edit`} className="link-button">
                  Edit
                </Link>
                <DeleteProductButton id={product.id} name={product.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
