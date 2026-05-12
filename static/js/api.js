/**
 * api.js — Centralized API handler for SHOP EASE.
 * All fetch calls go through apiRequest(). Handles auth, rate-limits, errors.
 */

const _cache = {};

function getCached(key) {
  const entry = _cache[key];
  if (!entry) return null;
  const ttl = window.SE_CONFIG?.CACHE_TTL ?? 5 * 60 * 1000;
  if (Date.now() - entry.ts > ttl) { delete _cache[key]; return null; }
  return entry.data;
}

function setCache(key, data) {
  _cache[key] = { data, ts: Date.now() };
}

function clearCache(keyPrefix) {
  Object.keys(_cache).filter(k => k.startsWith(keyPrefix)).forEach(k => delete _cache[k]);
}

window.clearApiCache = clearCache;

/**
 * Core API fetch wrapper. Returns the Response object.
 * Callers should check res.ok before calling res.json().
 */
async function apiRequest(endpoint, options = {}) {
  const base = window.SE_CONFIG?.API_BASE ?? window.API_BASE ?? '/api';
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  try {
    const res = await fetch(`${base}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401) {
      const isProtected = (window.SE_CONFIG?.PROTECTED_PAGES ?? [])
        .some(p => window.location.pathname.includes(p));
      localStorage.removeItem('user');
      sessionStorage.removeItem('auth_user');
      if (isProtected) {
        const path = window.location.pathname.split('/').pop();
        window.location.href = `login.html?redirect=${path}`;
      }
    }

    if (res.status === 429 || res.status === 423) {
      const data = await res.clone().json().catch(() => ({}));
      const seconds = data.retry_after || 60;
      window.showRateLimitError?.(seconds, data.error || 'Rate Limited');
    }

    return res;
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err);
    if (err instanceof TypeError) {
      window.toast?.error('Connection error — server may be offline.');
    }
    throw err;
  }
}

window.apiRequest = apiRequest;

// ─── Typed API methods ────────────────────────────────────────────────────────

const API = {
  // Products
  getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const key = `products:${qs}`;
    const cached = getCached(key);
    if (cached) return Promise.resolve(cached);
    return apiRequest(`/products${qs ? '?' + qs : ''}`)
      .then(r => r.json())
      .then(data => { setCache(key, data); return data; });
  },

  getProduct(id) {
    const key = `product:${id}`;
    const cached = getCached(key);
    if (cached) return Promise.resolve(cached);
    return apiRequest(`/products/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCache(key, data); return data; });
  },

  // Auth
  login(email, password) {
    return apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup(name, email, password) {
    return apiRequest('/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  logout() {
    return apiRequest('/logout', { method: 'POST' });
  },

  getMe() {
    return apiRequest('/me').then(r => r.ok ? r.json() : null);
  },

  // Cart / Orders
  placeOrder(orderData) {
    clearCache('products:');
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  getOrders() {
    return apiRequest('/orders').then(r => r.ok ? r.json() : []);
  },

  // Wishlist
  toggleWishlist(productId) {
    return apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }).then(r => r.json());
  },

  // Profile
  updateProfile(data) {
    return apiRequest('/profile/update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

window.API = API;
