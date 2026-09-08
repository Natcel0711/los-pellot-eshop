/* ==========================================================================
   LOS PELLOT LED — Shared data layer
   Vehicles, categories, and product catalog used across every page.
   ========================================================================== */

const CATEGORIES = [
  { id: "headlights",    name: "Faros Delanteros",       icon: "headlight" },
  { id: "fog-lights",    name: "Fog Lights",             icon: "foglight" },
  { id: "drl",           name: "DRL / Luces Diurnas",    icon: "drl" },
  { id: "turn-signals",  name: "Direccionales",          icon: "signal" },
  { id: "tail-lights",   name: "Luces Traseras",         icon: "taillight" },
  { id: "reverse",       name: "Luz de Reversa",         icon: "reverse" },
  { id: "side-markers",  name: "Side Markers",           icon: "marker" },
  { id: "license-plate", name: "Luz de Placa",           icon: "plate" },
  { id: "interior",      name: "Interior / Cabina",      icon: "cabin" },
  { id: "underglow",     name: "Underglow",              icon: "underglow" },
  { id: "light-bars",    name: "Barras LED",             icon: "bar" },
  { id: "controllers",   name: "Switches y Controladores", icon: "controller" },
];

const VEHICLES = {
  2024: {
    Toyota: { "RAV4": ["LE", "XLE", "TRD Off-Road", "Limited"], "Camry": ["LE", "SE", "XSE"], "Tacoma": ["SR", "TRD Sport", "Limited"] },
    Honda:  { "Civic": ["LX", "Sport", "Type R"], "CR-V": ["LX", "EX-L", "Sport Touring"] },
    Ford:   { "Mustang": ["EcoBoost", "GT", "Dark Horse"], "F-150": ["XL", "Lariat", "Raptor"] },
    Jeep:   { "Wrangler": ["Sport", "Sahara", "Rubicon"], "Grand Cherokee": ["Laredo", "Limited"] },
    Chevrolet: { "Silverado 1500": ["WT", "LT", "Trail Boss"], "Camaro": ["LT1", "SS", "ZL1"] },
  },
  2020: {
    Toyota: { "RAV4": ["LE", "XLE", "TRD Off-Road", "Limited"], "Camry": ["LE", "SE", "XSE"], "Corolla": ["L", "LE", "SE"] },
    Honda:  { "Civic": ["LX", "Sport", "Si"], "Accord": ["LX", "Sport", "Touring"] },
    Ford:   { "Mustang": ["EcoBoost", "GT"], "F-150": ["XL", "Lariat", "Raptor"] },
    Jeep:   { "Wrangler": ["Sport", "Sahara", "Rubicon"] },
    Chevrolet: { "Silverado 1500": ["WT", "LT"], "Camaro": ["LT1", "SS"] },
  },
  2016: {
    Toyota: { "RAV4": ["LE", "XLE", "Limited"], "Camry": ["LE", "SE"], "Tacoma": ["SR", "TRD Sport"] },
    Honda:  { "Civic": ["LX", "EX"], "CR-V": ["LX", "EX-L"] },
    Ford:   { "Mustang": ["V6", "EcoBoost", "GT"], "F-150": ["XL", "Lariat"] },
    Jeep:   { "Wrangler": ["Sport", "Sahara", "Rubicon"] },
    Chevrolet: { "Silverado 1500": ["WT", "LT"], "Camaro": ["LT", "SS"] },
  },
  2012: {
    Toyota: { "Camry": ["LE", "SE"], "Corolla": ["L", "LE"] },
    Honda:  { "Civic": ["LX", "EX"], "Accord": ["LX", "EX"] },
    Ford:   { "Mustang": ["V6", "GT"], "F-150": ["XL", "Lariat"] },
    Jeep:   { "Wrangler": ["Sport", "Sahara"] },
    Chevrolet: { "Camaro": ["LT", "SS"] },
  },
};

/* Bulb-fitment lookup used by the vehicle configurator (approximate, per hotspot) */
const FITMENT = {
  headlights: "H11", "fog-lights": "H8", drl: "H16", "turn-signals": "7440",
  "tail-lights": "7443", reverse: "921", "side-markers": "168", "license-plate": "194",
  interior: "31mm Festoon", underglow: "Universal RGB", "light-bars": "Universal", controllers: "Universal",
};

