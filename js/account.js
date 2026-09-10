/* ==========================================================================
   LOS PELLOT LED — Accounts
   localStorage-backed, no backend. Handles profile creation, log in / out,
   and a small profile editor. Injected on every page via mountChrome().

   NOTE: there is no server here, so "accounts" live only in this browser and
   the password is only lightly obfuscated — this is a demo auth flow, not
   real security. Wire it to a real backend before taking real accounts.
   ========================================================================== */

const ACCOUNTS_KEY = "lp_accounts_v1";
const SESSION_KEY = "lp_session_v1";

/* ----------------------------- storage ---------------------------------- */

function getAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) { /* storage unavailable — accounts just won't persist */ }
}

function getSessionEmail() {
  try {
    return localStorage.getItem(SESSION_KEY) || null;
  } catch (e) {
    return null;
  }
}

function setSessionEmail(email) {
  try {
    if (email) localStorage.setItem(SESSION_KEY, email);
    else localStorage.removeItem(SESSION_KEY);
  } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent("account:change"));
}

/* Tiny non-cryptographic hash so the raw password isn't sitting in
   localStorage in plain text. Not a substitute for real password hashing. */
function obfuscate(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

/* ----------------------------- api ------------------------------------- */

function currentUser() {
  const email = getSessionEmail();
  if (!email) return null;
  const acct = getAccounts().find(a => a.email === email);
  if (!acct) return null;
  const { pass, ...safe } = acct;
  return safe;
}

function signUp({ name, email, password }) {
  name = (name || "").trim();
  email = (email || "").trim().toLowerCase();

  if (!name) return { ok: false, error: "Escribe tu nombre." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Correo electrónico inválido." };
  if ((password || "").length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };

  const accounts = getAccounts();
  if (accounts.some(a => a.email === email)) {
    return { ok: false, error: "Ya existe una cuenta con ese correo." };
  }

  accounts.push({ name, email, pass: obfuscate(password), created: Date.now() });
  saveAccounts(accounts);
  setSessionEmail(email);
  return { ok: true };
}

function logIn({ email, password }) {
  email = (email || "").trim().toLowerCase();
  const acct = getAccounts().find(a => a.email === email);
  if (!acct || acct.pass !== obfuscate(password || "")) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }
  setSessionEmail(email);
  return { ok: true };
}

function logOut() {
  setSessionEmail(null);
}

function updateProfile({ name, email }) {
  const sessionEmail = getSessionEmail();
  if (!sessionEmail) return { ok: false, error: "No has iniciado sesión." };

  name = (name || "").trim();
  email = (email || "").trim().toLowerCase();
  if (!name) return { ok: false, error: "Escribe tu nombre." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Correo electrónico inválido." };

  const accounts = getAccounts();
  const acct = accounts.find(a => a.email === sessionEmail);
  if (!acct) return { ok: false, error: "No se encontró la cuenta." };
  if (email !== sessionEmail && accounts.some(a => a.email === email)) {
    return { ok: false, error: "Ese correo ya está en uso." };
  }

  acct.name = name;
  acct.email = email;
  saveAccounts(accounts);
  setSessionEmail(email); // updates session key + fires account:change
  return { ok: true };
}

function initials(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "?";
}

/* ----------------------------- modal UI -------------------------------- */

let accountView = "login"; // "login" | "signup" | "profile"

function accountModalHTML() {
  return `
  <div id="account-overlay" class="fixed inset-0 bg-black/60 z-50 opacity-0 pointer-events-none transition"></div>
  <div id="account-modal" class="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 opacity-0 pointer-events-none transition overflow-y-auto">
    <div class="relative w-full max-w-md bg-surface border border-white/10 rounded-2xl p-6 sm:p-8 glow-border">
      <button id="account-close" class="absolute w-9 h-9 flex items-center justify-center rounded-full text-muted hover:text-white hover:bg-white/5" style="top:1rem;right:1rem" aria-label="Cerrar">
        ${icon("close", "w-5 h-5")}
      </button>
      <div id="account-body"></div>
    </div>
  </div>`;
}

const fieldCls =
  "w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-blue";
const primaryBtnCls =
  "w-full py-3 rounded-full bg-blue hover:bg-blue-dark text-white font-semibold transition glow-ring";

function accountBodyHTML() {
  const user = currentUser();

  if (user && accountView === "profile") {
    const since = new Date(user.created).toLocaleDateString("es", { year: "numeric", month: "long" });
    return `
      <div class="flex items-center gap-4 mb-6">
        <div class="w-14 h-14 rounded-full bg-blue/15 border border-blue/30 flex items-center justify-center font-display text-lg font-bold text-blue-glow">${initials(user.name)}</div>
        <div class="min-w-0">
          <p class="font-display text-xl font-bold text-white truncate">${user.name}</p>
          <p class="text-xs text-muted truncate">Cliente desde ${since}</p>
        </div>
      </div>
      <form id="profile-form" class="space-y-3">
        <div>
          <label class="text-xs font-semibold text-muted">Nombre completo</label>
          <input name="name" type="text" value="${user.name.replace(/"/g, "&quot;")}" class="${fieldCls}" />
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Correo electrónico</label>
          <input name="email" type="email" value="${user.email.replace(/"/g, "&quot;")}" class="${fieldCls}" />
        </div>
        <p id="account-msg" class="hidden text-xs"></p>
        <button type="submit" class="${primaryBtnCls}">Guardar cambios</button>
      </form>
      <button id="logout-btn" class="w-full mt-3 py-3 rounded-full border border-white/15 hover:border-white/30 hover:bg-white/5 text-white text-sm font-semibold transition">Cerrar sesión</button>
    `;
  }

  if (accountView === "signup") {
    return `
      <h2 class="font-display text-2xl font-bold text-white tracking-wide mb-1">CREA TU CUENTA</h2>
      <p class="text-sm text-muted mb-6">Guarda tus datos y agiliza el checkout.</p>
      <form id="signup-form" class="space-y-3">
        <div>
          <label class="text-xs font-semibold text-muted">Nombre completo</label>
          <input name="name" type="text" autocomplete="name" placeholder="Juan Pellot" class="${fieldCls}" />
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Correo electrónico</label>
          <input name="email" type="email" autocomplete="email" placeholder="tu@correo.com" class="${fieldCls}" />
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Contraseña</label>
          <input name="password" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" class="${fieldCls}" />
        </div>
        <p id="account-msg" class="hidden text-xs"></p>
        <button type="submit" class="${primaryBtnCls}">Crear cuenta</button>
      </form>
      <p class="text-sm text-muted mt-5 text-center">¿Ya tienes cuenta?
        <button id="to-login" class="text-blue-glow hover:text-white font-semibold transition">Inicia sesión</button>
      </p>
    `;
  }

  // login (default)
  return `
    <h2 class="font-display text-2xl font-bold text-white tracking-wide mb-1">INICIAR SESIÓN</h2>
    <p class="text-sm text-muted mb-6">Accede a tu cuenta de Los Pellot LED.</p>
    <form id="login-form" class="space-y-3">
      <div>
        <label class="text-xs font-semibold text-muted">Correo electrónico</label>
        <input name="email" type="email" autocomplete="email" placeholder="tu@correo.com" class="${fieldCls}" />
      </div>
      <div>
        <label class="text-xs font-semibold text-muted">Contraseña</label>
        <input name="password" type="password" autocomplete="current-password" placeholder="Tu contraseña" class="${fieldCls}" />
      </div>
      <p id="account-msg" class="hidden text-xs"></p>
      <button type="submit" class="${primaryBtnCls}">Entrar</button>
    </form>
    <p class="text-sm text-muted mt-5 text-center">¿Nuevo aquí?
      <button id="to-signup" class="text-blue-glow hover:text-white font-semibold transition">Crea una cuenta</button>
    </p>
  `;
}

function showAccountMsg(text, kind = "error") {
  const el = document.getElementById("account-msg");
  if (!el) return;
  el.textContent = text;
  el.className = "text-xs " + (kind === "error" ? "text-amber" : "text-blue-glow");
  el.classList.remove("hidden");
}

function renderAccountBody() {
  const body = document.getElementById("account-body");
  if (!body) return;
  body.innerHTML = accountBodyHTML();

  document.getElementById("to-signup")?.addEventListener("click", () => { accountView = "signup"; renderAccountBody(); });
  document.getElementById("to-login")?.addEventListener("click", () => { accountView = "login"; renderAccountBody(); });
  document.getElementById("logout-btn")?.addEventListener("click", () => { logOut(); closeAccountModal(); });

  // NB: read fields via form.elements — form.name resolves to the form's own
  // name property, not the <input name="name">.
  document.getElementById("signup-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const el = e.target.elements;
    const res = signUp({ name: el.name.value, email: el.email.value, password: el.password.value });
    if (!res.ok) return showAccountMsg(res.error);
    accountView = "profile";
    renderAccountBody();
    showAccountMsg("¡Cuenta creada! Ya iniciaste sesión.", "ok");
  });

  document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const el = e.target.elements;
    const res = logIn({ email: el.email.value, password: el.password.value });
    if (!res.ok) return showAccountMsg(res.error);
    accountView = "profile";
    renderAccountBody();
  });

  document.getElementById("profile-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const el = e.target.elements;
    const res = updateProfile({ name: el.name.value, email: el.email.value });
    showAccountMsg(res.ok ? "Cambios guardados." : res.error, res.ok ? "ok" : "error");
  });
}

