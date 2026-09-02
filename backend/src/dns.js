/**
 * Backend DNS & Subdomain Configuration
 * Business Profile Platform
 */
import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const MAIN_DOMAIN = process.env.MAIN_DOMAIN || 'localhost';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

/**
 * Extracts subdomain from Express Request
 * Supports:
 * 1. Subdomain from Wildcard Host header (e.g. ram.localhost:5000 => ram)
 * 2. Header `x-subdomain` (for reverse proxy or frontend fetch)
 * 3. Query param `?subdomain=ram` (for development & live preview)
 * 4. Path parameter `req.params.subdomain`
 * 
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export function extractSubdomain(req) {
  if (req.headers['x-subdomain']) {
    return String(req.headers['x-subdomain']).toLowerCase().trim();
  }
  if (req.query && req.query.subdomain) {
    return String(req.query.subdomain).toLowerCase().trim();
  }
  if (req.params && req.params.subdomain) {
    return String(req.params.subdomain).toLowerCase().trim();
  }

  const host = req.headers.host || req.hostname || '';
  const cleanHost = host.split(':')[0].toLowerCase();

  if (
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost === MAIN_DOMAIN.toLowerCase() ||
    cleanHost.endsWith('.run.app')
  ) {
    return null;
  }

  if (cleanHost.endsWith(`.${MAIN_DOMAIN.toLowerCase()}`)) {
    const sub = cleanHost.replace(`.${MAIN_DOMAIN.toLowerCase()}`, '');
    if (sub && !['www', 'api', 'app', 'dev', 'admin'].includes(sub)) {
      return sub;
    }
  }

  const parts = cleanHost.split('.');
  if (parts.length >= 3) {
    const candidate = parts[0];
    if (!['www', 'api', 'app', 'dev', 'admin'].includes(candidate)) {
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
