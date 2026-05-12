var API_BASE = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" 
  ? "http://127.0.0.1:5000/api" 
  : "https://ecommerce-website-shopease.vercel.app/api";

// --- Cart Store (ID-Keyed Operations) ---
const cartStore = {
  get() {
    return JSON.parse(localStorage.getItem('cart')) || [];
  },
  save(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    updateCartBadge();
  },
  add(product, qty = 1) {
    let cart = this.get();
    const productId = parseInt(product.id || product.product_id);
    const existing = cart.find(item => item.product_id === productId);
    
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        product_id: productId,
        name: product.name,
        price: parseFloat(product.price),
        image: product.image,
        qty: qty
      });
    }
    this.save(cart);
    showToast(`${product.name} added to cart!`);
  },
  remove(productId) {
    let cart = this.get().filter(item => item.product_id !== parseInt(productId));
    this.save(cart);
  },
  updateQty(productId, qty) {
    let cart = this.get();
    const item = cart.find(item => item.product_id === parseInt(productId));
    if (item) {
      item.qty = Math.max(1, parseInt(qty));
      this.save(cart);
    }
  },
  clear() {
    this.save([]);
  },
  get totalItems() {
    return this.get().reduce((sum, item) => sum + item.qty, 0);
  },
  get subtotal() {
    return this.get().reduce((sum, item) => sum + (item.price * item.qty), 0);
  }
};

// --- Multi-Language Support ---
let currentLang = localStorage.getItem('lang') || 'en';
let translations = {};

async function loadLanguage(lang) {
  if (translations[lang]) return translations[lang];
  try {
    const res = await fetch(`/static/translations/${lang}.json`);
    if (!res.ok) throw new Error(`Could not load ${lang} translation`);
    const data = await res.json();
    translations[lang] = data;
    return data;
  } catch (err) {
    console.error("Language Load Error:", err);
    if (lang !== 'en') return loadLanguage('en');
    return {};
  }
}

function translatePage() {
  const dict = translations[currentLang];
  if (!dict) return;

  document.querySelectorAll('[data-t]').forEach(el => {
    const key = el.getAttribute('data-t');
    if (dict[key]) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = dict[key];
      } else {
        el.innerText = dict[key];
      }
    }
  });
}

async function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  await loadLanguage(lang);
  translatePage();
  // Optional: Trigger event for parts that need manual refresh
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}
function showRateLimitError(seconds, title) {
  // Try to find an error container, or alert if none exists
  const container = document.getElementById('api-error-container');
  const submitBtn = document.querySelector('button[type="submit"]');
  
  if (submitBtn) submitBtn.disabled = true;

  let timeLeft = parseInt(seconds);
  const updateMessage = () => {
    const msg = `${title}: Too many attempts. Please try again in ${timeLeft}s.`;
    if (container) {
      container.innerHTML = `<div class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4" role="alert">
        <p class="font-bold">${title}</p>
        <p>Too many attempts. Try again in <span class="font-mono">${timeLeft}</span> seconds.</p>
      </div>`;
      container.classList.remove('hidden');
    } else {
      console.warn(msg);
    }
  };

  updateMessage();
  const timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (container) container.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = false;
    } else {
      updateMessage();
    }
  }, 1000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global helper for API calls (Cookies automatically included)
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { 
      ...options, 
      headers,
      credentials: 'include' 
    });
    
    if (res.status === 401) {
      // Only warn on protected page requests, not background auth checks
      // Wishlist is guest-friendly (localStorage); do not force redirect here — wishlist page handles 401.
      const isProtectedPage = ['profile.html', 'orders.html', 'checkout.html']
        .some(page => window.location.pathname.includes(page));
      
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_user');
      
      if (isProtectedPage) {
        console.warn("Unauthorized! Redirecting to login.");
        const currentPath = window.location.pathname.split('/').pop();
        window.location.href = `login.html?redirect=${currentPath}`;
      }
    }
    
    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      if (data.error === "CORS Forbidden") {
        toast.error("Security Error: This site is not authorized to access the API.");
      }
    }
    
    if (res.status === 429 || res.status === 423) {
      const data = await res.json().catch(() => ({}));
      const seconds = data.retry_after || 60;
      showRateLimitError(seconds, data.error || "Rate Limited");
    }

    return res;
  } catch (err) {
    console.error(`API Request failed for ${endpoint}:`, err);
    if (err instanceof TypeError) {
      toast.error("Connection Error: Could not connect to the API server.");
    }
    throw err;
  }
}

