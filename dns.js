/**
 * Central DNS & URL Configuration
 * 
 * Provides centralized URL management, Domain routing, and Subdomain extraction.
 * No file in the system hard-codes URLs manually.
 */
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const MAIN_DOMAIN = process.env.MAIN_DOMAIN || 'yourdomain.com';
export const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
export const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

/**
 * Extracts subdomain from Express Request
 * Supports:
 * 1. Subdomain from Wildcard Host header (e.g., abcshop.yourdomain.com => abcshop)
 * 2. Header `x-subdomain` (e.g., for reverse proxies or API testing)
 * 3. Query param `?subdomain=abcshop` (for testing/development)
 * 4. Path parameter req.params.subdomain
 * 
 * @param {import('express').Request} req
 * @returns {string|null} normalized lowercase subdomain or null
 */
export function extractSubdomain(req) {
  // Check direct query / header overrides first (useful in dev & testing)
  if (req.headers['x-subdomain']) {
    return String(req.headers['x-subdomain']).toLowerCase().trim();
  }
  if (req.query && req.query.subdomain) {
    return String(req.query.subdomain).toLowerCase().trim();
  }
  if (req.params && req.params.subdomain) {
    return String(req.params.subdomain).toLowerCase().trim();
  }

  // Check Host header
  const host = req.headers.host || req.hostname || '';
  const cleanHost = host.split(':')[0].toLowerCase(); // Strip port

  // If host is localhost, IP, or exactly MAIN_DOMAIN, no subdomain is present
  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === MAIN_DOMAIN.toLowerCase() ||
    cleanHost.endsWith('.run.app') // Cloud Run default domain
  ) {
    return null;
  }

  // If it's a subdomain of MAIN_DOMAIN e.g., "abcshop.yourdomain.com"
  if (cleanHost.endsWith(`.${MAIN_DOMAIN.toLowerCase()}`)) {
    const sub = cleanHost.replace(`.${MAIN_DOMAIN.toLowerCase()}`, '');
    if (sub && sub !== 'www' && sub !== 'api') {
      return sub;
    }
  }

  // General fallback: first part of dot-separated domain if 3+ segments
  const parts = cleanHost.split('.');
  if (parts.length >= 3) {
    const candidate = parts[0];
    if (!['www', 'api', 'app', 'dev', 'admin', 'stage'].includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

export default {
  PORT,
  NODE_ENV,
  MAIN_DOMAIN,
  FRONTEND_URL,
  BACKEND_URL,
  CORS_ORIGIN,
  extractSubdomain
};
