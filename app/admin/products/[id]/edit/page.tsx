import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProductForm } from "@/components/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { getProduct, listProducts } from "@/lib/store";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]/edit">) {
  await requireAdmin();
  await connection();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const categories = [...new Set((await listProducts()).map((p) => p.category))].sort();

  return (
    <>
      <div className="admin-head">
        <h1>Edit product</h1>
      </div>
      <ProductForm product={product} categories={categories} />
    </>
  );
}