function openAccountModal(view) {
  accountView = view || (currentUser() ? "profile" : "login");
  renderAccountBody();
  document.getElementById("account-overlay")?.classList.remove("opacity-0", "pointer-events-none");
  document.getElementById("account-modal")?.classList.remove("opacity-0", "pointer-events-none");
  document.body.classList.add("overflow-hidden");
}

function closeAccountModal() {
  document.getElementById("account-overlay")?.classList.add("opacity-0", "pointer-events-none");
  document.getElementById("account-modal")?.classList.add("opacity-0", "pointer-events-none");
  document.body.classList.remove("overflow-hidden");
}

/* Updates the header/mobile account buttons to reflect logged-in state. */
function refreshAccountChrome() {
  const user = currentUser();

  const btn = document.getElementById("account-toggle");
  if (btn) {
    btn.innerHTML = user
      ? `<span class="w-7 h-7 rounded-full bg-blue/20 border border-blue/40 flex items-center justify-center text-[11px] font-bold text-blue-glow">${initials(user.name)}</span>`
      : icon("user", "w-5 h-5");
    btn.setAttribute("title", user ? user.name : "Mi Cuenta");
    btn.setAttribute("aria-label", user ? "Mi cuenta" : "Cuenta");
  }

  const mobileBtn = document.getElementById("account-toggle-mobile");
  if (mobileBtn) mobileBtn.textContent = user ? `MI CUENTA (${user.name.split(/\s+/)[0].toUpperCase()})` : "INICIAR SESIÓN";
}

function wireAccountEvents() {
  document.getElementById("account-toggle")?.addEventListener("click", () => openAccountModal());
  document.getElementById("account-toggle-mobile")?.addEventListener("click", () => openAccountModal());
  document.getElementById("account-close")?.addEventListener("click", closeAccountModal);
  document.getElementById("account-overlay")?.addEventListener("click", closeAccountModal);
  const modal = document.getElementById("account-modal");
  modal?.addEventListener("click", (e) => { if (e.target === modal) closeAccountModal(); });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAccountModal();
});

window.addEventListener("account:change", () => {
  refreshAccountChrome();
  renderAccountBody();
});

/* Mounts the modal root once. mountChrome() calls this after injecting the
   header so the account buttons exist to wire up. */
function mountAccountUI() {
  let root = document.getElementById("account-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "account-root";
    document.body.appendChild(root);
  }
  if (!root.dataset.mounted) {
    root.innerHTML = accountModalHTML();
    root.dataset.mounted = "1";
  }
  wireAccountEvents();
  refreshAccountChrome();
}
