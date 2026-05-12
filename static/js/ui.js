/**
 * UI & Notifications
 */

window.toast = {
    _createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
        return container;
    },

    show(msg, type = 'info') {
        const container = this._createContainer();
        const toast = document.createElement('div');
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: white;
            color: #1f2937;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-left: 4px solid ${colors[type]};
            min-width: 250px;
            font-family: sans-serif;
            font-size: 14px;
            animation: slideIn 0.3s ease-out forwards;
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;

        toast.innerHTML = `
            <span>${msg}</span>
            <button style="background:none; border:none; cursor:pointer; color:#9ca3af; margin-left:10px;">&times;</button>
        `;

        container.appendChild(toast);

        const dismiss = () => {
            toast.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => toast.remove(), 300);
        };

        toast.querySelector('button').onclick = dismiss;

        setTimeout(dismiss, window.SE_CONFIG.TOAST_DURATION || 3500);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

// Aliases
window.showToast = (msg, type) => window.toast.show(msg, type);

window.showRateLimitError = (seconds, title = 'Too Many Requests') => {
    const container = document.getElementById('api-error-container');
    if (!container) return;

    const buttons = document.querySelectorAll('button[type="submit"]');
    buttons.forEach(btn => btn.disabled = true);

    let remaining = seconds;
    container.innerHTML = `
        <div style="background: #fee2e2; border: 1px solid #ef4444; color: #b91c1c; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0; font-weight: 600;">${title}</h4>
            <p style="margin: 0;">Please wait <span id="rate-limit-timer">${remaining}</span> seconds before trying again.</p>
        </div>
    `;

    const interval = setInterval(() => {
        remaining--;
        const timerSpan = document.getElementById('rate-limit-timer');
        if (timerSpan) timerSpan.innerText = remaining;

        if (remaining <= 0) {
            clearInterval(interval);
            container.innerHTML = '';
            buttons.forEach(btn => btn.disabled = false);
        }
    }, 1000);
};

// Add basic animations if not present
if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

/**
 * XSS Prevention
 */
window.escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};
