/**
 * auth.js — Authentication state management for SHOP EASE.
 * Handles login, logout, session persistence, and auth-aware UI updates.
 */

const Auth = {
  /**
   * Returns cached user or null. Does NOT make a network call.
   */
  getUser() {
    const session = sessionStorage.getItem('auth_user');
    if (session) return JSON.parse(session);
    const local = localStorage.getItem('user');
    if (local) return JSON.parse(local);
    return null;
  },

  /**
   * Checks auth with backend (only if there's a local hint).
   * Refreshes session cache.
   */
  async checkAuth() {
    const cached = sessionStorage.getItem('auth_user');
    if (cached) return JSON.parse(cached);

    // Only hit /api/me if user was previously logged in
    if (!localStorage.getItem('user')) return null;

    try {
      const user = await window.API.getMe();
      if (user) {
        sessionStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      }
      this.clearSession();
      return null;
    } catch {
      return null;
    }
  },

  clearSession() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_user');
    sessionStorage.removeItem('products_cache');
    sessionStorage.removeItem('products_cache_time');
  },

  async login(email, password) {
    const res = await window.API.login(email, password);
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return { ok: true, user: data.user };
    }
    return { ok: false, message: data.message || 'Login failed' };
  },

  async signup(name, email, password) {
    const res = await window.API.signup(name, email, password);
    const data = await res.json();
    return { ok: res.ok, message: data.message };
  },

  async logout() {
    try { await window.API.logout(); } catch {}
    this.clearSession();
    window.location.href = 'index.html';
  },

  /**
   * Updates the nav UI based on auth state.
   * Swaps profile/login links, hides banner for logged-in users.
   */
  async updateUI() {
    const user = await this.checkAuth();

    // Top banner — hide for logged-in users
    const banner = document.querySelector('.se-banner, [data-se="banner"]')
      || document.querySelector('.bg-black.text-white.text-center.text-xs.py-2');
    if (banner && user) banner.classList.add('hidden');

    // Account link — show name if logged in
    const accountLinks = document.querySelectorAll('[data-se="account-link"]');
    accountLinks.forEach(link => {
      if (user) {
        link.textContent = user.name?.split(' ')[0] || 'Account';
        link.href = 'profile.html';
      } else {
        link.textContent = 'Login';
        link.href = 'login.html';
      }
    });

    // Logout buttons
    document.querySelectorAll('[data-se="logout-btn"]').forEach(btn => {
      btn.style.display = user ? 'flex' : 'none';
      btn.onclick = () => this.logout();
    });

    return user;
  },

  /**
   * Guard: redirects to login if user is not authenticated.
   * Use at the top of protected page scripts.
   */
  async requireAuth(redirectTo) {
    const user = await this.checkAuth();
    if (!user) {
      const page = redirectTo || window.location.pathname.split('/').pop();
      window.location.href = `login.html?redirect=${page}`;
      return null;
    }
    return user;
  },

  isProtectedPage() {
    const path = window.location.pathname.split('/').pop();
    return (window.SE_CONFIG?.PROTECTED_PAGES ?? []).includes(path);
  },
};

window.Auth = Auth;

// Backward-compat shims
window.checkAuth    = () => Auth.checkAuth();
window.logout       = () => Auth.logout();
window.updateAuthUI = () => Auth.updateUI();
