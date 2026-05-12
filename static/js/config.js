/**
 * config.js — Central configuration for SHOP EASE
 * Single source of truth for environment, feature flags, and constants.
 */

const isLocalhost = ['127.0.0.1', 'localhost'].includes(window.location.hostname);

window.SE_CONFIG = {
  API_BASE: isLocalhost
    ? 'http://127.0.0.1:5000/api'
    : 'https://ecommerce-website-shopease.vercel.app/api',

  VERSION: '2.0.0',

  FEATURES: {
    WISHLIST: true,
    ORDERS: true,
    SEARCH: true,
    MULTI_LANG: true,
  },

  CACHE_TTL: 5 * 60 * 1000, // 5 minutes

  TOAST_DURATION: 3500,

  PROTECTED_PAGES: ['profile.html', 'orders.html', 'checkout.html'],

  CATEGORIES: [
    { slug: 'casual',  label: 'Casual',  href: 'casual-category.html' },
    { slug: 'formal',  label: 'Formal',  href: 'formal-category.html' },
    { slug: 'party',   label: 'Party',   href: 'party-category.html' },
    { slug: 'gym',     label: 'Gym',     href: 'gym-category.html' },
  ],
};

// Backward-compat alias (common.js used window.API_BASE)
window.API_BASE = window.SE_CONFIG.API_BASE;
