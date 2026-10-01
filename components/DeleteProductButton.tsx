"use client";

import { deleteProductAction } from "@/app/admin/actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${name}"? This also removes its uploaded photo.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="link-button danger">
        Delete
      </button>
    </form>
  );
}
