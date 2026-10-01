"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { saveProductAction } from "@/app/admin/actions";
import { MAX_IMAGE_BYTES } from "@/lib/config";
import { currencySymbol } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./ProductImage";

interface ProductFormProps {
  /** Present when editing; omitted when adding a new product. */
  product?: Product;
  /** Existing categories, offered as suggestions. */
  categories: string[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const errors = { ...state?.errors, ...(fileError ? { image: fileError } : {}) };
  // After a failed submit React resets the form, so re-apply what the admin typed.
  const initial = (field: string, fallback = "") => state?.values?.[field] ?? fallback;
  const externalImage = product?.imageUrl.startsWith("http") ? product.imageUrl : "";
  const currentImage = preview ?? product?.imageUrl;

  return (
    <form action={action} className="admin-card product-form">
      {product && <input type="hidden" name="id" value={product.id} />}
      {errors.form && (
        <p className="form-error" role="alert">
          {errors.form}
        </p>
      )}

      <Field label="Product name" error={errors.name} htmlFor="name">
        <input
          id="name"
          name="name"
          defaultValue={initial("name", product?.name)}
          placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
          maxLength={140}
          required
          autoFocus
        />
      </Field>

      <div className="field-row">
        <Field label="Price" error={errors.price} htmlFor="price" hint="The exact current price on the store.">
          <div className="input-prefix">
            <span aria-hidden="true">{currencySymbol()}</span>
            <input
              id="price"
              name="price"
              inputMode="decimal"
              defaultValue={initial("price", product ? String(product.price) : "")}
              placeholder="29,990"
              required
            />
          </div>
        </Field>
        <Field label="Category" error={errors.category} htmlFor="category">
          <input
            id="category"
            name="category"
            list="category-options"
            defaultValue={initial("category", product?.category)}
            placeholder="e.g. Electronics"
            maxLength={40}
            required
          />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field
        label="Product link"
        error={errors.sourceUrl}
        htmlFor="sourceUrl"
        hint="Where players can buy it. Shown only after they answer."
      >
        <input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          defaultValue={initial("sourceUrl", product?.sourceUrl)}
          placeholder="https://www.amazon.in/dp/..."
          required
        />
      </Field>

      <Field
        label="Description"
        error={errors.description}
        htmlFor="description"
        hint="Optional. A hint for players: specs, size, model. Never include the price."
      >
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={initial("description", product?.description)}
        />
      </Field>

      <fieldset className="photo-field">
        <legend>Product photo</legend>
        <div className="photo-row">
          <div className="photo-preview">
            {currentImage ? <ProductImage src={currentImage} alt="Product photo preview" /> : <span>No photo yet</span>}
          </div>
          <div className="photo-inputs">
            <Field label="Upload a photo" error={errors.image} htmlFor="image" hint={`JPG, PNG or WebP, up to ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`}>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const picked = event.target.files?.[0] ?? null;
                  // Check here too: a body over the host's limit is rejected before the server can explain why.
                  if (picked && picked.size > MAX_IMAGE_BYTES) {
                    setFileError(`That photo is ${(picked.size / 1024 / 1024).toFixed(1)} MB. The limit is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`);
                    event.target.value = "";
                    setFile(null);
                    return;
                  }
                  setFileError("");
                  setFile(picked);
                }}
              />
            </Field>
            <Field
              label="…or paste an image address"
              error={errors.imageUrl}
              htmlFor="imageUrl"
              hint="Some stores block hotlinking, so uploading is more reliable."
            >
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                defaultValue={initial("imageUrl", externalImage)}
                placeholder="https://m.media-amazon.com/images/..."
              />
            </Field>
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn btn-dark" disabled={pending}>
          {pending ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
        <Link href="/admin" className="btn btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
