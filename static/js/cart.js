/**
 * cart.js — Cart state machine for SHOP EASE.
 * All cart operations go through this module.
 * localStorage is the source of truth (backed by backend on order placement).
 */

const Cart = {
  _key: 'cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key)) || []; }
    catch { return []; }
  },

  _save(cart) {
    localStorage.setItem(this._key, JSON.stringify(cart));
    document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    this._updateBadge();
  },

  add(product, qty = 1) {
    const cart = this.get();
    const pid = parseInt(product.id || product.product_id);
    if (!pid) { console.error('[Cart] Invalid product ID'); return; }

    const existing = cart.find(i => i.product_id === pid);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 99);
    } else {
      cart.push({
        product_id: pid,
        name:  product.name,
        price: parseFloat(product.price),
        image: product.image,
        qty,
      });
    }
    this._save(cart);
    window.toast?.success(`${product.name} added to cart!`);
  },

  remove(productId) {
    const cart = this.get().filter(i => i.product_id !== parseInt(productId));
    this._save(cart);
  },

  updateQty(productId, qty) {
    const cart = this.get();
    const item = cart.find(i => i.product_id === parseInt(productId));
    if (item) {
      item.qty = Math.max(1, Math.min(parseInt(qty), 99));
      this._save(cart);
    }
  },

  clear() {
    this._save([]);
  },

  get totalItems() {
    return this.get().reduce((s, i) => s + i.qty, 0);
  },

  get subtotal() {
    return this.get().reduce((s, i) => s + i.price * i.qty, 0);
  },

  _updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
      const count = this.totalItems;
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  },

  /**
   * Migrate old name-keyed cart entries to ID-keyed entries.
   * Called once on boot.
   */
  async migrate() {
    const cart = this.get();
    if (!cart.length || cart[0].product_id) return;
    try {
      const data = await window.API.getProducts();
      const products = data.data || data;
      const migrated = cart.map(item => {
        const p = products.find(p => p.name === item.name);
        return p ? { product_id: p.id, name: p.name, price: p.price, image: p.image, qty: item.qty || 1 } : null;
      }).filter(Boolean);
      this._save(migrated);
    } catch (e) {
      console.warn('[Cart] Migration failed:', e);
    }
  },
};

window.Cart = Cart;

// ─── Backward-compat shims ────────────────────────────────────────────────────

window.cartStore = {
  get: ()              => Cart.get(),
  save: (c)            => Cart._save(c),
  add: (p, q)          => Cart.add(p, q),
  remove: (id)         => Cart.remove(id),
  updateQty: (id, q)   => Cart.updateQty(id, q),
  clear: ()            => Cart.clear(),
  get totalItems()     { return Cart.totalItems; },
  get subtotal()       { return Cart.subtotal; },
};

window.updateCartBadge = () => Cart._updateBadge();

window.addToCart = function(button) {
  const id    = parseInt(button.dataset.id);
  const name  = button.dataset.name;
  const price = parseFloat(button.dataset.price);
  const image = button.dataset.img || button.dataset.image;
  if (!id || isNaN(id)) { console.error('[Cart] addToCart: invalid ID'); return; }

  const card   = button.closest('.product-card') || document.body;
  const qtyEl  = card.querySelector('.qty-val') || document.getElementById('detail-qty');
  const qty    = qtyEl ? parseInt(qtyEl.textContent) || 1 : 1;

  Cart.add({ id, name, price, image }, qty);

  const orig = button.textContent;
  button.textContent = 'Added ✓';
  button.classList.add('bg-green-600');
  button.classList.remove('bg-black');
  button.disabled = true;
  setTimeout(() => {
    button.textContent = orig;
    button.classList.remove('bg-green-600');
    button.classList.add('bg-black');
    button.disabled = false;
  }, 1500);
};

window.updateQty = function(btn, change) {
  const qtyEl = btn.parentElement.querySelector('.qty-val');
  if (!qtyEl) return;
  let qty = parseInt(qtyEl.textContent) + change;
  if (qty < 1) qty = 1;
  qtyEl.textContent = qty;
};
