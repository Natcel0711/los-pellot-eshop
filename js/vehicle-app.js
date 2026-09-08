/* ==========================================================================
   LOS PELLOT LED — vehicle page controller (3D)
   Wires the year/make/model/trim selectors, the results panel, the hover
   tooltip, and the bottom shortcuts grid to the Three.js scene.
   ========================================================================== */

import { createVehicleScene } from "./vehicle-scene.js";

const yearEl = document.getElementById("sel-year");
const makeEl = document.getElementById("sel-make");
const modelEl = document.getElementById("sel-model");
const trimEl = document.getElementById("sel-trim");

const params = new URLSearchParams(window.location.search);
wireVehicleSelectors({
  yearEl, makeEl, modelEl, trimEl,
  initial: { year: params.get("year") || "", make: params.get("make") || "", model: params.get("model") || "" },
});

let scene = null;

function vehicleReady() {
  return Boolean(yearEl.value && makeEl.value && modelEl.value);
}

function refreshVisibility() {
  const configurator = document.getElementById("configurator");
  const noVehicle = document.getElementById("no-vehicle");
  if (vehicleReady()) {
    configurator.classList.remove("hidden");
    noVehicle.classList.add("hidden");
    const label = `${yearEl.value} ${makeEl.value} ${modelEl.value}` + (trimEl.value ? ` ${trimEl.value}` : "");
    document.getElementById("stage-vehicle-name").textContent = label.toUpperCase();
    ensureScene();
    renderShortcuts();
  } else {
    configurator.classList.add("hidden");
    noVehicle.classList.remove("hidden");
  }
}

[yearEl, makeEl, modelEl, trimEl].forEach(el => el.addEventListener("change", refreshVisibility));

function ensureScene() {
  if (scene) return;
  const stage = document.getElementById("stage");
  scene = createVehicleScene(stage, {
    onHotspotClick: (category, label) => selectCategory(category, label),
    onHotspotHover: (label, x, y) => showTooltip(label, x, y),
    onAutoRotateChange: (isOn) => syncRotateButton(isOn),
  });
  window.__vehicleScene = scene; // exposed for debugging/testing only
}

function syncRotateButton(isOn) {
  const btn = document.getElementById("rotate-btn");
  btn.classList.toggle("border-blue/50", isOn);
  btn.querySelector("span").textContent = isOn ? "Girando…" : "Girar Automático";
}

function showTooltip(label, x, y) {
  const tip = document.getElementById("hotspot-tooltip");
  if (!label) { tip.classList.add("hidden"); return; }
  tip.textContent = label;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
  tip.classList.remove("hidden");
}

function selectCategory(category, label) {
  document.getElementById("panel-empty").classList.add("hidden");
  const content = document.getElementById("panel-content");
  content.classList.remove("hidden");

  const cat = CATEGORIES.find(c => c.id === category);
  document.getElementById("panel-icon").innerHTML = icon(cat?.icon || "bolt", "w-5 h-5");
  document.getElementById("panel-title").textContent = label.toUpperCase();
  document.getElementById("panel-fitment").textContent = FITMENT[category] || "Universal";

  const vehicleLabel = `${yearEl.value} ${makeEl.value} ${modelEl.value}`;
  const items = productsFor(category);
  document.getElementById("panel-products").innerHTML = items.length
    ? items.map(p => renderPanelRow(p, vehicleLabel)).join("")
    : `<p class="text-sm text-muted">Pronto tendremos productos para esta categoría.</p>`;
}

function renderPanelRow(product, vehicleLabel) {
  const onSale = product.salePrice != null;
  const price = onSale ? product.salePrice : product.price;
  const cat = CATEGORIES.find(c => c.id === product.category);
  return `
  <div class="flex items-center gap-3 bg-surface-2 border border-white/10 rounded-xl p-3">
    <div class="w-12 h-12 shrink-0 rounded-lg bg-bg flex items-center justify-center text-blue-glow">${icon(cat?.icon || "bolt", "w-6 h-6")}</div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-white leading-snug line-clamp-2">${product.name}</p>
      <p class="text-[11px] text-muted mt-0.5">${product.lumens} lúmenes · ${product.warranty}</p>
      <div class="flex items-center gap-2 mt-1">
        <span class="text-sm font-bold text-white">${money(price)}</span>
        ${onSale ? `<span class="text-[11px] text-muted line-through">${money(product.price)}</span>` : ""}
      </div>
    </div>
    <button class="add-to-cart-btn w-8 h-8 rounded-full bg-blue hover:bg-blue-dark flex items-center justify-center shrink-0 transition" data-id="${product.id}" data-vehicle="${vehicleLabel}" aria-label="Agregar al carrito">
      ${icon("plus", "w-4 h-4")}
    </button>
  </div>`;
}

function renderShortcuts() {
  document.getElementById("area-shortcuts").innerHTML = CATEGORIES.map(c => `
    <button class="shortcut-btn flex flex-col items-center gap-2 bg-surface border border-white/10 rounded-xl p-3 hover:border-blue/40 glow-ring transition" data-category="${c.id}" data-label="${c.name}">
      <span class="text-blue-glow">${icon(c.icon, "w-5 h-5")}</span>
      <span class="text-[10px] font-semibold text-center leading-tight text-muted">${c.name}</span>
    </button>
  `).join("");

  document.querySelectorAll(".shortcut-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      scene?.focusCategory(btn.dataset.category);
      selectCategory(btn.dataset.category, btn.dataset.label);
    });
  });
}

document.querySelectorAll(".view-btn").forEach(btn => {
  btn.addEventListener("click", () => scene?.goToView(btn.dataset.view));
});

document.getElementById("rotate-btn").addEventListener("click", () => {
  const isOn = scene?.toggleAutoRotate();
  syncRotateButton(isOn);
});

refreshVisibility();
