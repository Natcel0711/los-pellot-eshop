# Migration map: Angular + ASP.NET Core → SvelteKit

This branch replaces `client/` (Angular) and `server/` (C# API) with a single
SvelteKit app. The originals stay untouched on `main`.

## The big idea

Before, there were two programs: the Angular app in the browser called the C#
API over HTTP (`/api/...`) with JWT tokens. Now there is **one** program.
Each page has a `+page.server.ts` that reads the database directly before the
page renders, and forms post to **form actions** in the same file. There's no
separate API, no tokens in localStorage and no HTTP interceptors.

| Before (Angular + C#)                                               | After (SvelteKit)                                                           |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `client/src/app/features/<page>/` (component + template)            | `src/routes/<page>/+page.svelte`                                            |
| Angular service calling `HttpClient` → C# controller                | `+page.server.ts` `load()` reads the DB directly                            |
| `POST /api/...` controller action                                   | form action in `+page.server.ts` (`export const actions`)                   |
| `Controllers/Admin/*` with `[Authorize(Policy = "AdminOnly")]`      | `src/routes/admin/**`, guarded once in `src/hooks.server.ts`                |
| EF Core `Models/` + `AppDbContext` + `Migrations/`                  | `src/lib/server/db/schema.ts` (Drizzle) + `drizzle/` migrations             |
| SQLite file on Render's disk (wiped on redeploy)                    | SQLite file locally, **Turso** (hosted SQLite) in production                |
| ASP.NET Identity + JWT + refresh tokens                             | `users` + `sessions` tables, one httpOnly cookie (`src/lib/server/auth.ts`) |
| `X-Guest-Cart-Token` header in localStorage                         | `lp_cart` httpOnly cookie                                                   |
| `CartResolver`, `OrdersController` logic                            | `src/lib/server/cart.ts`, `src/lib/server/orders.ts`                        |
| `IPaymentService` / `MockPaymentService`                            | `src/lib/server/payments.ts` (same mock, same seam)                         |
| `IShippingLabelService` / `ShippoLabelService`                      | `src/lib/server/shipping.ts`                                                |
| Product images saved to `wwwroot/uploads`                           | `src/lib/server/images.ts` → **Vercel Blob** (local folder in dev)          |
| RxJS `BehaviorSubject` services (`UiState`, `Toast`, `Translation`) | Svelte 5 rune modules in `src/lib/state/`                                   |
| `core/i18n/translations.ts`                                         | `src/lib/i18n/translations.ts` (copied as-is)                               |
| `vehicle-scene.ts` (Three.js)                                       | `src/lib/vehicle/vehicle-scene.ts` (copied as-is)                           |
| xUnit tests (`LosPellot.Api.Tests`)                                 | Vitest tests in `src/lib/server/orders.test.ts`                             |

## Routes

| URL                       | Angular component                      | SvelteKit route                            |
| ------------------------- | -------------------------------------- | ------------------------------------------ |
| `/`                       | `features/home`                        | `routes/+page.svelte`                      |
| `/products`               | `features/products`                    | `routes/products/`                         |
| `/vehicle`                | `features/vehicle`                     | `routes/vehicle/`                          |
| `/installation`           | `features/installation`                | `routes/installation/`                     |
| `/contact`                | `features/contact`                     | `routes/contact/`                          |
| `/checkout`               | `features/checkout`                    | `routes/checkout/`                         |
| `/account/orders`         | `features/orders/order-history`        | `routes/account/orders/`                   |
| `/admin` … `/admin/users` | `features/admin/*`                     | `routes/admin/(panel)/*`                   |
| `/admin/orders/:no/label` | `features/admin/orders/shipping-label` | `routes/admin/orders/[orderNumber]/label/` |

## API endpoints → where they went

| C# endpoint                                                                                            | SvelteKit                                                                      |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `POST /api/auth/register`, `login`, `logout`, `PUT me`                                                 | actions in `routes/account/+page.server.ts`                                    |
| `POST /api/auth/refresh`, `GET me`                                                                     | gone — the session cookie is read in `hooks.server.ts`                         |
| `GET /api/categories`, `GET /api/vehicles/tree`                                                        | `routes/+layout.server.ts` (loaded once for every page)                        |
| `GET /api/products`                                                                                    | `routes/products/+page.server.ts` (`listProducts` in `lib/server/catalog.ts`)  |
| `/api/cart/*` (get, add, update, remove, merge)                                                        | layout load + actions in `routes/cart/+page.server.ts`; merge happens on login |
| `POST /api/orders`, `POST /api/orders/{no}/payment`, `GET {no}`                                        | actions + load in `routes/checkout/+page.server.ts`                            |
| `GET /api/orders/mine`                                                                                 | `routes/account/orders/+page.server.ts`                                        |
| `POST /api/bookings`                                                                                   | action in `routes/installation/+page.server.ts`                                |
| `POST /api/contact`                                                                                    | action in `routes/contact/+page.server.ts`                                     |
| `/api/admin/*` (dashboard, products, categories, vehicles, orders, shipping, bookings, contact, users) | load + actions in each `routes/admin/(panel)/<page>/+page.server.ts`           |

## Deliberate changes

- **Money is stored in cents** (integers) in the database to avoid rounding
  errors. Pages still see normal dollar amounts.
- **Statuses are stored as text** (`'Received'`, `'Paid'`), not numbers, so
  the "never reorder the enum" hazard from the C# models is gone.
- **Admin protection happens on the server for every admin request**,
  including form submissions, in one place (`hooks.server.ts`).
- **The default admin account** comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
  environment variables instead of a hardcoded password.
- **Product filters live in the URL** (`/products?category=…&sort=…`), so a
  filtered view can be bookmarked or shared.
