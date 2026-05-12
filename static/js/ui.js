/**
 * ui.js — Reusable UI primitives: toast, skeleton, modal, confirm, empty state.
 * No dependencies on other modules.
 */

// ─── Toast ───────────────────────────────────────────────────────────────────

const toast = {
  _getContainer() {
    let el = document.getElementById('se-toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'se-toast-container';
      el.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
      document.body.appendChild(el);
    }
    return el;
  },

  show(message, type = 'success') {
    const colors = {
      success: 'bg-green-600',
      error:   'bg-red-600',
      warning: 'bg-amber-500',
      info:    'bg-blue-600',
    };

    const icons = {
      success: '✓',
      error:   '✕',
      warning: '⚠',
      info:    'ℹ',
    };

    const container = this._getContainer();
    const el = document.createElement('div');
    el.className = [
      colors[type] || 'bg-gray-800',
      'text-white px-5 py-3 rounded-xl shadow-2xl pointer-events-auto',
      'flex items-center gap-3 min-w-[260px] max-w-sm',
      'transform translate-x-4 opacity-0 transition-all duration-300',
    ].join(' ');

    el.innerHTML = `
      <span class="text-lg leading-none">${icons[type] || '•'}</span>
      <span class="flex-1 text-sm font-medium">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-white/60 hover:text-white text-lg leading-none">&times;</button>
    `;

    container.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.remove('translate-x-4', 'opacity-0');
    });

    const duration = window.SE_CONFIG?.TOAST_DURATION ?? 3500;
    setTimeout(() => {
      el.classList.add('translate-x-4', 'opacity-0');
      setTimeout(() => el.remove(), 350);
    }, duration);
  },

  success(m) { this.show(m, 'success'); },
  error(m)   { this.show(m, 'error');   },
  warning(m) { this.show(m, 'warning'); },
  info(m)    { this.show(m, 'info');    },
};

window.toast = toast;

// Backward-compat shim
window.showToast = (m, type) => toast.show(m, type || 'success');

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function createProductSkeleton(count = 4) {
  return Array.from({ length: count }, () => `
    <div class="animate-pulse">
      <div class="bg-gray-200 rounded-2xl aspect-square mb-3"></div>
      <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div class="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div class="h-5 bg-gray-200 rounded w-1/3"></div>
    </div>
  `).join('');
}

function renderSkeletons(container, count = 4) {
  if (!container) return;
  container.innerHTML = createProductSkeleton(count);
}

window.renderSkeletons = renderSkeletons;

// ─── Empty State ─────────────────────────────────────────────────────────────

function renderEmptyState(container, { icon = '📦', title = 'Nothing here yet', subtitle = '', action = '' } = {}) {
  if (!container) return;
  container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div class="text-6xl mb-4">${icon}</div>
      <h3 class="text-lg font-semibold text-gray-800 mb-1">${title}</h3>
      ${subtitle ? `<p class="text-gray-500 text-sm mb-6">${subtitle}</p>` : ''}
      ${action}
    </div>
  `;
}

window.renderEmptyState = renderEmptyState;

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-95 opacity-0 transition-all duration-200">
        <h3 class="text-lg font-bold mb-2">Are you sure?</h3>
        <p class="text-gray-500 text-sm mb-6">${message}</p>
        <div class="flex gap-3">
          <button id="_cancel" class="flex-1 px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
          <button id="_confirm" class="flex-1 px-4 py-2 rounded-full bg-black text-white text-sm font-semibold hover:bg-gray-800 transition">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const modal = overlay.querySelector('div');
    requestAnimationFrame(() => modal.classList.remove('scale-95', 'opacity-0'));

    const close = (result) => {
      modal.classList.add('scale-95', 'opacity-0');
      setTimeout(() => { overlay.remove(); resolve(result); }, 200);
    };

    overlay.querySelector('#_confirm').onclick = () => close(true);
    overlay.querySelector('#_cancel').onclick  = () => close(false);
  });
}

window.showConfirm = showConfirm;

// ─── Rate-limit error helper ──────────────────────────────────────────────────

function showRateLimitError(seconds, title = 'Rate Limited') {
  const container = document.getElementById('api-error-container');
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  let timeLeft = parseInt(seconds);
  const update = () => {
    const msg = `<div class="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 rounded" role="alert">
      <p class="font-bold">${title}</p>
      <p>Too many attempts. Try again in <span class="font-mono">${timeLeft}</span>s.</p>
    </div>`;
    if (container) { container.innerHTML = msg; container.classList.remove('hidden'); }
  };
  update();
  const timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (container) container.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = false;
    } else update();
  }, 1000);
}

window.showRateLimitError = showRateLimitError;

// ─── UI object (backward compat) ─────────────────────────────────────────────

window.ui = {
  confirm: (message, onConfirm, onCancel) =>
    showConfirm(message).then(r => r ? onConfirm?.() : onCancel?.()),
};
