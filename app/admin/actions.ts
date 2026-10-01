"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  clearLoginFailures,
  createSession,
  destroySession,
  isLockedOut,
  passwordMatches,
  recordLoginFailure,
  requireAdmin,
} from "@/lib/auth";
import { removeUpload, saveUpload } from "@/lib/images";
import * as store from "@/lib/store";
import { ProductSchema, type FieldErrors } from "@/lib/validation";

export interface LoginState {
  error?: string;
}

export interface ProductFormState {
  errors?: FieldErrors;
  /** Echoed back so the form keeps what the admin typed (React resets forms after an action). */
  values?: Record<string, string>;
}

export async function loginAction(_prev: LoginState | undefined, formData: FormData): Promise<LoginState> {
  if (!process.env.ADMIN_PASSWORD) return { error: "ADMIN_PASSWORD is not set on the server (see .env.example)." };
  if (await isLockedOut()) return { error: "Too many failed attempts. Try again in 15 minutes." };

  if (!passwordMatches(String(formData.get("password") ?? ""))) {
    await recordLoginFailure();
    await new Promise((resolve) => setTimeout(resolve, 600)); // slow down guessing
    return { error: "Incorrect password." };
  }

  await clearLoginFailures();
  await createSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function saveProductAction(
  _prev: ProductFormState | undefined,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin();

  const text = (name: string) => String(formData.get(name) ?? "");
  const values = {
    id: text("id"),
    name: text("name"),
    description: text("description"),
    category: text("category"),
    price: text("price"),
    sourceUrl: text("sourceUrl"),
    imageUrl: text("imageUrl"),
  };

  const parsed = ProductSchema.safeParse(values);
  const errors: FieldErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) errors[issue.path[0] as keyof FieldErrors] ??= issue.message;
  }

  const existing = values.id ? await store.getProduct(values.id) : undefined;
  if (values.id && !existing) return { errors: { form: "That product no longer exists." }, values };

  const upload = formData.get("image");
  const file = upload instanceof File && upload.size > 0 ? upload : null;
  if (!file && !values.imageUrl && !existing?.imageUrl) {
    errors.image = "Add a product photo: upload one or paste an image address.";
  }
  if (!parsed.success || Object.keys(errors).length > 0) return { errors, values };

  const data = parsed.data;
  let uploadedUrl: string | undefined;
  try {
    // An uploaded file wins over a pasted address, which wins over the existing photo.
    if (file) uploadedUrl = await saveUpload(file);
    const imageUrl = uploadedUrl ?? (data.imageUrl || existing?.imageUrl || "");

    const fields = {
      name: data.name,
      description: data.description,
      category: data.category,
      price: data.price,
      sourceUrl: data.sourceUrl,
      imageUrl,
    };

    if (existing) {
      const updated = await store.updateProduct(existing.id, fields);
      if (updated && updated.before.imageUrl !== imageUrl) await removeUpload(updated.before.imageUrl);
    } else {
      await store.createProduct({ ...fields, active: true });
    }
  } catch (error) {
    if (uploadedUrl) await removeUpload(uploadedUrl);
    const message = error instanceof Error ? error.message : "Could not save the product.";
    return { errors: uploadedUrl === undefined && file ? { image: message } : { form: message }, values };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const removed = await store.deleteProduct(String(formData.get("id") ?? ""));
  if (removed) await removeUpload(removed.imageUrl);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await store.updateProduct(String(formData.get("id") ?? ""), { active: formData.get("active") === "true" });
  revalidatePath("/admin");
  revalidatePath("/");
}
