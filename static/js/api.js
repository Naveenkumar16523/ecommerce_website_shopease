/**
 * API Client & Methods
 */

const _cache = new Map();

const getCached = (key) => {
    const cached = _cache.get(key);
    if (cached && (Date.now() - cached.time < window.SE_CONFIG.CACHE_TTL)) {
        return cached.data;
    }
    return null;
};

const setCache = (key, data) => {
    _cache.set(key, { data, time: Date.now() });
};

const clearCache = (prefix) => {
    if (!prefix) {
        _cache.clear();
        return;
    }
    for (const key of _cache.keys()) {
        if (key.startsWith(prefix)) _cache.delete(key);
    }
};

async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${window.SE_CONFIG.API_BASE}${endpoint}`;
    
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);

        if (response.status === 401) {
            localStorage.removeItem('user');
            sessionStorage.removeItem('auth_user');
            const currentPage = window.location.pathname.split('/').pop();
            if (window.SE_CONFIG.PROTECTED_PAGES.includes(currentPage)) {
                window.location.href = 'login.html';
            }
            return null;
        }

        if (response.status === 429 || response.status === 423) {
            const data = await response.json();
            window.showRateLimitError(data.retry_after || 60, data.message);
            return null;
        }

        return response;
    } catch (error) {
        console.error('API Request Failed:', error);
        window.toast.error('Network error. Please try again.');
        throw error;
    }
}

window.apiRequest = apiRequest;

window.API = {
    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        const cacheKey = `products_${query}`;
        const cached = getCached(cacheKey);
        if (cached) return cached;

        const res = await apiRequest(`/products?${query}`);
        if (!res) return null;
        const data = await res.json();
        setCache(cacheKey, data);
        return data;
    },

    async getProduct(id) {
        const res = await apiRequest(`/products/${id}`);
        if (!res) return null;
        return res.json();
    },

    async login(email, password) {
        const res = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (!res) return null;
        return res.json();
    },

    async signup(name, email, password) {
        const res = await apiRequest('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        if (!res) return null;
        return res.json();
    },

    async logout() {
        await apiRequest('/auth/logout', { method: 'POST' });
    },

    async getMe() {
        const res = await apiRequest('/auth/me');
        if (!res || res.status !== 200) return null;
        return res.json();
    },

    async placeOrder(orderData) {
        const res = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        if (!res) return null;
        clearCache('products'); // Invalidate products cache on order
        return res.json();
    },

    async getOrders() {
        const res = await apiRequest('/orders');
        if (!res) return null;
        return res.json();
    },

    async toggleWishlist(productId) {
        const res = await apiRequest(`/wishlist/toggle/${productId}`, { method: 'POST' });
        if (!res) return null;
        return res.json();
    },

    async updateProfile(data) {
        const res = await apiRequest('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        if (!res) return null;
        return res.json();
    }
};

// Export cache helpers for debugging or internal use
window.API_CACHE = { getCached, setCache, clearCache };
