/**
 * wishlist.js — Wishlist state management for SHOP EASE.
 * Optimistic UI updates backed by backend sync.
 */

const Wishlist = {
  _key: 'wishlist',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key)) || []; }
    catch { return []; }
  },

  has(productId) {
    return this.get().includes(parseInt(productId));
  },

  _save(ids) {
    localStorage.setItem(this._key, JSON.stringify(ids.map(Number)));
    document.dispatchEvent(new CustomEvent('wishlist:updated', { detail: ids }));
    this._updateBadge();
  },

  _updateBadge() {
    const badge = document.getElementById('wishlistBadge');
    if (badge) badge.textContent = this.get().length;
  },

  /**
   * Toggle a product in/out of wishlist.
   * Optimistically updates UI, then syncs with backend.
   */
  async toggle(productId, btn) {
    const pid = parseInt(productId, 10);
    const user = window.Auth?.getUser();
    const current = this.get();
    const isAdded = current.includes(pid);

    if (!user) {
      const next = isAdded ? current.filter((id) => id !== pid) : [...current, pid];
      this._save(next);
      this._updateButtonState(btn, !isAdded);
      window.toast?.success(isAdded ? 'Removed from wishlist' : 'Saved to wishlist (this device)');
      return;
    }

    // Optimistic update (logged in)
    const next = isAdded ? current.filter(id => id !== pid) : [...current, pid];
    this._save(next);
    this._updateButtonState(btn, !isAdded);

    try {
      const data = await window.API.toggleWishlist(pid);
      // Reconcile with server response
      const serverAdded = data.action === 'added';
      const final = serverAdded
        ? [...new Set([...this.get(), pid])]
        : this.get().filter(id => id !== pid);
      this._save(final);
      this._updateButtonState(btn, serverAdded);
      window.toast?.success(data.message || (serverAdded ? 'Added to wishlist' : 'Removed from wishlist'));
    } catch {
      // Rollback on error
      this._save(current);
      this._updateButtonState(btn, isAdded);
      window.toast?.error('Could not update wishlist. Please try again.');
    }
  },

  _updateButtonState(btn, isAdded) {
    if (!btn) return;
    const svg = btn.querySelector('svg');
    if (!svg) return;
    if (isAdded) {
      svg.classList.add('fill-red-500', 'stroke-red-500');
      svg.classList.remove('fill-none', 'stroke-black', 'stroke-gray-400');
    } else {
      svg.classList.remove('fill-red-500', 'stroke-red-500');
      svg.classList.add('fill-none', 'stroke-black');
    }
  },

  /**
   * Sync wishlist from backend (call after login).
   */
  async syncFromServer() {
    try {
      const user = await window.API.getMe();
      if (user?.wishlist_ids) this._save(user.wishlist_ids);
    } catch {}
  },
};

window.Wishlist = Wishlist;

// Backward-compat shim
window.toggleWishlist = async function(btn) {
  const id = btn?.dataset?.id;
  if (!id || id === 'undefined') { console.error('[Wishlist] Invalid ID'); return; }
  await Wishlist.toggle(id, btn);
};
