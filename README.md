# Guess the Price

A browser game: you see a real product, then guess its price. Built with Next.js (App Router) and TypeScript.

- **Pick the price**: four options, one is real. 100 points per correct pick.
- **Exact guess**: type your own number. Points depend on how close you are (up to 1,000 per round).
- After each answer the player sees the real price and a **buy link** to the product.
- Products are added by an admin in the dashboard at `/admin`. There is no built-in or demo catalog.

## Run it

```bash
npm install
cp .env.example .env.local   # then edit it (see below)
npm run dev                  # http://localhost:3000
```

`.env.local`:

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin`. |
| `SESSION_SECRET` | 32+ random characters that sign the admin session cookie (`openssl rand -base64 32`). |
| `NEXT_PUBLIC_CURRENCY` | ISO code used to format every price, e.g. `INR` (default), `USD`, `GBP`. |
| `DATA_DIR` | Optional. Where the catalog and uploaded photos are stored (default `./data`). |

## Adding products

1. Open `/admin` and sign in.
2. Click **Add product**. Fill in the name, the exact current price, a category and the **product link** (Amazon, Flipkart, any store).
3. Add a photo: upload a JPG/PNG/WebP (up to 5 MB) or paste an image address. Uploading is more reliable, because some stores block hotlinked images.
4. Optional description: a hint for players (specs, size). Don't put the price in it.

Hide a product with the **Active/Hidden** pill. Each game uses up to 10 random active products.

## How it works

- `lib/pricing.ts`: scoring, price parsing, and the multiple-choice generator. Decoys copy the real price's style (`…99`, `…999`, round numbers) so the answer can't be spotted by how it looks.
- `lib/game.ts` + `app/actions/game.ts`: the server picks the rounds and checks answers. The browser never receives a price or buy link until the player has answered that product.
- `lib/store.ts`: the catalog is a JSON file in `DATA_DIR`. Uploaded photos live in `DATA_DIR/uploads` and are served by `app/api/images/[name]`.
- `lib/auth.ts`: password check (constant time), signed httpOnly session cookie, login throttling. Every admin page and server action calls `requireAdmin()` itself, because server actions can be called directly.

## Scripts

```bash
npm test         # unit tests for scoring, parsing and option generation
npm run lint
npm run typecheck
npm run build && npm start
```

## Deploying

The JSON-file catalog needs a writable disk (a VPS, Docker volume, or Railway/Fly volume works). On read-only platforms such as Vercel, replace `lib/store.ts` and `lib/images.ts` with a hosted database and blob storage. Nothing else touches the filesystem.
