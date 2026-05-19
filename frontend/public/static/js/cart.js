/**
 * Shopping Cart Management
 */

window.Cart = {
    get() {
        try {
            return JSON.parse(localStorage.getItem('cart')) || [];
        } catch (e) {
            return [];
        }
    },

    add(product, qty = 1) {
        const cart = this.get();
        const productId = parseInt(product.id || product.product_id);
        const existing = cart.find(item => parseInt(item.product_id) === productId);

        if (existing) {
            existing.qty += qty;
        } else {
            cart.push({
                product_id: productId,
                name: product.name,
                price: parseFloat(product.price),
                image: product.image || product.img,
                qty: qty
            });
        }

        this._save(cart);
        window.toast.success(`${product.name} added to cart!`);
    },

    remove(productId) {
        const cart = this.get().filter(item => parseInt(item.product_id) !== parseInt(productId));
        this._save(cart);
    },

    updateQty(productId, qty) {
        const cart = this.get();
        const item = cart.find(item => parseInt(item.product_id) === parseInt(productId));
        if (item) {
            item.qty = Math.max(1, Math.min(99, qty));
            this._save(cart);
        }
    },

    clear() {
        this._save([]);
    },

    get totalItems() {
        return this.get().reduce((sum, item) => sum + item.qty, 0);
    },

    get subtotal() {
        return this.get().reduce((sum, item) => sum + (item.price * item.qty), 0);
    },

    _save(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
        this._updateBadge();
    },

    _updateBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = this.totalItems;
            badge.textContent = count;
            badge.classList.toggle('hidden', count === 0);
            badge.style.display = count === 0 ? 'none' : 'flex'; // Ensure visibility
        }
    },

    async migrate() {
        const cart = this.get();
        if (cart.length > 0 && !cart[0].product_id) {
            console.log('Migrating legacy cart...');
            try {
                const products = await window.API.getProducts();
                if (products) {
                    const migrated = cart.map(item => {
                        const match = products.find(p => p.name === item.name);
                        return match ? {
                            product_id: match.id,
                            name: match.name,
                            price: match.price,
                            image: match.image,
                            qty: item.qty
                        } : null;
                    }).filter(Boolean);
                    this._save(migrated);
                }
            } catch (e) {
                console.error('Cart migration failed', e);
            }
        }
    }
};

// Global Helpers & Backward Compatibility
window.cartStore = window.Cart;

window.addToCart = (btn) => {
    const card = btn.closest('[data-id]');
    if (!card) return;
    
    const product = {
        id: card.dataset.id,
        name: card.dataset.name,
        price: card.dataset.price,
        image: card.dataset.img
    };
    window.Cart.add(product);
};

window.updateQty = (btn, change) => {
    const container = btn.closest('[data-id]');
    const input = container.querySelector('.qty-val');
    const productId = container.dataset.id;
    
    let newQty = parseInt(input.value || 1) + change;
    newQty = Math.max(1, Math.min(99, newQty));
    input.value = newQty;
    
    window.Cart.updateQty(productId, newQty);
};

window.updateCartBadge = () => window.Cart._updateBadge();
