/* ==========================================================================
   LOS PELLOT LED — site chrome
   Header, footer and cart drawer are injected identically on every page so
   markup lives in one place. Call mountChrome('pageId') at the end of body.
   ========================================================================== */

const NAV_LINKS = [
  { id: "home", href: "index.html", label: "Inicio" },
  { id: "products", href: "products.html", label: "Productos" },
  { id: "vehicle", href: "vehicle.html", label: "Por Vehículo" },
  { id: "installation", href: "installation.html", label: "Instalación" },
  { id: "offers", href: "offers.html", label: "Ofertas" },
  { id: "contact", href: "contact.html", label: "Contáctanos" },
];

function headerHTML(active) {
  const linkClasses = (id) =>
    "text-sm font-semibold tracking-wide transition-colors " +
    (id === active ? "text-white" : "text-muted hover:text-white");

  const links = NAV_LINKS.map(l => `
    <a href="${l.href}" class="${linkClasses(l.id)} relative py-1">
      ${l.label.toUpperCase()}
      ${l.id === active ? '<span class="absolute left-0 right-0 -bottom-1 h-0.5 bg-blue rounded-full"></span>' : ""}
    </a>
  `).join("");

  const mobileLinks = NAV_LINKS.map(l => `
    <a href="${l.href}" class="block px-5 py-3 text-sm font-semibold tracking-wide border-b border-white/5 ${l.id === active ? "text-white bg-white/5" : "text-muted"}">
      ${l.label.toUpperCase()}
    </a>
  `).join("");

  return `
  <header class="sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-white/5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        <a href="index.html" class="flex items-center gap-2 shrink-0">
          <img src="assets/logo.png" alt="Los Pellot LED and Accessories Distributors" class="h-14 w-auto drop-shadow-[0_0_14px_rgba(47,94,255,0.35)]" />
        </a>

        <nav class="hidden lg:flex items-center gap-8">
          ${links}
        </nav>

        <div class="flex items-center gap-4">
          <button id="search-toggle" class="hidden sm:flex w-9 h-9 items-center justify-center rounded-full text-muted hover:text-white hover:bg-white/5 transition" aria-label="Buscar" title="Buscar">
            ${icon("search", "w-5 h-5")}
          </button>
          <button id="account-toggle" class="w-9 h-9 hidden sm:flex items-center justify-center rounded-full text-muted hover:text-white hover:bg-white/5 transition" aria-label="Cuenta" title="Mi Cuenta">
            ${icon("user", "w-5 h-5")}
          </button>
          <button id="cart-toggle" class="relative w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-white hover:bg-white/5 transition" aria-label="Carrito">
            ${icon("cart", "w-5 h-5")}
            <span id="cart-count" class="hidden absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue text-[10px] font-bold text-white flex items-center justify-center">0</span>
          </button>
          <button id="mobile-menu-toggle" class="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-white" aria-label="Menú">
            ${icon("menu", "w-6 h-6")}
          </button>
        </div>
      </div>
    </div>

    <div id="search-bar" class="hidden border-t border-white/5 bg-surface">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <form id="search-form" class="flex items-center gap-3">
          <span class="text-muted">${icon("search", "w-5 h-5")}</span>
          <input id="search-input" type="text" placeholder="Buscar faros, LEDs, kits…" class="flex-1 bg-transparent text-white placeholder-muted text-sm focus:outline-none" />
        </form>
      </div>
    </div>

    <div id="mobile-menu" class="hidden lg:hidden border-t border-white/5 bg-surface">
      ${mobileLinks}
      <button id="account-toggle-mobile" class="block w-full px-5 py-3 text-sm font-semibold tracking-wide text-muted" style="text-align:left">
        INICIAR SESIÓN
      </button>
    </div>
  </header>`;
}

