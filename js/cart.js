/* ==========================================================================
   LOS PELLOT LED — Cart
   localStorage-backed cart shared across every page of the site.
   ========================================================================== */

const CART_KEY = "lp_cart_v1";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) { /* storage unavailable — cart just won't persist */ }
  window.dispatchEvent(new CustomEvent("cart:change"));
}

function addToCart(productId, qty = 1, meta = {}) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const cart = getCart();
  const key = productId + (meta.vehicle ? "::" + meta.vehicle : "");
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ key, id: productId, qty, vehicle: meta.vehicle || null });
  }
  saveCart(cart);
  flashCartBadge();
}

function removeFromCart(key) {
  saveCart(getCart().filter(i => i.key !== key));
}

function setQty(key, qty) {
  const cart = getCart();
  const item = cart.find(i => i.key === key);
  if (!item) return;
  if (qty <= 0) {
    removeFromCart(key);
    return;
  }
  item.qty = qty;
  saveCart(cart);
}

function cartLines() {
  return getCart().map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    if (!product) return null;
    const unitPrice = product.salePrice ?? product.price;
    return { ...item, product, unitPrice, lineTotal: unitPrice * item.qty };
  }).filter(Boolean);
}

function cartCount() {
  return getCart().reduce((n, i) => n + i.qty, 0);
}

function cartSubtotal() {
  return cartLines().reduce((sum, l) => sum + l.lineTotal, 0);
}

function money(n) {
  return "$" + n.toFixed(2);
}

function flashCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  badge.classList.remove("cart-pulse");
  void badge.offsetWidth;
  badge.classList.add("cart-pulse");
}

function updateCartCount() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n;
  badge.classList.toggle("hidden", n === 0);
}

function renderCartDrawer() {
  const list = document.getElementById("cart-drawer-items");
  const emptyState = document.getElementById("cart-drawer-empty");
  const footer = document.getElementById("cart-drawer-footer");
  if (!list) return;

  const lines = cartLines();

  if (lines.length === 0) {
    list.innerHTML = "";
    emptyState?.classList.remove("hidden");
    footer?.classList.add("hidden");
    return;
  }

  emptyState?.classList.add("hidden");
  footer?.classList.remove("hidden");

  list.innerHTML = lines.map(l => `
    <div class="flex gap-3 py-4 border-b border-white/5" data-key="${l.key}">
      <div class="w-16 h-16 shrink-0 rounded-lg bg-surface-2 border border-white/5 flex items-center justify-center text-blue-glow">
        ${icon(CATEGORIES.find(c => c.id === l.product.category)?.icon || "bolt", "w-7 h-7")}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-white leading-snug truncate">${l.product.name}</p>
        <p class="text-xs text-muted mt-0.5">${categoryName(l.product.category)}${l.vehicle ? " · " + l.vehicle : ""}</p>
        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center gap-2 bg-surface-2 rounded-full border border-white/10">
            <button class="qty-btn w-6 h-6 flex items-center justify-center text-muted hover:text-white" data-key="${l.key}" data-delta="-1">${icon("minus", "w-3.5 h-3.5")}</button>
            <span class="text-xs w-4 text-center">${l.qty}</span>
            <button class="qty-btn w-6 h-6 flex items-center justify-center text-muted hover:text-white" data-key="${l.key}" data-delta="1">${icon("plus", "w-3.5 h-3.5")}</button>
          </div>
          <span class="text-sm font-bold text-white">${money(l.lineTotal)}</span>
        </div>
      </div>
      <button class="remove-btn text-muted hover:text-blue-glow self-start" data-key="${l.key}" aria-label="Remove item">
        ${icon("close", "w-4 h-4")}
      </button>
    </div>
  `).join("");

  const subtotalEl = document.getElementById("cart-subtotal");
  if (subtotalEl) subtotalEl.textContent = money(cartSubtotal());

  list.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const delta = parseInt(btn.dataset.delta, 10);
      const item = getCart().find(i => i.key === key);
      if (item) setQty(key, item.qty + delta);
    });
  });

  list.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(btn.dataset.key));
  });
}

function openCartDrawer() {
  document.getElementById("cart-drawer")?.classList.remove("translate-x-full");
  document.getElementById("cart-overlay")?.classList.remove("opacity-0", "pointer-events-none");
  document.body.classList.add("overflow-hidden");
}

function closeCartDrawer() {
  document.getElementById("cart-drawer")?.classList.add("translate-x-full");
  document.getElementById("cart-overlay")?.classList.add("opacity-0", "pointer-events-none");
  document.body.classList.remove("overflow-hidden");
}

window.addEventListener("cart:change", () => {
  updateCartCount();
  renderCartDrawer();
});