function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) badge.innerText = cartStore.totalItems;
}

function addToCart(button) {
  const id = parseInt(button.getAttribute('data-id'));
  const name = button.getAttribute('data-name');
  const price = parseFloat(button.getAttribute('data-price'));
  const image = button.getAttribute('data-img');
  
  if (!id || isNaN(id)) {
    console.error("Add to Cart failed: Missing or invalid Product ID");
    return;
  }

  const card = button.closest('.product-card') || document.body;
  const qtyEl = card.querySelector('.qty-val') || document.getElementById('detail-qty');
  const qty = qtyEl ? parseInt(qtyEl.innerText) : 1;

  cartStore.add({ id, name, price, image }, qty);

  const originalText = button.innerText;
  button.innerText = "Added ✓";
  button.classList.add('bg-green-600');
  button.classList.remove('bg-black');
  button.disabled = true;

  setTimeout(() => {
    button.innerText = originalText;
    button.classList.remove('bg-green-600');
    button.classList.add('bg-black');
    button.disabled = false;
  }, 1500);
}

function updateQty(btn, change) {
  const qtyEl = btn.parentElement.querySelector('.qty-val');
  if (!qtyEl) return;
  let qty = parseInt(qtyEl.innerText);
  qty += change;
  if (qty < 1) qty = 1;
  qtyEl.innerText = qty;
}

function toggleShopMenu() {
  const menu = document.getElementById("shopMenu");
  if (menu) menu.classList.toggle("hidden");
}

function toggleMobileMenu() {
  const sidebar = document.getElementById("mobileSidebar");
  if (sidebar) {
    if (sidebar.classList.contains("-translate-x-full")) {
      sidebar.classList.remove("-translate-x-full");
      sidebar.classList.add("translate-x-0");
    } else {
      sidebar.classList.remove("translate-x-0");
      sidebar.classList.add("-translate-x-full");
    }
  }
}

function toggleMobileSearch() {
  const bar = document.getElementById("mobileSearchBar");
  if (bar) bar.classList.toggle("hidden");
}

// Load products from Python Backend
document.addEventListener('DOMContentLoaded', () => loadDynamicProducts());

var _productsLoaded = false;
async function loadDynamicProducts() {
  if (_productsLoaded) return;
  _productsLoaded = true;

  const fallbackProducts = [
    { id: 1, name: 'T-shirt with Tape Details', price: 120, category: 'casual', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', rating: 4.5 },
    { id: 2, name: 'Skinny Fit Jeans', price: 240, category: 'casual', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', rating: 3.5 }
  ];

  let products = [];
  const cached = sessionStorage.getItem('products_cache');
  const cacheTime = sessionStorage.getItem('products_cache_time');
  const isValid = cacheTime && (Date.now() - parseInt(cacheTime)) < 5 * 60 * 1000; // 5 min

  if (cached && isValid) {
    products = JSON.parse(cached);
  } else {
    try {
      const res = await apiRequest('/products');
      if (!res.ok) throw new Error('API failed');
      const resData = await res.json();
      products = resData.data || resData;
      sessionStorage.setItem('products_cache', JSON.stringify(products));
      sessionStorage.setItem('products_cache_time', Date.now().toString());
    } catch (err) {
      console.error('Backend connection failed:', err);
      products = fallbackProducts;
    }
  }

  // Render containers
  const arrivalsContainer = document.getElementById('new-arrivals-container');
  if (arrivalsContainer) renderProductsInto(products.slice(0, 4), arrivalsContainer);

  const topSellingContainer = document.getElementById('top-selling-container');
  if (topSellingContainer) renderProductsInto(products.slice(Math.max(0, products.length - 4)), topSellingContainer);

  const categoryContainer = document.getElementById('category-products-container');
  if (categoryContainer) {
    const currentCategory = categoryContainer.dataset.category.toLowerCase().trim();
    const categoryProducts = products.filter(p => (p.category || "").toLowerCase() === currentCategory);
    renderProductsInto(categoryProducts.length > 0 ? categoryProducts : products.slice(0, 6), categoryContainer);
  }

  // Single Product Detail
  const urlParams = new URLSearchParams(window.location.search);
  const productName = urlParams.get('name');
  if (productName && document.getElementById('prod-name')) {
    const product = products.find(p => p.name === productName);
    if (product) renderProductDetail(product);
  }
}

function renderProductDetail(p) {
  document.getElementById('prod-name').innerText = p.name;
  document.getElementById('prod-price').innerText = `$${p.price}`;
  document.getElementById('main-img').src = p.image;
  document.getElementById('thumb1').src = p.image;
}

function getWishlistIdsForUi() {
  let fromUser = [];
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && Array.isArray(user.wishlist)) fromUser = user.wishlist.map(Number);
  } catch {}
  let fromGuest = [];
  try {
    fromGuest = JSON.parse(localStorage.getItem('wishlist') || '[]').map(Number).filter(Boolean);
  } catch {}
  return [...new Set([...fromUser, ...fromGuest])];
}

