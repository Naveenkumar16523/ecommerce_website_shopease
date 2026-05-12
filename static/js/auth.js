/**
 * Authentication Management
 */

window.Auth = {
    getUser() {
        const sessionUser = sessionStorage.getItem('auth_user');
        if (sessionUser) return JSON.parse(sessionUser);
        
        const localUser = localStorage.getItem('user');
        if (localUser) return JSON.parse(localUser);
        
        return null;
    },

    async checkAuth() {
        // Return session cached user if exists
        const sessionUser = sessionStorage.getItem('auth_user');
        if (sessionUser) return JSON.parse(sessionUser);

        // If localStorage hint exists, verify with server
        if (localStorage.getItem('user')) {
            try {
                const user = await window.API.getMe();
                if (user) {
                    sessionStorage.setItem('auth_user', JSON.stringify(user));
                    return user;
                }
            } catch (e) {
                console.error('Auth verification failed', e);
            }
        }
        return null;
    },

    clearSession() {
        localStorage.removeItem('user');
        sessionStorage.removeItem('auth_user');
        sessionStorage.removeItem('products_cache'); // Custom cache prefix if used
        if (window.API_CACHE) window.API_CACHE.clearCache();
    },

    async login(email, password) {
        const data = await window.API.login(email, password);
        if (data && data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            sessionStorage.setItem('auth_user', JSON.stringify(data.user));
            return { ok: true, user: data.user };
        }
        return { ok: false, message: data?.message || 'Login failed' };
    },

    async signup(name, email, password) {
        const data = await window.API.signup(name, email, password);
        if (data && data.status === 'success') {
            return { ok: true, message: data.message };
        }
        return { ok: false, message: data?.message || 'Signup failed' };
    },

    async logout() {
        try {
            await window.API.logout();
        } catch (e) {}
        this.clearSession();
        window.location.href = 'index.html';
    },

    async updateUI() {
        const user = await this.checkAuth();
        const accountLinks = document.querySelectorAll('[data-se="account-link"]');
        const logoutBtns = document.querySelectorAll('[data-se="logout-btn"]');

        accountLinks.forEach(link => {
            if (user) {
                const firstName = user.name ? user.name.split(' ')[0] : 'User';
                link.textContent = firstName;
                link.href = 'profile.html';
            } else {
                link.textContent = 'Login';
                link.href = 'login.html';
            }
        });

        logoutBtns.forEach(btn => {
            btn.classList.toggle('hidden', !user);
            if (user) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            }
        });

        return user;
    },

    requireAuth(redirectTo = 'login.html') {
        const user = this.getUser();
        if (!user) {
            const current = window.location.pathname.split('/').pop();
            window.location.href = `${redirectTo}?redirect=${current}`;
            return false;
        }
        return true;
    }
};

// Backward compatibility
window.checkAuth = () => window.Auth.checkAuth();
window.logout = () => window.Auth.logout();
window.updateAuthUI = () => window.Auth.updateUI();
