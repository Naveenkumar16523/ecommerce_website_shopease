/**
 * Product Loading & Rendering
 */

window.Products = {
    async load(filters = {}) {
        try {
            const res = await window.apiRequest('/products');
            if (!res.ok) throw new Error('API failed');
            const data = await res.json();
            let products = data.data || data;

            if (filters.category) {
                products = products.filter(p => p.category === filters.category);
            }

            if (products && products.length > 0) {
                sessionStorage.setItem('last_products', JSON.stringify(products));
                return products;
            }
        } catch (e) {
            console.error('Failed to load products:', e);
        }

        // Fallback hardcoded products
        return [
            { id: 1, name: 'Classic White T-Shirt', price: 25.00, category: 'casual', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
            { id: 2, name: 'Black Slim Jeans', price: 55.00, category: 'casual', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' }
        ];
    },

    renderCards(products, container) {
        if (!container) return;

        const user = JSON.parse(localStorage.getItem('user')) || {};
        const wishlistIds = new Set((user.wishlist || []).map(Number));

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
            category: document.getElementById('prod-category'),
            desc: document.getElementById('prod-desc'),
            mainImg: document.getElementById('main-img'),
            rating: document.getElementById('prod-rating'),
            addToCartBtn: document.getElementById('detail-add-to-cart'),
            thumb1: document.getElementById('thumb1')
        };

        if (els.name) {
            els.name.textContent = product.name;
            const breadcrumb = document.getElementById('prod-name-breadcrumb');
            if (breadcrumb) breadcrumb.textContent = product.name;
        }
        if (els.price) {
            const currentPrice = parseFloat(product.price);
            els.price.textContent = `₹${currentPrice.toFixed(2)}`;
            const originalPriceEl = document.querySelector('.price-original');
            if (originalPriceEl) {
                const originalPrice = currentPrice / 0.6;
                originalPriceEl.textContent = `₹${originalPrice.toFixed(2)}`;
            }
        }
        if (els.category) {
            els.category.textContent = product.category;
            const catTag = document.getElementById('prod-category-tag');
            if (catTag) catTag.textContent = product.category;
        }
        if (els.desc) els.desc.textContent = `Experience premium quality with the ${product.name}. Crafted for style and performance, this item represents the pinnacle of our collection.`;
        if (els.mainImg) els.mainImg.src = product.image;
        if (els.thumb1) els.thumb1.src = product.image;
        if (els.rating) els.rating.textContent = `★ ${product.rating || '4.5'}`;

        if (els.addToCartBtn) {
            const setBtnData = (btn) => {
                btn.dataset.id = product.id;
                btn.dataset.name = product.name;
                btn.dataset.price = product.price;
                btn.dataset.img = product.image;
            };

            setBtnData(els.addToCartBtn);

            const stickyBtn = document.getElementById('sticky-add-cart');
            if (stickyBtn) setBtnData(stickyBtn);

            const wishlistBtn = document.querySelector('.btn-wishlist');
            if (wishlistBtn) wishlistBtn.dataset.id = product.id;

            const stickyName = document.querySelector('.sticky-name');
            if (stickyName) stickyName.textContent = product.name;

            const stickyPrice = document.querySelector('.sticky-price');
            if (stickyPrice) stickyPrice.textContent = `₹${parseFloat(product.price).toFixed(2)}`;
        }
    },

    renderRelatedCards(products, container) {
        if (!container) return;
        container.innerHTML = products.map(p => {
            const rating = p.rating || 4.5;
            const price = parseFloat(p.price);
            const originalPrice = price / 0.7;
            const hasDiscount = p.id % 2 === 0;

            return `
                <div class="rel-card">
                    <div class="rel-img-box" onclick="window.location.href='product-detail.html?id=${p.id}'">
                        <img src="${p.image}" alt="${p.name}">
                    </div>
                    <div class="rel-info">
                        <h3 class="rel-name" onclick="window.location.href='product-detail.html?id=${p.id}'">${p.name}</h3>
                        <div class="rel-rating">
                            <span class="rel-stars">★★★★★</span>
                            <span class="rel-score">${rating}/<span>5</span></span>
                        </div>
                        <div class="rel-price-row">
                            <span class="rel-price">₹${price.toFixed(0)}</span>
                            ${hasDiscount ? `
                                <span class="rel-old-price">₹${originalPrice.toFixed(0)}</span>
                                <span class="rel-discount">-30%</span>
                            ` : ''}
                        </div>
                        
                        <div class="rel-controls">
                            <div class="rel-qty">
                                <button onclick="window.updateQty(this, -1)">−</button>
                                <div class="qty-num">1</div>
                                <button onclick="window.updateQty(this, 1)">+</button>
                            </div>
                            <button class="rel-add-btn" 
                                    data-id="${p.id}" 
                                    data-name="${window.escapeHtml(p.name)}" 
                                    data-price="${p.price}" 
                                    data-img="${window.escapeHtml(p.image)}"
                                    onclick="window.addToCart(this)">
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    async loadDetailPage() {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (!productId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const res = await window.apiRequest(`/products/${productId}`);
            if (!res.ok) throw new Error('Product not found');
            const product = await res.json();
            this.renderDetail(product);

            // Also load related products if container exists
            const relatedContainer = document.getElementById('related-products-container');
            if (relatedContainer) {
                const allProducts = await this.load();
                // Filter current product out
                let related = allProducts.filter(p => p.id != productId);

                // Prioritize same category
                const sameCategory = related.filter(p => p.category === product.category);
                const differentCategory = related.filter(p => p.category !== product.category);

                // Combine and take 4
                related = [...sameCategory, ...differentCategory].slice(0, 4);

                this.renderRelatedCards(related, relatedContainer);
            }
        } catch (e) {
            console.error('Failed to load product details:', e);
        }
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
window.loadDetailPage = () => window.Products.loadDetailPage();
