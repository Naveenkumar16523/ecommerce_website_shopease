/**
 * app.js — Boot file for SHOP EASE.
 * Loads on every page. Initialises all modules in the correct order.
 * Load order in HTML: config.js → ui.js → api.js → auth.js → cart.js → wishlist.js → products.js → app.js
 */

(async function boot() {
  // 1. Cart badge
  window.Cart?._updateBadge();

  // 2. Migrate legacy cart data (name-keyed → ID-keyed)
  await window.Cart?.migrate?.();

  // 3. Multi-language support
  const lang = localStorage.getItem('lang') || 'en';
  await loadLanguage(lang);
  translatePage();

  // 4. Auth UI (shows user name, hides login link etc.)
  await window.Auth?.updateUI();

  // 5. Wishlist badge
  window.Wishlist?._updateBadge();

  // 6. Load products on pages that have product containers
  const hasProducts = document.getElementById('new-arrivals-container')
    || document.getElementById('top-selling-container')
    || document.getElementById('category-products-container');
  if (hasProducts) await loadDynamicProducts();

  // 7. Wire up search inputs
  initSearch();

  // 8. Scroll-to-top button
  initScrollTop();
})();

// ─── Multi-language support ───────────────────────────────────────────────────
let currentLang = localStorage.getItem('lang') || 'en';
const _translations = {};

async function loadLanguage(lang) {
  if (_translations[lang]) return _translations[lang];
  try {
    const res = await fetch(`/static/translations/${lang}.json`);
    if (!res.ok) throw new Error();
    _translations[lang] = await res.json();
    return _translations[lang];
  } catch {
    if (lang !== 'en') return loadLanguage('en');
    return {};
  }
}

function translatePage() {
  const dict = _translations[currentLang];
  if (!dict) return;
  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (!dict[key]) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = dict[key];
    else el.textContent = dict[key];
  });
}

async function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  await loadLanguage(lang);
  translatePage();
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

window.loadLanguage  = loadLanguage;
window.translatePage = translatePage;
window.setLanguage   = setLanguage;

// ─── Nav mobile helpers ───────────────────────────────────────────────────────
function toggleMobileMenu() {
  const sidebar = document.getElementById('mobileSidebar');
  if (!sidebar) return;
  const isHidden = sidebar.classList.contains('-translate-x-full');
  sidebar.classList.toggle('-translate-x-full', !isHidden);
  sidebar.classList.toggle('translate-x-0',  isHidden);
  document.body.style.overflow = isHidden ? 'hidden' : '';
}

function toggleMobileSearch() {
  const bar = document.getElementById('mobileSearchBar');
  if (bar) bar.classList.toggle('hidden');
}

window.toggleMobileMenu   = toggleMobileMenu;
window.toggleMobileSearch = toggleMobileSearch;

// ─── Scroll-to-top ────────────────────────────────────────────────────────────
function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scroll-top-btn';
  btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
  </svg>`;
  btn.className = [
    'fixed bottom-6 right-6 z-50 w-11 h-11',
    'bg-black text-white rounded-full shadow-lg',
    'flex items-center justify-center',
    'opacity-0 translate-y-4 pointer-events-none',
    'transition-all duration-300 hover:bg-gray-800',
  ].join(' ');
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    const show = window.scrollY > 300;
    btn.classList.toggle('opacity-0',       !show);
    btn.classList.toggle('translate-y-4',   !show);
    btn.classList.toggle('pointer-events-none', !show);
  }, { passive: true });
}

// ─── Backward-compat shims used by legacy page scripts ────────────────────────
window.updateQty = function(btn, change) {
  const qtyEl = btn.parentElement.querySelector('.qty-val');
  if (!qtyEl) return;
  const qty = Math.max(1, parseInt(qtyEl.textContent) + change);
  qtyEl.textContent = qty;
};

window.migrateLegacyCart = () => window.Cart?.migrate?.();