function footerHTML() {
  const catLinks = CATEGORIES.slice(0, 6).map(c =>
    `<a href="products.html?category=${c.id}" class="block text-sm text-muted hover:text-blue-glow transition py-1">${c.name}</a>`
  ).join("");

  return `
  <footer class="border-t border-white/5 bg-surface mt-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
      <div class="col-span-2 md:col-span-1">
        <img src="assets/logo.png" alt="Los Pellot LED" class="h-16 w-auto mb-4" />
        <p class="text-sm text-muted leading-relaxed">Distribuidores de LEDs y accesorios para vehículos. Instalación profesional en Massachusetts, envíos a todo Estados Unidos y Puerto Rico.</p>
      </div>
      <div>
        <h4 class="font-display text-lg font-semibold text-white mb-3 tracking-wide">Enlaces Rápidos</h4>
        ${NAV_LINKS.map(l => `<a href="${l.href}" class="block text-sm text-muted hover:text-blue-glow transition py-1">${l.label}</a>`).join("")}
      </div>
      <div>
        <h4 class="font-display text-lg font-semibold text-white mb-3 tracking-wide">Categorías</h4>
        ${catLinks}
      </div>
      <div>
        <h4 class="font-display text-lg font-semibold text-white mb-3 tracking-wide">Contacto</h4>
        <div class="flex items-start gap-2 text-sm text-muted py-1"><span class="mt-0.5 text-blue-glow">${icon("pin", "w-4 h-4")}</span> Massachusetts, USA</div>
        <div class="flex items-start gap-2 text-sm text-muted py-1"><span class="mt-0.5 text-blue-glow">${icon("mail", "w-4 h-4")}</span> info@lospellotled.com</div>
        <div class="flex items-start gap-2 text-sm text-muted py-1"><span class="mt-0.5 text-blue-glow">${icon("phone", "w-4 h-4")}</span> (787) 555-0142</div>
      </div>
    </div>
    <div class="border-t border-white/5">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p class="text-xs text-muted">© 2024–2026 Los Pellot LED and Accessories Distributors. Todos los derechos reservados.</p>
        <p class="text-xs text-muted tracking-wide">EST. 2024</p>
      </div>
    </div>
  </footer>`;
}

function cartDrawerHTML() {
  return `
  <div id="cart-overlay" class="fixed inset-0 bg-black/60 z-40 opacity-0 pointer-events-none"></div>
  <aside id="cart-drawer" class="fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-surface border-l border-white/10 translate-x-full flex flex-col">
    <div class="flex items-center justify-between px-5 h-20 border-b border-white/5">
      <h3 class="font-display text-2xl font-semibold text-white tracking-wide">Tu Carrito</h3>
      <button id="cart-close" class="w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-white hover:bg-white/5" aria-label="Cerrar carrito">
        ${icon("close", "w-5 h-5")}
      </button>
    </div>

    <div class="flex-1 overflow-y-auto px-5">
      <div id="cart-drawer-empty" class="hidden flex-col items-center justify-center text-center h-full py-20">
        <div class="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center text-muted mb-4">${icon("cart", "w-7 h-7")}</div>
        <p class="text-white font-semibold mb-1">Tu carrito está vacío</p>
        <p class="text-sm text-muted mb-5">Añade productos para verlos aquí.</p>
        <a href="products.html" id="cart-empty-shop" class="inline-block px-5 py-2.5 rounded-full bg-blue hover:bg-blue-dark text-white text-sm font-semibold transition">Ver Productos</a>
      </div>
      <div id="cart-drawer-items"></div>
    </div>

    <div id="cart-drawer-footer" class="hidden border-t border-white/5 p-5 space-y-3">
      <div class="flex items-center justify-between text-sm text-muted">
        <span>Envío</span><span>Se calcula al finalizar</span>
      </div>
      <div class="flex items-center justify-between text-lg font-bold text-white">
        <span>Subtotal</span><span id="cart-subtotal">$0.00</span>
      </div>
      <a href="checkout.html" class="block text-center w-full py-3 rounded-full bg-blue hover:bg-blue-dark text-white font-semibold transition glow-ring">Proceder al Checkout</a>
    </div>
  </aside>`;
}

function wireChromeEvents() {
  document.getElementById("cart-toggle")?.addEventListener("click", openCartDrawer);
  document.getElementById("cart-close")?.addEventListener("click", closeCartDrawer);
  document.getElementById("cart-overlay")?.addEventListener("click", closeCartDrawer);

  document.getElementById("mobile-menu-toggle")?.addEventListener("click", () => {
    document.getElementById("mobile-menu")?.classList.toggle("hidden");
  });

  document.getElementById("search-toggle")?.addEventListener("click", () => {
    const bar = document.getElementById("search-bar");
    bar?.classList.toggle("hidden");
    if (!bar?.classList.contains("hidden")) document.getElementById("search-input")?.focus();
  });

  document.getElementById("search-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("search-input").value.trim();
    window.location.href = "products.html" + (q ? "?q=" + encodeURIComponent(q) : "");
  });
}

function mountChrome(active) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  const cartRoot = document.getElementById("cart-root");
  if (header) header.innerHTML = headerHTML(active);
  if (footer) footer.innerHTML = footerHTML();
  if (cartRoot) cartRoot.innerHTML = cartDrawerHTML();
  wireChromeEvents();
  updateCartCount();
  renderCartDrawer();
  if (typeof mountAccountUI === "function") mountAccountUI();
}