function renderProductsInto(products, container) {
  const wishlist = getWishlistIdsForUi();

  container.innerHTML = products.map(p => {
    const pid = p.id || p._id || null;
    if (!pid) return '';
    
    const isWishlisted = wishlist.includes(Number(pid));
    const safeName = escapeHtml(p.name);
    const safePrice = escapeHtml(p.price);
    const safeImg = escapeHtml(p.image);
    
    return `
      <div class="product-card group cursor-pointer relative" onclick="viewProduct(this)"
           data-id="${pid}" data-name="${safeName}" data-price="${safePrice}" data-category="${escapeHtml(p.category)}"
           data-img="${safeImg}">
        
        <!-- Wishlist Heart -->
        <button onclick="event.stopPropagation(); toggleWishlist(this)" 
          data-id="${pid}"
          class="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white transition-all">
          <svg class="w-4 h-4 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-black'}" 
               viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </button>

        <div class="bg-[#F0EEED] rounded-2xl overflow-hidden aspect-square flex items-center justify-center mb-3">
          <img src="${safeImg}" loading="lazy" decoding="async" width="400" height="400"
               class="product-img object-cover w-full h-full" alt="${safeName}"/>
        </div>
        <div class="font-semibold text-sm">${safeName}</div>
        <div class="flex items-center gap-1 my-1">
          <div class="flex star text-xs">★★★★☆</div>
          <span class="text-xs text-gray-400">4.5/5</span>
        </div>
        <div class="font-bold mb-3">$${safePrice}</div>
        <div class="flex items-center justify-between gap-2" onclick="event.stopPropagation()">
          <div class="flex items-center border rounded-full bg-gray-50">
            <button onclick="updateQty(this, -1)" class="px-3 py-1 hover:text-red-500 transition">−</button>
            <span class="px-2 text-xs font-medium qty-val">1</span>
            <button onclick="updateQty(this, 1)" class="px-3 py-1 hover:text-green-500 transition">+</button>
          </div>
          <button onclick="addToCart(this)" 
            data-id="${pid}" data-name="${safeName}" data-price="${safePrice}" data-img="${safeImg}"
            class="flex-1 bg-black text-white text-xs py-2 rounded-full hover:bg-gray-800 transition">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  }).filter(Boolean).join('');
}

async function toggleWishlist(btn) {
  const productId = btn.dataset.id;
  if (!productId || productId === 'undefined' || productId === 'null') {
    console.error("Wishlist toggle blocked: invalid product ID:", productId);
    return;
  }
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const pidNum = Number(productId);
  const WL_KEY = 'wishlist';
  function wlGuestGet() {
    try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]').map(Number).filter(Boolean); }
    catch { return []; }
  }
  function wlGuestSet(ids) {
    localStorage.setItem(WL_KEY, JSON.stringify([...new Set(ids)]));
  }

  if (!user) {
    const ids = wlGuestGet();
    const had = ids.includes(pidNum);
    const next = had ? ids.filter((id) => id !== pidNum) : [...ids, pidNum];
    wlGuestSet(next);
    const svg = btn.querySelector('svg');
    if (svg) {
      if (!had) {
        svg.classList.add('fill-red-500', 'stroke-red-500');
        svg.classList.remove('fill-none', 'stroke-black');
      } else {
        svg.classList.add('fill-none', 'stroke-black');
        svg.classList.remove('fill-red-500', 'stroke-red-500');
      }
    }
    return;
  }

  try {
    const response = await apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId })
    });

    const data = await response.json();
    if (response.ok) {
      // Sync local user object for immediate UI updates
      let user = JSON.parse(localStorage.getItem('user')) || {};
      if (!user.wishlist) user.wishlist = [];

      if (data.action === 'added') {
        if (!user.wishlist.includes(pidNum)) user.wishlist.push(pidNum);
      } else {
        user.wishlist = user.wishlist.filter(id => Number(id) !== pidNum);
      }
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('wishlist', JSON.stringify(user.wishlist.map(Number)));

      const svg = btn.querySelector('svg');
      if (data.action === 'added') {
        svg.classList.add('fill-red-500', 'stroke-red-500');
        svg.classList.remove('fill-none', 'stroke-black');
      } else {
        svg.classList.add('fill-none', 'stroke-black');
        svg.classList.remove('fill-red-500', 'stroke-red-500');
      }
      
      showToast(data.message);
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
}

// Authentication Helpers
async function getAuthHeader() {
  return {}; // Headers no longer needed for Auth, handled by Cookies
}

async function checkAuth() {
  // Rely on backend /me check since we can't read the HttpOnly cookie in JS
  const cached = sessionStorage.getItem('auth_user');
  if (cached) return JSON.parse(cached);

  // Only call /api/me if we have a hint that the user was previously logged in
  const hasUserHint = localStorage.getItem('user');
  if (!hasUserHint) return null;

  try {
    const res = await apiRequest('/me');
    if (!res.ok) {
      sessionStorage.removeItem('auth_user');
      localStorage.removeItem('user');
      return null;
    }
    const user = await res.json();
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

async function logout() {
  try {
    await apiRequest('/logout', { method: 'POST' });
  } catch (err) {
    console.error("Logout API call failed", err);
  } finally {
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('products_cache');
    sessionStorage.removeItem('products_cache_time');
    window.location.href = 'index.html';
  }
}

async function updateAuthUI() {
  const user = await checkAuth();
  const banner = document.querySelector('.bg-black.text-white.text-center.text-xs.py-2');
  if (banner && user) banner.classList.add('hidden');
  
  const profileLinks = document.querySelectorAll('a[href="profile.html"], a[href="login.html"]');
  profileLinks.forEach(link => {
    if (user) {
      link.href = 'profile.html';
    } else {
      link.href = 'login.html';
    }
  });
}

async function placeOrder(name, email, extraDetails = {}) {
  const cart = cartStore.get();
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  // Final validation before submission
  for (const item of cart) {
    if (!item.product_id || isNaN(item.product_id)) {
      showToast(`Invalid product ID for ${item.name}. Please remove and re-add.`, 'error');
      return;
    }
  }

  const orderData = {
    items: cart,
    total: cartStore.subtotal + 15 - Math.round(cartStore.subtotal * 0.2),
    shipping: {
      name: name,
      address: [
        extraDetails.address,
        extraDetails.city,
        extraDetails.pincode
      ].filter(Boolean).join(', ') || 'No Address',
      phone: extraDetails.phone || 'No Phone',
      method: extraDetails.paymentMethod || 'Not Selected'
    }
  };

  try {
    const res = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (res.ok) {
      cartStore.clear();
      showToast('Order placed successfully!', 'success');
      return data;
    } else {
      showToast(data.message || 'Failed to place order', 'error');
    }
  } catch (err) {
    showToast('Connection error. Please try again.', 'error');
    console.error('placeOrder error:', err);
  }
}

// --- UI Utility: Toasts, Confirmations, Prompts ---
const toast = {
  show(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    const colors = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      warning: 'bg-amber-500',
      info: 'bg-blue-600'
    };
    
    el.className = `${colors[type] || 'bg-black'} text-white px-6 py-3 rounded-lg shadow-2xl transition-all transform translate-x-10 opacity-0 pointer-events-auto flex items-center gap-3 min-w-[250px]`;
    el.innerHTML = `
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-white/70 hover:text-white">&times;</button>
    `;
    
    container.appendChild(el);
    setTimeout(() => el.classList.remove('translate-x-10', 'opacity-0'), 10);
    
    setTimeout(() => {
      el.classList.add('translate-x-10', 'opacity-0');
      setTimeout(() => el.remove(), 500);
    }, 3500);
  },
  success(m) { this.show(m, 'success'); },
  error(m) { this.show(m, 'error'); },
  warning(m) { this.show(m, 'warning'); },
  info(m) { this.show(m, 'info'); }
};

const ui = {
  confirm(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-95 opacity-0 transition-all duration-200">
        <h3 class="text-lg font-bold mb-2">Are you sure?</h3>
        <p class="text-gray-500 text-sm mb-6">${message}</p>
        <div class="flex gap-3">
          <button id="ui-cancel" class="flex-1 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
          <button id="ui-confirm" class="flex-1 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const modal = overlay.querySelector('div');
    setTimeout(() => modal.classList.remove('scale-95', 'opacity-0'), 10);

    const close = () => {
      modal.classList.add('scale-95', 'opacity-0');
      setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#ui-confirm').onclick = () => { close(); if (onConfirm) onConfirm(); };
    overlay.querySelector('#ui-cancel').onclick = () => { close(); if (onCancel) onCancel(); };
  },
  prompt(message, defaultValue, onSubmit) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-95 opacity-0 transition-all duration-200">
        <h3 class="text-lg font-bold mb-2">${message}</h3>
        <input type="text" id="ui-input" value="${defaultValue || ''}" class="w-full border rounded-lg px-4 py-2 mb-6 focus:ring-2 focus:ring-black outline-none" />
        <div class="flex gap-3">
          <button id="ui-cancel" class="flex-1 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
          <button id="ui-submit" class="flex-1 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition">Submit</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const modal = overlay.querySelector('div');
    const input = overlay.querySelector('#ui-input');
    setTimeout(() => {
      modal.classList.remove('scale-95', 'opacity-0');
      input.focus();
    }, 10);

    const close = () => {
      modal.classList.add('scale-95', 'opacity-0');
      setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#ui-submit').onclick = () => { const val = input.value; close(); if (onSubmit) onSubmit(val); };
    overlay.querySelector('#ui-cancel').onclick = () => { close(); };
  }
};

// Compatibility shim for existing code
function showToast(m, type) { toast.show(m, type); }

function viewProduct(element) {
  const id = element.getAttribute('data-id');
  if (id) window.location.href = `product-detail.html?id=${id}`;
}


async function migrateLegacyCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length > 0 && !cart[0].product_id) {
    console.log("Migrating legacy cart (name-keyed) to ID-keyed...");
    try {
      const res = await apiRequest('/products');
      if (!res.ok) return;
      const resData = await res.json();
      const products = resData.data || resData;
      
      const migrated = cart.map(item => {
        const p = products.find(prod => prod.name === item.name);
        if (p) {
          return {
            product_id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            qty: item.qty
          };
        }
        return null;
      }).filter(Boolean);
      
      localStorage.setItem('cart', JSON.stringify(migrated));
      console.log("Cart migration complete.");
    } catch (err) {
      console.error("Cart migration failed:", err);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await migrateLegacyCart();
  await loadLanguage(currentLang);
  translatePage();
  updateCartBadge();
  updateAuthUI();
});
