/**
 * Profile Manager - Core Frontend Controller
 * Manages Create, Fetch, Edit, Verify Password, and LocalStorage Caching
 */
import { api } from './apiClient.js';
import { showToast } from './toast.js';

const STORAGE_KEY = 'bp_saved_profiles';

export function getSavedProfiles() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('saved_bp_profiles') || '[]');
  } catch (e) {
    return [];
  }
}

export function saveProfileLocally(profile) {
  if (!profile || !profile.subdomain) return;
  let list = getSavedProfiles();
  list = list.filter(p => p.subdomain?.toLowerCase() !== profile.subdomain.toLowerCase());
  list.unshift({
    id: profile.id || profile._id,
    subdomain: profile.subdomain.toLowerCase(),
    templateId: profile.templateId || 'template-01',
    data: profile.data || {},
    createdAt: new Date().toISOString()
  });
  const serialized = JSON.stringify(list.slice(0, 20));
  localStorage.setItem(STORAGE_KEY, serialized);
  localStorage.setItem('saved_bp_profiles', serialized);
}

export async function fetchProfile(subdomain) {
  if (!subdomain) return { success: false, error: 'Subdomain is required' };
  const clean = subdomain.trim().toLowerCase();

  // 1. Try Backend API first
  const res = await api.get(`/api/profiles/${clean}`);
  if (res.success && res.profile) {
    saveProfileLocally(res.profile);
    return res;
  }

  // 2. Fallback to LocalStorage cache
  const localList = getSavedProfiles();
  const cached = localList.find(p => p.subdomain?.toLowerCase() === clean);
  if (cached) {
    return {
      success: true,
      fromCache: true,
      profile: cached,
      template: { templateId: cached.templateId }
    };
  }

  return {
    success: false,
    error: res.error || `Profile for "${clean}" not found`
  };
}

export async function createProfile(payload) {
  const res = await api.post('/api/profiles', payload);
  if (res.success && res.profile) {
    saveProfileLocally(res.profile);
    showToast(`Profile "${payload.subdomain}" created successfully!`, 'success');
    return res;
  }

  // If network disconnected, save offline profile locally
  if (res.networkError) {
    const offlineProfile = {
      id: 'offline_' + Date.now(),
      subdomain: payload.subdomain.toLowerCase().trim(),
      templateId: payload.templateId,
      data: payload.data || {},
      isPublished: true,
      createdAt: new Date().toISOString()
    };
    saveProfileLocally(offlineProfile);
    showToast(`Saved locally in offline mode!`, 'warning');
    return {
      success: true,
      offline: true,
      profile: offlineProfile
    };
  }

  showToast(res.error || 'Failed to create profile', 'error');
  return res;
}

export async function verifyProfilePassword(profileId, password) {
  const res = await api.post(`/api/profiles/${profileId}/verify`, { password });
  if (res.success && res.token) {
    sessionStorage.setItem('bp_edit_token', res.token);
    sessionStorage.setItem('bp_edit_profile_id', profileId);
    showToast('Password verified! Edit session unlocked.', 'success');
    return res;
  }
  showToast(res.error || 'Password verification failed', 'error');
  return res;
}

export async function updateProfile(profileId, payload) {
  const res = await api.patch(`/api/profiles/${profileId}`, payload);
  if (res.success && res.profile) {
    saveProfileLocally(res.profile);
    showToast('Profile updated successfully!', 'success');
    return res;
  }
  showToast(res.error || 'Failed to update profile', 'error');
  return res;
}

export default {
  getSavedProfiles,
  saveProfileLocally,
  fetchProfile,
  createProfile,
  verifyProfilePassword,
  updateProfile
};
