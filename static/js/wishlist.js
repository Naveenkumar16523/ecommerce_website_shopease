/**
 * Wishlist Management
 */

window.Wishlist = {
    _guestGet() {
        return JSON.parse(localStorage.getItem('wishlist')) || [];
    },

    _guestSet(ids) {
        localStorage.setItem('wishlist', JSON.stringify([...new Set(ids)]));
    },

    async toggle(productId, btn) {
        productId = parseInt(productId);
        const user = window.Auth.getUser();

        if (!user) {
            // Guest mode
            let ids = this._guestGet();
            if (ids.includes(productId)) {
                ids = ids.filter(id => id !== productId);
                window.toast.info('Removed from wishlist');
            } else {
                ids.push(productId);
                window.toast.success('Added to wishlist');
            }
            this._guestSet(ids);
            this._updateButtonUI(btn, ids.includes(productId));
        } else {
            // Logged in mode
            const res = await window.API.toggleWishlist(productId);
            if (res) {
                // Update local user data if returned
                if (res.wishlist_ids) {
                    user.wishlist_ids = res.wishlist_ids;
                    localStorage.setItem('user', JSON.stringify(user));
                    sessionStorage.setItem('auth_user', JSON.stringify(user));
                }
                const inWishlist = res.action === 'added' || (res.wishlist_ids && res.wishlist_ids.includes(productId));
                this._updateButtonUI(btn, inWishlist);
                window.toast.success(res.message || (inWishlist ? 'Added to wishlist' : 'Removed from wishlist'));
            }
        }
        this._updateBadge();
    },

    getIds() {
        const guestIds = this._guestGet();
        const user = window.Auth.getUser();
        const userIds = user?.wishlist_ids || [];
        return new Set([...guestIds, ...userIds].map(id => parseInt(id)));
    },

    _updateBadge() {
        const badge = document.getElementById('wishlistBadge');
        if (badge) {
            const count = this.getIds().size;
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
            badge.style.display = count === 0 ? 'none' : 'flex';
        }
    },

    _updateButtonUI(btn, isActive) {
        if (!btn) return;
        const icon = btn.querySelector('svg');
        if (icon) {
            icon.style.fill = isActive ? '#ef4444' : 'none';
            icon.style.stroke = isActive ? '#ef4444' : 'currentColor';
        }
    }
};

// Global Helper
window.toggleWishlist = (btn) => {
    const card = btn.closest('[data-id]');
    if (card) {
        window.Wishlist.toggle(card.dataset.id, btn);
    }
};
