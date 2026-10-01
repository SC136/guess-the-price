import { readUpload } from "@/lib/images";

// Serves photos uploaded through the admin dashboard from the data directory.
// (Files added to /public after `next build` aren't served, hence a route handler.)
export async function GET(_request: Request, ctx: RouteContext<"/api/images/[name]">) {
  const { name } = await ctx.params;
  const image = await readUpload(name);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      // File names are random UUIDs, so a given URL never changes its content.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
