import type { Metadata } from "next";
import { connection } from "next/server";
import { ProductForm } from "@/components/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { listProducts } from "@/lib/store";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  await connection();
  const categories = [...new Set((await listProducts()).map((p) => p.category))].sort();

  return (
    <>
      <div className="admin-head">
        <h1>Add product</h1>
      </div>
      <ProductForm categories={categories} />
    </>
  );
}
