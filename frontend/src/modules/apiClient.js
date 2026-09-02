/**
 * Centralized API Client
 * Uses frontend/dns.js to dynamically resolve backend address
 */
import { getBackendUrl } from '../dns.js';
import { showToast } from './toast.js';

export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBackendUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const editToken = sessionStorage.getItem('bp_edit_token');
  if (editToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${editToken}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.error || data.message || `Request failed with HTTP status ${res.status}`;
      return { success: false, status: res.status, error: errMsg, details: data.details || data };
    }

    return { success: true, status: res.status, ...data };
  } catch (err) {
    console.warn(`[API Client Network Error] Request to ${url} failed:`, err.message);
    return {
      success: false,
      networkError: true,
      error: `Could not connect to backend at ${baseUrl}. Ensure backend server is running on localhost:5000.`
    };
  }
}

// Convenience methods
export const api = {
  get: (endpoint, headers) => apiRequest(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body), headers }),
  patch: (endpoint, body, headers) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body), headers }),
  uploadImage: async (imagePayload, filename) => {
    const baseUrl = getBackendUrl();
    try {
      const res = await fetch(`${baseUrl}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePayload, filename })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

export default api;
