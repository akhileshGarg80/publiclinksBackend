/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 transition-all transform translate-y-4 opacity-0 pointer-events-auto backdrop-blur-md ${
    type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' :
    type === 'error' ? 'bg-rose-950/90 text-rose-200 border-rose-500/40' :
    type === 'warning' ? 'bg-amber-950/90 text-amber-200 border-amber-500/40' :
    'bg-slate-900/90 text-slate-100 border-slate-700'
  }`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span class="flex-1">${message}</span>`;
  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

export default { showToast };
