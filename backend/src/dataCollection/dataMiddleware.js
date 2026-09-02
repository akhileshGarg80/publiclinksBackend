/**
 * Data Middleware - Validation, Security, & Authentication
 * Business Profile Platform
 */
import jwt from 'jsonwebtoken';
import { getTemplateDefinitionById } from '../templates/templateLoader.js';

const JWT_SECRET = process.env.JWT_SECRET || 'business_profiles_jwt_secret_dev_key_2026_secure';

export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'administrator',
  'auth',
  'mail',
  'dns',
  'root',
  'static',
  'assets',
  'cdn',
  'dashboard',
  'support',
  'billing',
  'staging',
  'dev',
  'test',
  'help',
  'status',
  'portal',
  'system',
  'account',
  'login',
  'signup',
  'register',
  'logout',
  'terms',
  'privacy',
  'legal',
  'preview',
  'mainsite',
  'frontend',
  'backend'
]);

export function validateSubdomainString(subdomain) {
  if (!subdomain || typeof subdomain !== 'string') {
    return { valid: false, reason: 'Subdomain is required and must be a string' };
  }

  const clean = subdomain.trim().toLowerCase();

  if (clean.length < 2) {
    return { valid: false, reason: 'Subdomain must be at least 2 characters long' };
  }

  if (clean.length > 32) {
    return { valid: false, reason: 'Subdomain must not exceed 32 characters' };
  }

  const subdomainRegex = /^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$/;
  if (!subdomainRegex.test(clean) && clean.length > 1) {
    return {
      valid: false,
      reason: 'Subdomain can only contain lowercase letters, numbers, and hyphens (cannot start or end with hyphen)'
    };
  }

  if (RESERVED_SUBDOMAINS.has(clean)) {
    return {
      valid: false,
      reason: `Subdomain "${clean}" is reserved for platform infrastructure`
    };
  }

  return { valid: true, cleanSubdomain: clean };
}

export function validateDataAgainstTemplate(templateId, data) {
  const template = getTemplateDefinitionById(templateId);

  if (!template) {
    return {
      valid: false,
      errors: [`Invalid templateId "${templateId}". Template not found in registered definitions.`]
    };
  }

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Data payload must be an object']
    };
  }

  const errors = [];
  const fields = template.fields || {};

  for (const [fieldName, config] of Object.entries(fields)) {
    const value = data[fieldName];

    if (config.required) {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        errors.push(`Field "${fieldName}" (${config.label || fieldName}) is required for ${template.name}`);
        continue;
      }
    }

    if (value !== undefined && value !== null && value !== '') {
      const valRules = config.validation || {};

      if (valRules.minLength && typeof value === 'string' && value.length < valRules.minLength) {
        errors.push(`Field "${fieldName}" must be at least ${valRules.minLength} characters`);
      }

      if (valRules.maxLength && typeof value === 'string' && value.length > valRules.maxLength) {
        errors.push(`Field "${fieldName}" must not exceed ${valRules.maxLength} characters`);
      }

      if (valRules.isUrl && typeof value === 'string') {
        try {
          new URL(value);
        } catch {
          if (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:image')) {
            errors.push(`Field "${fieldName}" must be a valid URL`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    template
  };
}

export function validateTemplateAndDataMiddleware(req, res, next) {
  const { templateId, subdomain, data } = req.body;

  if (!templateId) {
    return res.status(400).json({
      success: false,
      error: 'templateId is required'
    });
  }

  if (!subdomain) {
    return res.status(400).json({
      success: false,
      error: 'subdomain is required'
    });
  }

  const subValidation = validateSubdomainString(subdomain);
  if (!subValidation.valid) {
    return res.status(400).json({
      success: false,
      error: subValidation.reason,
      field: 'subdomain'
    });
  }
  req.cleanSubdomain = subValidation.cleanSubdomain;

  const dataValidation = validateDataAgainstTemplate(templateId, data || {});
  if (!dataValidation.valid) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed for the selected template',
      details: dataValidation.errors
    });
  }

  req.template = dataValidation.template;
  next();
}

export function generateEditToken(profileId, subdomain) {
  return jwt.sign(
    {
      profileId: String(profileId),
      subdomain: String(subdomain).toLowerCase(),
      scope: 'edit_profile',
      type: 'owner_session'
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
  );
}

export function verifyEditAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-edit-token'];
  let token = null;

  if (authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Edit token is missing. Please verify password first.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.editSession = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Edit token has expired or is invalid. Please re-authenticate.',
      message: err.message
    });
  }
}

export default {
  RESERVED_SUBDOMAINS,
  validateSubdomainString,
  validateDataAgainstTemplate,
  validateTemplateAndDataMiddleware,
  generateEditToken,
  verifyEditAuthMiddleware
};
