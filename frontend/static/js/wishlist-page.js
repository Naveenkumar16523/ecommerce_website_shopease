/**
 * wishlist-page.js — Full wishlist grid for wishlist.html (standalone + Jinja/base).
 * Guests: localStorage key "wishlist" (same as Wishlist module). Logged-in: /api/wishlist (paginated).
 */
(function () {
  const WL_KEY = 'wishlist';
  const esc =
    typeof escapeHtml === 'function'
      ? escapeHtml
      : function (s) {
          if (s == null) return '';
          return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        };

  function wlGet() {
    try {
      return JSON.parse(localStorage.getItem(WL_KEY) || '[]').map(Number).filter(Boolean);
    } catch {
      return [];
    }
  }

  function wlSet(ids) {
    localStorage.setItem(WL_KEY, JSON.stringify([...new Set(ids.map(Number))]));
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: wlGet() }));
    if (window.Wishlist?._updateBadge) window.Wishlist._updateBadge();
  }

  function normalizeWishlistPayload(body) {
    if (!body) return [];
    if (Array.isArray(body)) return body;
    if (Array.isArray(body.data)) return body.data;
    return [];
  }

  async function fetchProductsForIds(ids) {
    if (!ids.length) return [];
    const res = await apiRequest('/products?per_page=100&page=1');
    if (!res.ok) return [];
    const body = await res.json();
    const pool = normalizeWishlistPayload(body);
    const want = new Set(ids.map(Number));
    const found = pool.filter((p) => want.has(Number(p.id)));
    const missing = [...want].filter((id) => !found.some((p) => Number(p.id) === id));
    for (const id of missing) {
      const one = await apiRequest('/products/' + id);
      if (one.ok) {
        const p = await one.json();
        if (p && p.id) found.push(p);
      }
    }
    return ids.map((id) => found.find((p) => Number(p.id) === Number(id))).filter(Boolean);
  }

  function renderCards(grid, products, guest) {
    const hint = guest
      ? `<div class="col-span-full mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
           You're browsing as a guest. Items are saved on this device only.
           <a href="login.html?redirect=wishlist.html" class="font-bold underline ml-1">Log in</a> to sync with your account.
         </div>`
      : '';

    if (!products.length) {
      grid.innerHTML =
        hint +
        `<div class="col-span-full bg-white p-12 rounded-3xl text-center shadow-sm">
          <p class="text-gray-500 mb-6">Your wishlist is empty.</p>
          <a href="index.html" class="bg-black text-white px-8 py-3 rounded-full font-bold inline-block">Explore Products</a>
        </div>`;
      return;
    }

    grid.innerHTML =
      hint +
      products
        .map((p) => {
          const safeName = esc(String(p.name || ''));
          const safePrice = esc(String(p.price != null ? p.price : ''));
          const safeImg = esc(String(p.image || ''));
          const pid = Number(p.id);
          return `
            <div class="product-card group bg-white p-4 rounded-3xl shadow-sm border border-transparent hover:border-black transition-all duration-300 relative">
              <button type="button" onclick="window.__wlRemove('${pid}', this)" 
                class="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/90 shadow-md hover:text-red-500 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              <div onclick="window.location.href='product-detail.html?name=${encodeURIComponent(p.name || '')}'" class="cursor-pointer">
                <div class="bg-[#F0EEED] rounded-2xl overflow-hidden aspect-square flex items-center justify-center mb-4">
                  <img src="${safeImg}" alt="" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h3 class="font-bold text-sm mb-1 truncate uppercase">${safeName}</h3>
                <p class="font-black text-xl">$${safePrice}</p>
              </div>
              <button type="button" onclick="addToCartFromWishlist(this)" 
                data-id="${pid}" data-name="${safeName}" data-price="${safePrice}" data-img="${safeImg}"
                class="w-full mt-4 bg-black text-white py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition">
                Move to Cart
              </button>
            </div>`;
        })
        .join('');
  }

  async function loadGuestWishlist(grid) {
    const ids = wlGet();
    if (!ids.length) {
      grid.innerHTML = `
        <div class="col-span-full bg-white p-12 rounded-3xl text-center shadow-sm">
          <p class="text-gray-500 mb-6">Your wishlist is empty. Save items with the heart icon while you shop.</p>
          <a href="login.html?redirect=wishlist.html" class="inline-block font-bold text-black underline mb-4">Log in to sync across devices</a>
          <div><a href="index.html" class="bg-black text-white px-8 py-3 rounded-full font-bold inline-block">Explore Products</a></div>
        </div>`;
      return;
    }
    const products = await fetchProductsForIds(ids);
    renderCards(grid, products, true);
  }

  async function loadFullWishlist() {
    const grid = document.getElementById('wishlistGrid');
    if (!grid) return;

    try {
      const response = await apiRequest('/wishlist');

      if (response.status === 401) {
        await loadGuestWishlist(grid);
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch');

      const body = await response.json();
      const products = normalizeWishlistPayload(body);
      renderCards(grid, products, false);
    } catch (err) {
      console.error(err);
      grid.innerHTML =
        '<p class="col-span-full text-center text-red-500">Error loading wishlist. Please try again.</p>';
    }
  }

  window.__wlRemove = async function (productId, btn) {
    const res = await apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ product_id: Number(productId) }),
    });

    if (res.ok) {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const user = JSON.parse(raw);
          if (user.wishlist) {
            user.wishlist = user.wishlist.filter((id) => Number(id) !== Number(productId));
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch {}
      }
      wlSet(wlGet().filter((id) => Number(id) !== Number(productId)));
    } else if (res.status === 401) {
      wlSet(wlGet().filter((id) => Number(id) !== Number(productId)));
    } else {
      return;
    }

    const card = btn.closest('.product-card');
    if (card) {
      card.classList.add('scale-0', 'opacity-0');
      setTimeout(() => {
        card.remove();
        const g = document.getElementById('wishlistGrid');
        if (g && !g.querySelector('.product-card')) loadFullWishlist();
      }, 300);
    }
  };

  window.addToCartFromWishlist = function (btn) {
    if (typeof addToCart === 'function') addToCart(btn);
    else if (window.Cart?.add) {
      const id = parseInt(btn.dataset.id, 10);
      window.Cart.add(
        { id, name: btn.dataset.name, price: parseFloat(btn.dataset.price), image: btn.dataset.img },
        1
      );
    }
    if (typeof showToast === 'function') showToast('Added to cart!', 'success');
    else alert('Added to cart!');
  };

  function boot() {
    const run = () => {
      if (document.getElementById('wishlistGrid')) loadFullWishlist();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
  }

  boot();
})();
