# Guess the Price

A browser game: you see a real product, then guess its price. Built with Next.js (App Router) and TypeScript.

- **Pick the price**: four options, one is real. 100 points per correct pick.
- **Exact guess**: type your own number. Points depend on how close you are (up to 1,000 per round).
- After each answer the player sees the real price and a **buy link** to the product.
- Products are added by an admin in the dashboard at `/admin`. There is no built-in or demo catalog.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then edit it (see below)
npm run dev                  # http://localhost:3000
```

Locally the catalog is a JSON file and uploaded photos go to disk (`./data`), so nothing else needs setting up.

`.env.local`:

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin`. |
| `SESSION_SECRET` | 32+ random characters that sign the admin session cookie (`openssl rand -base64 32`). |
| `NEXT_PUBLIC_CURRENCY` | ISO code used to format every price, e.g. `INR` (default), `USD`, `GBP`. Read at **build** time. |
| `DATA_DIR` | Optional. Where the catalog and uploaded photos are stored locally (default `./data`). |

## Deploy to Vercel

Vercel's filesystem is read-only, so a deployed site keeps its catalog in **Upstash Redis** and its uploaded photos in **Vercel Blob**. The app switches to them automatically when their environment variables are present, and shows a setup message until they are.

1. **Import the repo** at [vercel.com/new](https://vercel.com/new). It's detected as Next.js; no build settings to change.
2. **Add environment variables** (Project → Settings → Environment Variables):
   - `ADMIN_PASSWORD`: a strong password.
   - `SESSION_SECRET`: 32+ random characters (`openssl rand -base64 32`).
   - `NEXT_PUBLIC_CURRENCY`: optional, defaults to `INR`.
3. **Add storage** (Project → Storage), then connect each to the project:
   - **Upstash Redis** (from the Marketplace). Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
   - **Blob**, created as a **public** store. Vercel injects `BLOB_READ_WRITE_TOKEN`. (Skip it if you only paste image addresses; uploads are then disabled.)
4. **Redeploy** so the new variables take effect.
5. **Move your existing catalog** (optional, only if you already added products locally):

   ```bash
   vercel env pull .env.vercel --environment=production   # pulls the Redis/Blob credentials
   npm run migrate:catalog -- --dry-run                    # preview; changes nothing
   npm run migrate:catalog                                 # copy products (and any uploaded photos) up
   ```

   It upserts by product id and never deletes, so it's safe to re-run. Otherwise just add products at `/admin` on the live site.

The admin dashboard shows where the catalog and photos are currently stored, so you can confirm the deployment is wired up.

Notes:

- Uploaded photos are limited to **4 MB**, because Vercel Functions reject request bodies over 4.5 MB.
- Photos pasted as an image address are hotlinked from that site and can break if the store changes its image URLs. Uploading is more reliable.
- Login attempts are limited to 8 failures per 15 minutes per IP. On Vercel the counters live in Redis (serverless instances don't share memory).

## Adding products

1. Open `/admin` and sign in.
2. Click **Add product**. Fill in the name, the exact current price, a category and the **product link** (Amazon, Flipkart, any store).
3. Add a photo: upload a JPG/PNG/WebP, or paste an image address.
4. Optional description: a hint for players (specs, size). Don't put the price in it.

Hide a product with the **Active/Hidden** pill. Each game uses up to 10 random active products.

## How it works

- `lib/pricing.ts`: scoring, price parsing, and the multiple-choice generator. Decoys copy the real price's style (`…99`, `…990`, `…900`, round numbers) so the answer can't be spotted by how it looks.
- `lib/game.ts` + `app/actions/game.ts`: the server picks the rounds and checks answers. The browser never receives a price or buy link until the player has answered that product.
- `lib/store.ts`: picks the catalog backend. `lib/redis-catalog.ts` is the Redis implementation (one hash, id → product); the local JSON file is the fallback.
- `lib/images.ts`: photos go to Vercel Blob when configured, otherwise to `DATA_DIR/uploads`.
- `lib/auth.ts`: constant-time password check, signed httpOnly session cookie, login throttling. Every admin page and server action calls `requireAdmin()` itself, because server actions can be called directly.

## Scripts

```bash
npm test                    # unit tests: scoring, parsing, option generation, Redis catalog
npm run lint
npm run typecheck
npm run build && npm start
npm run migrate:catalog     # copy the local catalog to Redis/Blob (see above)
```