/* Product catalog. `fits` is [] for universal items, or an array of {year,make,model} filters. */
const PRODUCTS = [
  { id: "p001", name: "Mini Chip LED Headlight Kit", category: "headlights", price: 65, salePrice: null, lumens: "60,000", warranty: "6 months", badge: "Best Seller", universal: false },
  { id: "p002", name: "360° LED Headlight Kit", category: "headlights", price: 45, salePrice: 35, lumens: "40,000", warranty: "3 months", badge: "Sale", universal: false },
  { id: "p003", name: "Super Chip LED Headlight Kit", category: "headlights", price: 85, salePrice: null, lumens: "100,000", warranty: "1 year", badge: null, universal: false },
  { id: "p004", name: "Kamaleon Dual-Color LED Kit", category: "headlights", price: 100, salePrice: null, lumens: "70,000", warranty: "1 year", badge: "Dual Color", universal: false },
  { id: "p005", name: "Fog Light LED Pods", category: "fog-lights", price: 55, salePrice: 42, lumens: "30,000", warranty: "6 months", badge: "Sale", universal: false },
  { id: "p006", name: "H8/H11 Fog Light Bulb Set", category: "fog-lights", price: 38, salePrice: null, lumens: "24,000", warranty: "6 months", badge: null, universal: false },
  { id: "p007", name: "DRL Switchback Strip Kit", category: "drl", price: 48, salePrice: null, lumens: "18,000", warranty: "6 months", badge: null, universal: false },
  { id: "p008", name: "H16 DRL LED Bulbs", category: "drl", price: 32, salePrice: null, lumens: "16,000", warranty: "3 months", badge: null, universal: false },
  { id: "p009", name: "Amber Turn Signal LED Set", category: "turn-signals", price: 22, salePrice: null, lumens: "6,000", warranty: "3 months", badge: null, universal: false },
  { id: "p010", name: "Switchback Turn Signal Kit", category: "turn-signals", price: 34, salePrice: 27, lumens: "8,000", warranty: "6 months", badge: "Sale", universal: false },
  { id: "p011", name: "7443 Tail Light LED Bulbs", category: "tail-lights", price: 28, salePrice: null, lumens: "9,000", warranty: "6 months", badge: null, universal: false },
  { id: "p012", name: "Sequential LED Tail Kit", category: "tail-lights", price: 90, salePrice: 72, lumens: "15,000", warranty: "1 year", badge: "Sale", universal: false },
  { id: "p013", name: "921 Reverse Light Bulbs", category: "reverse", price: 18, salePrice: null, lumens: "4,000", warranty: "3 months", badge: null, universal: false },
  { id: "p014", name: "168 Side Marker LED Set", category: "side-markers", price: 16, salePrice: null, lumens: "2,000", warranty: "3 months", badge: null, universal: false },
  { id: "p015", name: "Smoked Side Marker LEDs", category: "side-markers", price: 24, salePrice: null, lumens: "2,400", warranty: "3 months", badge: "New", universal: false },
  { id: "p016", name: "194 License Plate LED Bulbs", category: "license-plate", price: 12, salePrice: null, lumens: "1,200", warranty: "3 months", badge: null, universal: true },
  { id: "p017", name: "31mm Festoon Interior Kit", category: "interior", price: 20, salePrice: null, lumens: "3,000", warranty: "6 months", badge: null, universal: true },
  { id: "p018", name: "RGB Cabin Light Kit w/ App Control", category: "interior", price: 58, salePrice: 46, lumens: "5,000", warranty: "1 year", badge: "Sale", universal: true },
  { id: "p019", name: "Footwell Ambient LED Kit", category: "interior", price: 44, salePrice: null, lumens: "4,500", warranty: "1 year", badge: null, universal: true },
  { id: "p020", name: "RGB Underglow Kit — 4pc", category: "underglow", price: 120, salePrice: 96, lumens: "20,000", warranty: "1 year", badge: "Sale", universal: true },
  { id: "p021", name: "Bluetooth Underglow Controller Kit", category: "underglow", price: 145, salePrice: null, lumens: "24,000", warranty: "1 year", badge: "Best Seller", universal: true },
  { id: "p022", name: '20" Curved LED Light Bar', category: "light-bars", price: 110, salePrice: null, lumens: "40,000", warranty: "1 year", badge: null, universal: true },
  { id: "p023", name: '30" Dual-Row Light Bar', category: "light-bars", price: 160, salePrice: 130, lumens: "60,000", warranty: "1 year", badge: "Sale", universal: true },
  { id: "p024", name: "RF Wireless LED Controller", category: "controllers", price: 25, salePrice: null, lumens: "—", warranty: "6 months", badge: null, universal: true },
  { id: "p025", name: "App-Controlled RGB Relay Box", category: "controllers", price: 40, salePrice: null, lumens: "—", warranty: "1 year", badge: "New", universal: true },
];

