# Los Pellot LED and Accessories Distributors — eShop

One SvelteKit app: the store, the customer accounts, checkout and the admin
panel. It replaced an Angular frontend + ASP.NET Core API (still on the
`main` branch); [MIGRATION.md](MIGRATION.md) maps every old file and
endpoint to where it lives now.

- **SvelteKit 3 + Svelte 5**, TypeScript, Tailwind CSS 4
- **SQLite** through [Drizzle ORM](https://orm.drizzle.team): a local file in
  development, [Turso](https://turso.tech) (hosted SQLite) in production
- **Vercel Blob** for product photos
- **Shippo** for real shipping labels (optional)

## Run it locally

You need Node 22 or newer.

```sh
npm install
cp .env.example .env      # the defaults work as-is for local development
npm run db:setup          # creates local.db, the catalog and the admin account
npm run dev
```

Open http://localhost:5173. Log in as the admin from your `.env`
(`admin@lospellotled.com` / `Admin123!` by default) and use the account menu
→ "Panel de Administración", or go to `/admin`.

## Commands

| Command               | What it does                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `npm run dev`         | Start the dev server                                                 |
| `npm test`            | Run the checkout/payment/inventory tests                             |
| `npm run check`       | Type-check everything                                                |
| `npm run build`       | Production build                                                     |
| `npm run db:setup`    | Apply migrations, add the starting catalog and admin (safe to rerun) |
| `npm run db:generate` | After editing `schema.ts`: create a migration in `drizzle/`          |
| `npm run db:studio`   | Browse the database in your browser                                  |

## How the code is organized

```
src/
  routes/                 one folder per URL
    +layout.server.ts     data every page gets: user, cart, categories, vehicles
    +layout.svelte        header, footer, cart drawer, account modal
    products/             +page.server.ts loads data, +page.svelte shows it
    checkout/             two-step checkout (form actions)
    account/, cart/       actions used by the account modal and cart buttons
    admin/                admin panel (guarded in admin/+layout.server.ts)
  lib/
    server/               runs only on the server
      db/schema.ts        every table
      orders.ts           checkout + payment rules (tested in orders.test.ts)
      cart.ts, auth.ts, catalog.ts, payments.ts, shipping.ts, images.ts
    components/           shared UI pieces (ProductCard, Icon, header…)
    state/                browser state: language, open panels, toasts
    i18n/translations.ts  Spanish / English text
    vehicle/              the Three.js 3D vehicle configurator
  hooks.server.ts         runs on every request: session, cart cookie, language
  env.ts                  every environment variable, documented
```

The pattern for every page: `+page.server.ts` has a `load` function that
reads the database, and `actions` that handle form submissions. The
`+page.svelte` next to it shows the data and posts its forms to those
actions. There is no separate API.

## Deploy to Vercel

1. **Database** — create a free database at [turso.tech](https://turso.tech),
   then get its URL (`libsql://…`) and an auth token.
2. **Set up the database once**, from your computer:
   ```sh
   DATABASE_URL=libsql://your-db.turso.io DATABASE_AUTH_TOKEN=… \
   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-real-password' \
   npm run db:setup
   ```
   Run it again after future schema changes (it only applies new migrations).
3. **Import the repo in Vercel.** It detects SvelteKit; no build settings needed.
4. **Environment variables** (Project → Settings → Environment Variables):
   `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, and optionally `SHIPPO_API_TOKEN`
   plus the `SHIP_FROM_*` return address.
5. **Photos** — Project → Storage → create a **Blob** store and connect it.
   Vercel adds `BLOB_READ_WRITE_TOKEN` for you. Redeploy.

### Moving off Vercel later

Nothing is tied to Vercel except two small things:

- **Adapter**: in `vite.config.ts`, swap `@sveltejs/adapter-vercel` for
  `@sveltejs/adapter-node` (`npm i -D @sveltejs/adapter-node`). `npm run
build` then produces a plain Node server (`node build`) that runs on any
  VPS, Docker host, Render, Fly.io, etc.
- **Photos**: `src/lib/server/images.ts` is the only file that talks to
  Vercel Blob. Swap its two calls for S3 / Cloudflare R2, or a local folder
  on a server with a persistent disk.

The database (Turso) works from anywhere. A server with a persistent disk
can also just use a SQLite file (`DATABASE_URL=file:/data/shop.db`).

## Things to know

- **Payments are simulated.** Checkout shows a yellow test-mode box and never
  charges anyone. [PAYMENT_INTEGRATION.md](PAYMENT_INTEGRATION.md) lists what
  connecting Stripe takes.
- **Shipping labels**: `/admin/orders/<number>/label` always prints a packing
  slip. Buying real labels needs `SHIPPO_API_TOKEN` (a free `shippo_test_…`
  token works) and your real return address in `SHIP_FROM_*`.
- **Vehicle fitment**: only universal products have fitment data, so picking
  a vehicle on `/products` shows universal products. Non-universal products
  need fitment rows before vehicle filtering is fully useful.
- **One admin flag**: users are either admins or customers; there are no
  finer-grained roles.
