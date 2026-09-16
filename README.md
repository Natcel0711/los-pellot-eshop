# Los Pellot LED and Accessories Distributors — eShop

An Angular frontend backed by a real ASP.NET Core Web API. Cart, accounts,
and orders are genuine persisted features (SQLite via EF Core, ASP.NET Core
Identity + JWT auth) — this replaced an earlier static HTML/JS prototype
where all of that lived only in localStorage.

## Project layout

```
client/   Angular app (standalone components, Tailwind CSS)
server/   ASP.NET Core Web API (LosPellot.Api) — EF Core + SQLite, JWT auth
```

## Running it

You need two terminals — one for the API, one for the Angular dev server.

**1. API** (from `server/LosPellot.Api`):

```
dotnet run --launch-profile https
```

On first run this creates and migrates `lospellot.db` (SQLite) and seeds it
with the product catalog, categories, and vehicle year/make/model/trim data.
By default it listens on `https://localhost:7179` (and `http://localhost:5149`).

**2. Angular app** (from `client`):

```
npm install
npm start
```

Serves on `http://localhost:4200`. Its dev server proxies `/api/*` requests
to the API (see `client/proxy.conf.json`), so the app just calls relative
`/api/...` paths — no CORS configuration needed in dev.

Open `http://localhost:4200`.

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero, vehicle finder, category grid, best sellers |
| `/products` | Catalog with filters (vehicle, category, sale-only), sort, search |
| `/vehicle` | Interactive **3D** vehicle configurator (Three.js) — select a vehicle, click a glowing zone |
| `/installation` | Services, pricing, real booking form |
| `/contact` | Real contact form |
| `/checkout` | Two-step checkout: shipping (creates a pending order) → payment (confirms it) |
| `/account/orders` | Order history (requires login) |
| `/admin` | Admin panel — see below (requires an admin account) |

## Admin panel (`/admin`)

Full CRUD over the catalog plus order/booking/message management, gated by
an `IsAdmin` flag on the user (a JWT claim, checked by the `AdminOnly`
authorization policy server-side and the `adminGuard` client-side). It has
its own layout (`AdminLayout`) with no public header/footer/cart — the app
shell hides those on any `/admin` route.

A default admin account is seeded on first run:

```
email:    admin@lospellotled.com
password: Admin123!
```

**Change or remove this before any real deployment** — it's a well-known
default, not a secret. Log in as this user and open the account menu →
"Panel de Administración", or go straight to `/admin`.

