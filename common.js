const PRODUCTION_API_BASE = "https://ecommerce-website-shopease.onrender.com/api";
const API_BASE = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" 
  ? "http://127.0.0.1:5000/api" 
  : PRODUCTION_API_BASE;

// Global helper for API calls with token
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      console.warn("Unauthorized! Clearing token.");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we are on a page that REQUIRES auth
      const protectedPages = ['profile.html', 'wishlist.html', 'orders.html', 'checkout.html'];
      if (protectedPages.some(page => window.location.pathname.includes(page))) {
        window.location.href = 'login.html';
      }
    }
    return res;
  } catch (err) {
    console.error(`API Request failed for ${endpoint}:`, err);
    throw err;
  }
}

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cartBadge");
  if (badge) badge.innerText = total;
}

function addToCart(button) {
  const card = button.closest('.product-card') || button;
  const name = button.getAttribute('data-name') || (card.querySelector('.font-semibold') ? card.querySelector('.font-semibold').innerText : '');
  const price = parseFloat(button.getAttribute('data-price')) || (card.querySelector('.font-bold') ? parseFloat(card.querySelector('.font-bold').innerText.replace('$', '')) : 0);
  const image = button.getAttribute('data-img') || (card.querySelector('img') ? card.querySelector('img').src : '');
  const qtyEl = card.querySelector('.qty-val') || document.getElementById('detail-qty');
  const qty = qtyEl ? parseInt(qtyEl.innerText) : 0;
  if (qty <= 0) {
    alert("Please select a quantity greater than 0.");
    return;
  }
  if (!name) return;

  const product = { name, price, image, qty };

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existing = cart.find(item => item.name === name);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push(product);
  }

  localStorage.setItem('cart', JSON.stringify(cart));

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

  updateCartBadge();
}

function updateQty(btn, change) {
  const qtyEl = btn.parentElement.querySelector('.qty-val');
  if (!qtyEl) return;
  let qty = parseInt(qtyEl.innerText);
  qty += change;
  if (qty < 0) qty = 0;
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

async function loadDynamicProducts() {
  const fallbackProducts = [
    { name: 'T-shirt with Tape Details', price: 120, category: 'casual', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', rating: 4.5 },
    { name: 'Skinny Fit Jeans', price: 240, category: 'casual', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', rating: 3.5 }
  ];

  let products = [];
  try {
    const res = await apiRequest('/products');
    if (!res.ok) throw new Error('API failed');
    products = await res.json();
  } catch (err) {
    console.error('Backend connection failed:', err);
    products = fallbackProducts;
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

function renderProductsInto(products, container) {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const wishlist = user.wishlist || [];

  container.innerHTML = products.map(p => {
    const isWishlisted = wishlist.includes(p._id);
    return `
      <div class="product-card group cursor-pointer relative" onclick="viewProduct(this)"
           data-id="${p._id}" data-name="${p.name}" data-price="${p.price}" data-category="${p.category}"
           data-img="${p.image}">
        
        <!-- Wishlist Heart -->
        <button onclick="event.stopPropagation(); toggleWishlist(this)" 
          data-id="${p._id}"
          class="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 backdrop-blur shadow-sm hover:bg-white transition-all">
          <svg class="w-4 h-4 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-black'}" 
               viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
        </button>

        <div class="bg-[#F0EEED] rounded-2xl overflow-hidden aspect-square flex items-center justify-center mb-3">
          <img src="${p.image}" class="product-img object-cover w-full h-full" alt="${p.name}"/>
        </div>
        <div class="font-semibold text-sm">${p.name}</div>
        <div class="flex items-center gap-1 my-1">
          <div class="flex star text-xs">★★★★☆</div>
          <span class="text-xs text-gray-400">4.5/5</span>
        </div>
        <div class="font-bold mb-3">$${p.price}</div>
        <div class="flex items-center justify-between gap-2" onclick="event.stopPropagation()">
          <div class="flex items-center border rounded-full bg-gray-50">
            <button onclick="updateQty(this, -1)" class="px-3 py-1 hover:text-red-500 transition">−</button>
            <span class="px-2 text-xs font-medium qty-val">0</span>
            <button onclick="updateQty(this, 1)" class="px-3 py-1 hover:text-green-500 transition">+</button>
          </div>
          <button onclick="addToCart(this)" data-name="${p.name}" data-price="${p.price}" data-img="${p.image}"
            class="flex-1 bg-black text-white text-xs py-2 rounded-full hover:bg-gray-800 transition">
            Add to Cart
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleWishlist(btn) {
  const productId = btn.dataset.id;
  const token = localStorage.getItem('token');
  
  if (!token) {
    alert("Please login to use the Wishlist.");
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      body: JSON.stringify({ product_id: productId })
    });

    const data = await response.json();
    if (response.ok) {
      const svg = btn.querySelector('svg');
      if (data.action === 'added') {
        svg.classList.add('fill-red-500', 'stroke-red-500');
        svg.classList.remove('fill-none', 'stroke-black');
      } else {
        svg.classList.remove('fill-red-500', 'stroke-red-500');
        svg.classList.add('fill-none', 'stroke-black');
      }
      
      // Update local storage user object
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user.wishlist) user.wishlist = [];
      if (data.action === 'added') user.wishlist.push(productId);
      else user.wishlist = user.wishlist.filter(id => id !== productId);
      localStorage.setItem('user', JSON.stringify(user));
      
    } else {
      alert(data.message);
    }
  } catch (err) {
    console.error(err);
  }
}

// Authentication Helpers
async function getAuthHeader() {
  const token = localStorage.getItem('token');
  return token ? { 'x-access-token': token } : {};
}

async function checkAuth() {
  try {
    const res = await apiRequest('/me');
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
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
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  let subtotal = 0;
  cart.forEach(item => subtotal += (item.price * item.qty));
  const discount = Math.round(subtotal * 0.2);
  const total = subtotal > 0 ? subtotal - discount + 15 : 0;

  const orderData = {
    items: cart,
    total: total,
    shipping: {
      name: name,
      address: extraDetails.address || 'No Address',
      phone: extraDetails.phone || 'No Phone',
      method: extraDetails.paymentMethod || 'Not Selected'
    }
  };

  try {
    const response = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const data = await response.json();
      // Show success message more reliably
      const btn = document.querySelector('button[onclick="submitOrder()"]');
      if (btn) {
        btn.innerHTML = '✅ Order Placed!';
        btn.classList.remove('bg-black');
        btn.classList.add('bg-green-600');
      }
      
      alert('Order placed successfully! Your Order ID is: ' + (data.order_id || 'Confirmed'));
      
      localStorage.removeItem('cart');
      
      // Small delay to allow user to see success state
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      alert('Failed to place order: ' + (data.message || 'Unknown Error'));
    }
  } catch (err) {
    console.error("Checkout Error:", err);
    alert('Checkout failed. Please check your internet connection and try again.');
  }
}

function viewProduct(element) {
  const name = element.getAttribute('data-name');
  if (name) window.location.href = `product-detail.html?name=${encodeURIComponent(name)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  updateAuthUI();
});
