/**
 * Frontend DNS & Backend URL Resolver
 * 
 * Default Backend URL: http://localhost:5000
 * Frontend URL: http://localhost:3000
 */

// Default backend API URL
const DEFAULT_BACKEND_PORT = 5000;
const STORAGE_KEY = 'bp_preferred_backend_url';

/**
 * Resolves the active Backend API base URL
 * 1. Checks URL query param `?api=...`
 * 2. Checks localStorage `bp_preferred_backend_url`
 * 3. If running on same port as server (3000 or 5000), uses window.location.origin
 * 4. Defaults to http://localhost:5000
 */
export function getBackendUrl() {
  if (typeof window === 'undefined') return `http://localhost:${DEFAULT_BACKEND_PORT}`;

  const urlParams = new URLSearchParams(window.location.search);
  const paramApi = urlParams.get('api');
  if (paramApi) {
    const clean = paramApi.replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEY, clean);
    return clean;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored.trim()) {
    return stored.replace(/\/+$/, '');
  }

  // If in cloud environment or container running behind proxy
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return window.location.origin;
  }

  // If running on local server port 3000 or 5000
  if (window.location.port === '5000' || window.location.port === '3000') {
    return window.location.origin;
  }

  // Default development backend
  return `http://localhost:${DEFAULT_BACKEND_PORT}`;
}

/**
 * Sets and persists a custom Backend URL
 * @param {string} url 
 */
export function setBackendUrl(url) {
  if (!url) return;
  const clean = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEY, clean);
}

/**
 * Detects if a custom subdomain is requested in current page URL
 * Supports: ?subdomain=ram, ?p=ram, #ram, or path /profile/ram
 * @returns {string|null}
 */
export function detectSubdomain() {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const sub = urlParams.get('subdomain') || urlParams.get('sub') || urlParams.get('p') || urlParams.get('profile');
  if (sub) return sub.trim().toLowerCase();

  if (window.location.hash) {
    const hash = window.location.hash.replace(/^#/, '').trim();
    if (hash.includes('=')) {
      const hashParams = new URLSearchParams(hash);
      const hashSub = hashParams.get('subdomain') || hashParams.get('p') || hashParams.get('sub');
      if (hashSub) return hashSub.trim().toLowerCase();
    } else if (hash && !hash.startsWith('tab-') && !hash.startsWith('view-') && !hash.startsWith('create')) {
      return hash.toLowerCase();
    }
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    const lastPart = pathParts[pathParts.length - 1];
    const prevPart = pathParts[pathParts.length - 2];
    if (prevPart === 'profile' || prevPart === 'p') {
      return lastPart.toLowerCase();
    }
  }

  return null;
}

/**
 * Builds clean standalone profile URL for sharing
 * @param {string} subdomain 
 * @returns {string}
 */
export function buildProfileUrl(subdomain) {
  if (typeof window === 'undefined') return '';
  const base = window.location.origin + window.location.pathname;
  return `${base}?subdomain=${encodeURIComponent(subdomain)}`;
}

export default {
  getBackendUrl,
  setBackendUrl,
  detectSubdomain,
  buildProfileUrl
};
