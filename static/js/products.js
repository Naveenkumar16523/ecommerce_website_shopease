/**
 * Product Loading & Rendering
 */

window.Products = {
    async load(filters = {}) {
        try {
            const products = await window.API.getProducts(filters);
            if (products && products.length > 0) {
                sessionStorage.setItem('last_products', JSON.stringify(products));
                return products;
            }
        } catch (e) {
            console.error('Failed to load products:', e);
        }

        // Fallback hardcoded products
        return [
            { id: 1, name: 'Classic White T-Shirt', price: 25.00, category: 'casual', image: '/static/img/product-1.jpg' },
            { id: 2, name: 'Black Slim Jeans', price: 55.00, category: 'casual', image: '/static/img/product-2.jpg' }
        ];
    },

    renderCards(products, container) {
        if (!container) return;
        const wishlistIds = window.Wishlist.getIds();
        
        container.innerHTML = products.map(p => {
            const inWishlist = wishlistIds.has(parseInt(p.id));
            const heartFill = inWishlist ? '#ef4444' : 'none';
            const heartStroke = inWishlist ? '#ef4444' : 'currentColor';

            return `
                <div class="product-card" 
                     data-id="${p.id}" 
                     data-name="${window.escapeHtml(p.name)}" 
                     data-price="${p.price}" 
                     data-category="${window.escapeHtml(p.category)}" 
                     data-img="${window.escapeHtml(p.image)}">
                    
                    <div class="product-img-wrapper">
                        <img src="${window.escapeHtml(p.image)}" 
                             alt="${window.escapeHtml(p.name)}" 
                             loading="lazy" width="400" height="400"
                             onclick="window.viewProduct(this.closest('.product-card'))">
                        <button class="wishlist-btn" onclick="window.toggleWishlist(this)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.84-8.84 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="product-info">
                        <h3 class="product-title" onclick="window.viewProduct(this.closest('.product-card'))">${window.escapeHtml(p.name)}</h3>
                        <p class="product-price">$${parseFloat(p.price).toFixed(2)}</p>
                        
                        <div class="product-actions">
                            <div class="qty-control">
                                <button onclick="window.updateQty(this, -1)">-</button>
                                <input type="text" value="1" class="qty-val" readonly>
                                <button onclick="window.updateQty(this, 1)">+</button>
                            </div>
                            <button class="add-to-cart-btn" onclick="window.addToCart(this)">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderDetail(product) {
        const els = {
            name: document.getElementById('prod-name'),
            price: document.getElementById('prod-price'),
            mainImg: document.getElementById('main-img'),
            thumb1: document.getElementById('thumb1')
        };

        if (els.name) els.name.textContent = product.name;
        if (els.price) els.price.textContent = `$${parseFloat(product.price).toFixed(2)}`;
        if (els.mainImg) els.mainImg.src = product.image;
        if (els.thumb1) els.thumb1.src = product.image;
    },

    async loadPage() {
        const containers = {
            newArrivals: document.getElementById('new-arrivals-container'),
            topSelling: document.getElementById('top-selling-container'),
            category: document.getElementById('category-products-container')
        };

        if (!containers.newArrivals && !containers.topSelling && !containers.category) return;

        const allProducts = await this.load();

        if (containers.newArrivals) {
            this.renderCards(allProducts.slice(0, 4), containers.newArrivals);
        }

        if (containers.topSelling) {
            this.renderCards(allProducts.slice(0, 4), containers.topSelling);
        }

        if (containers.category) {
            const cat = containers.category.dataset.category;
            const filtered = cat ? allProducts.filter(p => p.category === cat) : allProducts;
            this.renderCards(filtered, containers.category);
        }
    }
};

// Global Helpers
window.loadDynamicProducts = () => window.Products.loadPage();
window.renderProductsInto = (products, container) => window.Products.renderCards(products, container);
window.viewProduct = (el) => {
    const id = el.dataset.id;
    if (id) window.location.href = `product-detail.html?id=${id}`;
};
