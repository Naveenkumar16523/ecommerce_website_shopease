/**
 * Shopease Configuration
 */

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

window.SE_CONFIG = {
    API_BASE: isLocalhost 
        ? 'http://127.0.0.1:5000/api' 
        : '/api',
    PROTECTED_PAGES: ['profile.html', 'orders.html', 'checkout.html'],
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    TOAST_DURATION: 3500,
    CATEGORIES: [
        { slug: 'casual', label: 'Casual', href: 'category.html?category=casual' },
        { slug: 'formal', label: 'Formal', href: 'category.html?category=formal' },
        { slug: 'party', label: 'Party', href: 'category.html?category=party' },
        { slug: 'gym', label: 'Gym', href: 'category.html?category=gym' }
    ]
};

// Backward compatibility alias
window.API_BASE = window.SE_CONFIG.API_BASE;
