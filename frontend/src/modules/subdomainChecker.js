/**
 * Subdomain Availability & Syntax Validator
 */
import { api } from './apiClient.js';

let debounceTimeout = null;

export function sanitizeSubdomain(input) {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function validateSubdomainDebounced(subdomain, callback, delay = 350) {
  if (debounceTimeout) clearTimeout(debounceTimeout);

  const clean = sanitizeSubdomain(subdomain);

  if (!clean || clean.length < 2) {
    callback({
      valid: false,
      available: false,
      status: 'too-short',
      message: 'Subdomain must be at least 2 alphanumeric characters'
    });
    return;
  }

  callback({
    checking: true,
    status: 'checking',
    message: `Checking availability for ${clean}...`
  });

  debounceTimeout = setTimeout(async () => {
    const res = await api.get(`/api/profiles/check-subdomain/${clean}`);
    if (res.networkError) {
      // Local offline fallback: check local storage list
      const localList = JSON.parse(localStorage.getItem('bp_saved_profiles') || '[]');
      const isTakenLocally = localList.some(p => p.subdomain?.toLowerCase() === clean);
      callback({
        valid: true,
        available: !isTakenLocally,
        subdomain: clean,
        status: isTakenLocally ? 'taken' : 'available',
        message: isTakenLocally ? `Subdomain "${clean}" is already in local list` : `"${clean}" is available`
      });
      return;
    }

    callback(res);
  }, delay);
}

export default {
  sanitizeSubdomain,
  validateSubdomainDebounced
};