Pages: **Panel** (dashboard/stats), **Productos** (full CRUD), **Inventario**
(dedicated per-product stock editor with a low-stock filter), **Categorías**
(CRUD), **Vehículos** (manage the year/make/model/trim tree, including
expandable trim lists per model), **Órdenes** (view all orders, change
status), **Citas** (installation bookings — change status, delete),
**Mensajes** (contact messages — mark handled, delete), **Usuarios** (list,
promote/demote admin, delete — an admin can't demote or delete themselves).

Backend surface lives in `Controllers/Admin/` (one controller per resource)
and `DTOs/AdminDtos.cs`; frontend in `features/admin/` with all API calls
consolidated in `core/api/admin-api.ts`.

## Backend structure (`server/LosPellot.Api`)

- `Models/` — EF Core entities: `Category`, `Product`, `ProductFitment`,
  `VehicleYear`/`VehicleMake`/`VehicleModel`/`VehicleTrim`, `CartHeader`/`CartItem`,
  `Order`/`OrderItem`/`Payment`, `Booking`, `ContactMessage`, `ApplicationUser`, `RefreshToken`.
- `Data/AppDbContext.cs` — the EF Core context (extends `IdentityDbContext`).
- `Data/SeedData.cs` — seeds categories/vehicles/products from the original
  site's data on first run in development.
- `Controllers/` — `AuthController` (register/login/refresh/logout/me),
  `CategoriesController`, `ProductsController` (filtering/sorting),
  `VehiclesController` (year→make→model→trim tree), `CartController`
  (guest-token or JWT-user cart, merge-on-login), `OrdersController`
  (two-phase checkout — create pending order, then confirm payment — plus
  order history), `BookingsController`, `ContactController`.
- `Services/JwtTokenService.cs`, `Services/CartResolver.cs` — shared logic
  used by multiple controllers.
- `Services/Payments/IPaymentService.cs` — the payment-provider abstraction;
  `MockPaymentService` is the only implementation today (dev/test only, no
  real gateway). See `PAYMENT_INTEGRATION.md` at the repo root for exactly
  what's involved in swapping in a real one (Stripe or otherwise).

Cart works for both guests (an `X-Guest-Cart-Token` header, minted on first
write) and logged-in users (tied to their account, merged from any guest
cart on login) — see `CartController`/`CartResolver`. Checkout re-resolves
this same server-side cart and never trusts client-supplied prices/quantities
— see `PAYMENT_INTEGRATION.md` for the full checkout/payment/inventory
design (idempotency, atomic stock decrement, order vs. payment status).

### Migrations

```
cd server/LosPellot.Api
dotnet ef migrations add <Name>
dotnet ef database update
```

### Tests

`server/LosPellot.Api.Tests` (xUnit) covers the checkout/payment/inventory
business logic against a real in-memory SQLite connection (not EF's
`InMemory` provider — the atomic stock-decrement logic relies on
`ExecuteUpdateAsync`, which needs a real relational provider): successful
checkout, payment failure + retry, insufficient inventory (both at checkout
and the rarer stock-ran-out-mid-payment race), concurrent purchase of the
last unit, price-manipulation resistance, and idempotent request replay.

```
dotnet test server/LosPellot.Api.Tests
```

### Configuration

`appsettings.json` holds the SQLite connection string and JWT settings
(issuer/audience/signing key/token lifetimes). The signing key there is a
**dev-only placeholder** — replace it before any real deployment.

## Frontend structure (`client/src/app`)

- `core/api/` — one thin `HttpClient` wrapper per backend resource.
- `core/services/` — `Auth`, `Cart`, `Catalog`, `Toast`, `UiState` (RxJS
  `BehaviorSubject`-based state, no NgRx).
- `core/interceptors/` — attaches the JWT bearer token and the guest cart
  token to outgoing requests; retries once through a silent refresh on 401.
- `core/guards/auth-guard.ts` — protects `/account/orders`.
- `layout/` — `Header`, `Footer`, `CartDrawer`, `AccountModal`, `ToastHost`,
  mounted once in the app shell.
- `shared/` — `Icon` component + `icons.ts` (ported inline SVG set),
  `ProductCard`, the year/make/model/trim cascading-select helpers, category
  color/icon lookups.
- `features/` — one folder per route. `features/vehicle/vehicle-scene.ts` is
  the ported Three.js scene builder; `vehicle-scene-view/` wraps it in an
  Angular component (creates it in `ngAfterViewInit`, calls `.destroy()` in
  `ngOnDestroy` to stop its render loop).

Styling uses Tailwind CSS v4 (CSS-first config via `@theme` in
`src/styles.css`) with the original site's color palette/fonts, plus the
hand-written effects (glow, cart-pulse, marquee, stage-view fade) ported into
`src/styles/main.css`.

The app is **zoneless** (no zone.js) — state that changes asynchronously
(HTTP responses, timers) is held in Angular signals or RxJS
`BehaviorSubject`s consumed via the `async` pipe, both of which notify
Angular's change detection correctly without zone.js. A plain field mutated
inside a raw `.subscribe()` callback will *not* update the view — keep this
in mind when adding new async state.

## Known gaps / next steps

- **Per-vehicle fitment data**: `ProductFitment` rows exist so vehicle
  selection can genuinely filter products, but only universal products are
  seeded with a (wildcard) fitment row today — non-universal products need
  real fitment data entered before vehicle filtering is fully useful.
- **Payment**: checkout/order/inventory is real (server-side validation,
  authoritative pricing, atomic stock decrement, idempotent requests, a
  proper `Payment` model with its own status distinct from order status),
  but the actual payment gateway is mocked (`MockPaymentService`) — no real
  charge is ever made. See `PAYMENT_INTEGRATION.md` for exactly what's left
  to connect a real provider (Stripe or otherwise); the mock is designed as
  a one-line `Program.cs` swap plus a webhook controller, not a rewrite.
- **Single admin flag, no granular roles**: `ApplicationUser.IsAdmin` is a
  simple bool, not a full role/permission system — fine for one or two
  trusted admins, not for tiered staff permissions.