/* Hotspots for the vehicle configurator, positioned as % coordinates per view */
const HOTSPOTS = {
  front: [
    { category: "headlights",   label: "Faros Delanteros",  x: 27, y: 46 },
    { category: "fog-lights",   label: "Fog Lights",        x: 21, y: 66 },
    { category: "drl",          label: "DRL / Diurnas",     x: 40, y: 40 },
    { category: "turn-signals", label: "Direccionales",     x: 55, y: 44 },
  ],
  side: [
    { category: "side-markers", label: "Side Markers",  x: 30, y: 48 },
    { category: "underglow",    label: "Underglow",     x: 50, y: 78 },
    { category: "interior",     label: "Interior",      x: 62, y: 38 },
  ],
  rear: [
    { category: "tail-lights",   label: "Luces Traseras",  x: 26, y: 44 },
    { category: "reverse",       label: "Luz de Reversa",  x: 50, y: 50 },
    { category: "license-plate", label: "Luz de Placa",    x: 50, y: 66 },
  ],
};

function productsFor(categoryId) {
  return PRODUCTS.filter(p => p.category === categoryId);
}

function categoryName(id) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? c.name : id;
}

/* Wires up a Year → Make → Model → Trim cascading select group. */
function wireVehicleSelectors({ yearEl, makeEl, modelEl, trimEl, initial = {} }) {
  const years = Object.keys(VEHICLES).sort((a, b) => b - a);

  function fill(el, options, placeholder) {
    el.innerHTML = `<option value="">${placeholder}</option>` +
      options.map(o => `<option value="${o}">${o}</option>`).join("");
    el.disabled = options.length === 0;
  }

  fill(yearEl, years, "Año");
  fill(makeEl, [], "Marca");
  fill(modelEl, [], "Modelo");
  if (trimEl) fill(trimEl, [], "Trim / Versión");

  yearEl.addEventListener("change", () => {
    const makes = yearEl.value ? Object.keys(VEHICLES[yearEl.value]) : [];
    fill(makeEl, makes, "Marca");
    fill(modelEl, [], "Modelo");
    if (trimEl) fill(trimEl, [], "Trim / Versión");
  });

  makeEl.addEventListener("change", () => {
    const models = (yearEl.value && makeEl.value) ? Object.keys(VEHICLES[yearEl.value][makeEl.value]) : [];
    fill(modelEl, models, "Modelo");
    if (trimEl) fill(trimEl, [], "Trim / Versión");
  });

  if (trimEl) {
    modelEl.addEventListener("change", () => {
      const trims = (yearEl.value && makeEl.value && modelEl.value) ? VEHICLES[yearEl.value][makeEl.value][modelEl.value] : [];
      fill(trimEl, trims, "Trim / Versión");
    });
  }

  if (initial.year) {
    yearEl.value = initial.year;
    yearEl.dispatchEvent(new Event("change"));
    if (initial.make) {
      makeEl.value = initial.make;
      makeEl.dispatchEvent(new Event("change"));
      if (initial.model) {
        modelEl.value = initial.model;
        modelEl.dispatchEvent(new Event("change"));
        if (trimEl && initial.trim) trimEl.value = initial.trim;
      }
    }
  }
}
