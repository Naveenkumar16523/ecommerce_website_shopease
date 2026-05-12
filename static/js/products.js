/**
 * products.js — Product rendering, skeleton loaders, filtering, search.
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
window.escapeHtml = escapeHtml;

function slugify(str) {
  return String(str).toLowerCase().replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim();
}
window.slugify = slugify;

function renderStars(rating = 4.5) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - half);
}

function renderProductsInto(products, container) {
  if (!container) return;

  if (!products || !products.length) {
    window.renderEmptyState(container, {
      icon: '🛍️', title: 'No products found',
      subtitle: 'Try a different category or search term.',
      action: `<a href="index.html" class="px-6 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition">Back to Home</a>`,
    });
    return;
  }

  const wishlist = window.Wishlist?.get() || [];
  container.innerHTML = products.map(p => {
    const pid = p.id || p._id;
    if (!pid) return '';
    const wishlisted = wishlist.includes(Number(pid));
    const name = escapeHtml(p.name);
    const price = escapeHtml(p.price);
    const img = escapeHtml(p.image);
    const rating = parseFloat(p.rating) || 4.5;
    return `
      <article class="product-card group cursor-pointer relative"
               onclick="viewProduct(this)"
               data-id="${pid}" data-name="${name}" data-price="${price}"
               data-category="${escapeHtml(p.category)}" data-img="${img}"
               tabindex="0" aria-label="View ${name}">
        <button onclick="event.stopPropagation();toggleWishlist(this)" data-id="${pid}"
          class="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white hover:scale-110 transition-all duration-200">
          <svg class="w-4 h-4 ${wishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-black'}" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        <div class="bg-[#F0EEED] rounded-2xl overflow-hidden aspect-square mb-3">
          <img src="${img}" loading="lazy" decoding="async" width="400" height="400"
               class="product-img object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
               alt="${name}"
               onerror="this.src='https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400'"/>
        </div>
        <div class="font-semibold text-sm leading-snug mb-1">${name}</div>
        <div class="flex items-center gap-1 mb-1">
          <span class="text-yellow-400 text-xs">${renderStars(rating)}</span>
          <span class="text-xs text-gray-400">${rating}/5</span>
        </div>
        <div class="font-bold text-base mb-3">$${price}</div>
        <div class="flex items-center gap-2" onclick="event.stopPropagation()">
          <div class="flex items-center border border-gray-200 rounded-full bg-gray-50 select-none">
            <button onclick="updateQty(this,-1)" class="w-8 h-8 flex items-center justify-center hover:text-red-500 transition text-lg" aria-label="Decrease">−</button>
            <span class="px-2 text-xs font-medium qty-val">1</span>
            <button onclick="updateQty(this,1)"  class="w-8 h-8 flex items-center justify-center hover:text-green-500 transition text-lg" aria-label="Increase">+</button>
          </div>
          <button onclick="addToCart(this)"
            data-id="${pid}" data-name="${name}" data-price="${price}" data-img="${img}"
            class="flex-1 bg-black text-white text-xs py-2 rounded-full hover:bg-gray-800 active:scale-95 transition-all duration-150 font-medium">
            Add to Cart
          </button>
        </div>
      </article>`;
  }).filter(Boolean).join('');
}
window.renderProductsInto = renderProductsInto;

function viewProduct(element) {
  const id   = element.getAttribute('data-id');
  const name = element.getAttribute('data-name') || 'product';
  if (!id) return;
  window.location.href = `product-detail.html?id=${id}&slug=${slugify(name)}-${id}`;
}
window.viewProduct = viewProduct;

// ─── Dynamic loader ───────────────────────────────────────────────────────────
const FALLBACK = [
  { id:1, name:'T-shirt with Tape Details', price:120, category:'casual', image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', rating:4.5 },
  { id:2, name:'Skinny Fit Jeans',           price:240, category:'casual', image:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', rating:3.5 },
  { id:3, name:'Checkered Shirt',             price:180, category:'formal', image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', rating:4.0 },
  { id:4, name:'Sleeve Striped T-Shirt',      price:130, category:'casual', image:'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400', rating:4.5 },
];

let _loaded = false;

async function loadDynamicProducts() {
  if (_loaded) return;
  _loaded = true;

  const arrivals  = document.getElementById('new-arrivals-container');
  const topSell   = document.getElementById('top-selling-container');
  const catBox    = document.getElementById('category-products-container');

  if (arrivals)  window.renderSkeletons(arrivals, 4);
  if (topSell)   window.renderSkeletons(topSell, 4);
  if (catBox)    window.renderSkeletons(catBox, 6);

  let products = [];
  try {
    const data = await window.API.getProducts();
    products = data.data || data;
  } catch { products = FALLBACK; }

  if (arrivals)  renderProductsInto(products.slice(0, 4), arrivals);
  if (topSell)   renderProductsInto([...products].reverse().slice(0, 4), topSell);
  if (catBox) {
    const cat = (catBox.dataset.category || '').toLowerCase();
    const filtered = cat ? products.filter(p => p.category?.toLowerCase() === cat) : products;
    renderProductsInto(filtered.length ? filtered : products.slice(0, 6), catBox);
  }
}
window.loadDynamicProducts = loadDynamicProducts;

// ─── Search ───────────────────────────────────────────────────────────────────
function initSearch() {
  document.querySelectorAll('input[placeholder*="Search"], [data-se="search"]').forEach(input => {
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = input.value.trim().toLowerCase();
        const containers = [
          document.getElementById('new-arrivals-container'),
          document.getElementById('top-selling-container'),
          document.getElementById('category-products-container'),
        ].filter(Boolean);
        if (!containers.length) return;
        if (!q) { _loaded = false; loadDynamicProducts(); return; }
        try {
          const data = await window.API.getProducts();
          const all = data.data || data;
          const filtered = all.filter(p =>
            p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
          );
          containers.forEach(c => renderProductsInto(filtered, c));
        } catch {}
      }, 350);
    });
  });
}
window.initSearch = initSearch;
