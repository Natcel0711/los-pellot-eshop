/* ==========================================================================
   LOS PELLOT LED — product card rendering + add-to-cart wiring
   Shared by index.html, products.html, offers.html and vehicle.html.
   ========================================================================== */

function badgeClasses(badge) {
  if (badge === "Sale") return "bg-amber text-black";
  if (badge === "Best Seller") return "bg-blue text-white";
  if (badge === "New") return "bg-white/90 text-black";
  return "bg-white/10 text-white";
}

function renderProductCard(product, opts = {}) {
  const cat = CATEGORIES.find(c => c.id === product.category);
  const onSale = product.salePrice != null;
  const price = onSale ? product.salePrice : product.price;
  const vehicleTag = opts.vehicle ? `<p class="text-[11px] text-blue-glow mt-1">Compatible con tu vehículo</p>` : "";

  return `
  <div class="group bg-surface border border-white/10 rounded-2xl overflow-hidden hover:border-blue/40 glow-ring transition flex flex-col">
    <div class="relative h-36 sm:h-40 bg-gradient-to-br from-surface-2 to-bg flex items-center justify-center">
      <div class="absolute w-24 h-24 rounded-full bg-blue/25 blur-2xl"></div>
      <div class="relative text-blue-glow group-hover:text-white transition">
        ${icon(cat?.icon || "bolt", "w-12 h-12")}
      </div>
      ${product.badge ? `<span class="absolute top-3 left-3 text-[10px] font-bold tracking-wide px-2 py-1 rounded-full ${badgeClasses(product.badge)}">${product.badge.toUpperCase()}</span>` : ""}
    </div>
    <div class="p-4 flex flex-col flex-1">
      <p class="text-[11px] text-muted font-semibold tracking-wide uppercase">${cat ? cat.name : ""}</p>
      <h3 class="text-sm font-semibold text-white mt-1 leading-snug min-h-[2.5rem]">${product.name}</h3>
      <div class="flex items-center gap-2 mt-2 text-[11px] text-muted">
        <span>${product.lumens} lúmenes</span><span>·</span><span>${product.warranty} garantía</span>
      </div>
      ${vehicleTag}
      <div class="mt-auto pt-4 flex items-center justify-between">
        <div class="flex items-baseline gap-2">
          <span class="text-lg font-bold text-white">${money(price)}</span>
          ${onSale ? `<span class="text-xs text-muted line-through">${money(product.price)}</span>` : ""}
        </div>
        <button
          class="add-to-cart-btn w-9 h-9 rounded-full bg-blue hover:bg-blue-dark flex items-center justify-center transition"
          data-id="${product.id}" data-vehicle="${opts.vehicle || ""}" aria-label="Agregar al carrito" title="Agregar al carrito">
          ${icon("plus", "w-4 h-4")}
        </button>
      </div>
    </div>
  </div>`;
}

function showToast(message) {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2";
    document.body.appendChild(root);
  }
  const toast = document.createElement("div");
  toast.className = "bg-surface border border-blue/40 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg flex items-center gap-2 glow-border opacity-0 translate-y-2 transition-all duration-300";
  toast.innerHTML = `<span class="text-blue-glow">${icon("check", "w-4 h-4")}</span> ${message}`;
  root.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
  });
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

/* Delegated so it also works for cards injected after this runs (filters, sort, etc.) */
function wireAddToCartButtons(container = document) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart-btn");
    if (!btn) return;
    const product = PRODUCTS.find(p => p.id === btn.dataset.id);
    addToCart(btn.dataset.id, 1, { vehicle: btn.dataset.vehicle || null });
    if (product) showToast(`${product.name} añadido al carrito`);
  });
}
