/**
 * Application Entry Point
 */

(async function boot() {
    console.log('Shopease Booting...');

    // 1. Initialize Cart Badge
    window.Cart._updateBadge();

    // 2. Migrate Cart if necessary
    await window.Cart.migrate();

    // 3. Load Translations
    const currentLang = localStorage.getItem('currentLang') || 'en';
    let translations = {};
    try {
        const res = await fetch(`/static/lang/${currentLang}.json`);
        if (res.ok) translations = await res.json();
    } catch (e) {
        console.warn('Could not load translations');
    }

    // 4. Translate Page
    const translatePage = () => {
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.dataset.t;
            if (translations[key]) el.textContent = translations[key];
        });
    };
    translatePage();

    // 5. Update Auth UI
    await window.Auth.updateUI();

    // 6. Update Wishlist Badge
    window.Wishlist._updateBadge();

    // 7. Load Dynamic Products (if containers exist)
    await window.Products.loadPage();

    // 8. Initialize Search
    const initSearch = () => {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('keyup', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.product-card');
            cards.forEach(card => {
                const name = card.dataset.name.toLowerCase();
                card.style.display = name.includes(term) ? 'block' : 'none';
            });
        });
    };
    initSearch();

    // 9. Initialize Scroll Top
    const initScrollTop = () => {
        let btn = document.getElementById('scrollTopBtn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'scrollTopBtn';
            btn.innerHTML = '↑';
            btn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #1f2937;
                color: white;
                border: none;
                cursor: pointer;
                display: none;
                z-index: 1000;
                font-size: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            `;
            document.body.appendChild(btn);
            
            btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });
    };
    initScrollTop();

    console.log('Shopease Booted Successfully.');
})();
