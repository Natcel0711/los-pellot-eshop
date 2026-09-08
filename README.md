# Los Pellot LED and Accessories Distributors — eShop

A plain HTML/CSS/JS storefront (Tailwind CSS, compiled locally — no build step
needed to run it, only to *edit* styles). No backend: cart and checkout are
fully client-side (localStorage), and the checkout/contact/booking forms end
in an on-page confirmation screen rather than actually charging a card or
sending an email.

## Running it — IMPORTANT: use a local server, not double-click

The `vehicle.html` page (the 3D vehicle configurator) uses real ES modules
to load Three.js, and **browsers block ES modules from loading over
`file://`** for security reasons — this affects every site that uses
modules, not just this one. So don't just double-click `index.html`.
Instead, from a terminal in this folder, run one of:

```
npx serve .
```
or
```
python3 -m http.server 8000
```

then open the printed address (e.g. `http://localhost:3000` or
`http://localhost:8000`) in your browser. Any other static file server
(nginx, a hosting provider, GitHub Pages, etc.) works the same way — the
only requirement is that it's served over `http://` or `https://`, not
opened directly from disk. If someone does open `vehicle.html` directly,
the page detects it and shows an on-screen explanation instead of silently
breaking.

This also makes cart persistence (localStorage) more reliable, since some
browsers restrict it under `file://` too.

## Pages

| File                | Route            |
|---------------------|------------------|
| `index.html`        | Home             |
| `products.html`     | Catalog, filters by vehicle/category, sort |
| `vehicle.html`      | Interactive **3D** vehicle configurator (drag to rotate, scroll to zoom, click a glowing zone) |
| `installation.html` | Services, pricing, booking form |
| `offers.html`       | Sale items |
| `contact.html`      | Contact form |
| `checkout.html`     | Cart review, shipping/payment form, order confirmation |

## Structure

- `js/data.js` — **the product catalog, vehicle list, and category/hotspot
  definitions live here.** This is the file you'll edit most: add real
  products, real vehicle fitment, swap in real bulb types, etc.
- `js/icons.js` — inline SVG icon set + `hydrateIcons()`, which swaps
  `<span data-icon="name">` placeholders in static HTML for real SVGs
  (used because raw HTML can't run JS template literals — see note below)
- `js/cart.js` — localStorage cart logic + drawer rendering
- `js/chrome.js` — shared header/footer/cart-drawer markup, injected into
  every page's `#site-header` / `#site-footer` / `#cart-root`
- `js/products-ui.js` — product card rendering + add-to-cart wiring, shared
  by the home, products, offers, and vehicle pages
- `js/vehicle-scene.js` — the **3D vehicle configurator**: builds the
  low-poly car (extruded from the same silhouette as the original 2D
  artwork), lighting, ground, glowing clickable hotspot markers, orbit/zoom
  camera controls, raycasting for clicks and hover, and the
  front/side/rear camera presets. This is a real ES module
  (`import`/`export`) — see the file-serving note above.
- `js/vehicle-app.js` — wires the year/make/model/trim selectors and the
  results panel to the 3D scene above. Also an ES module.
- `js/vendor/` — Three.js, vendored locally (installed via npm, then
  copied here) so the site has no external CDN dependency for the 3D
  engine. `three.module.min.js` needs its sibling `three.core.min.js` in
  the same folder — don't remove one without the other. `controls/OrbitControls.js`
  is Three.js's official orbit-camera control addon, copied unmodified.
- `css/main.css` — hand-written custom effects (glows, hotspot pings, the
  view-switch fade, marquee, etc.)
- `css/input.css` — Tailwind entry point (`@import "./main.css"` **must**
  stay before the `@tailwind` directives — CSS requires `@import` first,
  and Tailwind's CLI will silently drop it otherwise)
- `css/app.css` — the compiled, minified stylesheet actually linked from
  every page. Regenerate it after editing `main.css`, `tailwind.config.js`,
  or any class names in the HTML/JS:

  ```
  npm install
  npx tailwindcss -i css/input.css -o css/app.css --minify
  ```

## Adjusting the 3D vehicle

The car body is a single flat silhouette (the same one used in the
original 2D artwork) extruded into a 3D shape — it's intentionally
stylized/low-poly, not a real licensed car model. The clickable zones
(`HOTSPOTS_3D` in `js/vehicle-scene.js`) are placed by hand-tuned x/y/z
coordinates; if you resize or reshape the body, you'll likely need to
nudge those too. Two things that helped a lot while tuning them:

- `window.__vehicleScene.getHotspotScreenPositions()` (open the browser
  console on `vehicle.html` after picking a vehicle) prints every
  hotspot's exact current on-screen pixel position — handy for verifying
  placement instead of guessing.
- Keep hotspots that sit near each other on the real car (e.g. headlight,
  DRL, turn signal, fog light on the front fascia) spaced out enough in
  3D that they don't visually overlap from common viewing angles —
  otherwise a click can land on the wrong one.

## Extending the catalog / vehicle fitment

Right now every product in `js/data.js` is either `universal: true` or
tagged with a category only — there's no per-vehicle fitment table, so the
vehicle configurator shows the same product list for a given zone
regardless of which car is selected (it does show the correct **bulb type**
per zone, e.g. H11 for headlights, via the `FITMENT` map). For a real
launch you'll want to add a proper fitment table (which SKUs fit which
year/make/model/trim) — the data shapes are already set up so that's a
matter of adding a `fits: [...]` array to each product and filtering on it
in `products.html` and `js/vehicle.js`.

## Known placeholders (by design, since there's no backend)

- Checkout's payment fields are UI only — no real payment gateway is wired
  up. You'll want to integrate something like Stripe or a processor your
  bank supports before taking real orders.
- Contact and booking forms show a confirmation screen but don't actually
  send an email — wire them to a form service (Formspree, etc.) or your
  own backend endpoint.
- Contact info (phone, email, hours) is placeholder — update in
  `js/chrome.js` (footer) and `contact.html`.
