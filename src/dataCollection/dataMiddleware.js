/**
 * Data Middleware - Validation, Security, & Authentication
 * 
 * Enforces:
 * - Subdomain syntax & reserved word checks
 * - Server-side trusted template JSON validation
 * - Dynamic field type & constraints validation
 * - JWT Edit session authentication
 */
import jwt from 'jsonwebtoken';
import { getTemplateDefinitionById } from '../templates/templateLoader.js';

const JWT_SECRET = process.env.JWT_SECRET || 'business_profiles_jwt_secret_dev_key_2026_secure';

// List of reserved subdomains that cannot be registered by users
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
  'blog',
  'docs',
  'shop',
  'store'
]);

/**
 * Validates subdomain format and checks reserved list
 * @param {string} subdomain 
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateSubdomainString(subdomain) {
  if (!subdomain || typeof subdomain !== 'string') {
    return { valid: false, message: 'Subdomain is required and must be a string' };
  }

  const clean = subdomain.toLowerCase().trim();

  if (clean.length < 2) {
    return { valid: false, message: 'Subdomain must be at least 2 characters long' };
  }

  if (clean.length > 32) {
    return { valid: false, message: 'Subdomain cannot exceed 32 characters' };
  }

  // Allowed: lowercase alphanumeric, hyphens (cannot start or end with hyphen)
  const regex = /^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$/;
  if (!regex.test(clean)) {
    return { 
      valid: false, 
      message: 'Subdomain can only contain lowercase letters, numbers, and single hyphens, and cannot start or end with a hyphen' 
    };
  }

  if (clean.includes('--')) {
    return { valid: false, message: 'Subdomain cannot contain consecutive hyphens' };
  }

  if (RESERVED_SUBDOMAINS.has(clean)) {
    return { valid: false, message: `The subdomain "${clean}" is a reserved system keyword and cannot be used` };
  }

  return { valid: true, sanitized: clean };
}

/**
 * Express middleware to validate subdomain in route parameters or body
 */
export function validateSubdomainMiddleware(req, res, next) {
  const subdomain = req.params.subdomain || req.body.subdomain;
  if (!subdomain) {
    return res.status(400).json({
      success: false,
      error: 'Subdomain is required'
    });
  }

  const result = validateSubdomainString(subdomain);
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      error: result.message
    });
  }

  req.sanitizedSubdomain = result.sanitized;
  next();
}

/**
 * Validates user data payload against the server-side trusted template JSON
 * @param {string} templateId 
 * @param {object} data 
 * @returns {{ valid: boolean, errors: string[], validatedData: object }}
 */
export function validateDataAgainstTemplate(templateId, data) {
  const template = getTemplateDefinitionById(templateId);
  if (!template) {
    return {
      valid: false,
      errors: [`Template "${templateId}" is not recognized or does not exist on server`],
      validatedData: {}
    };
  }

  const errors = [];
  const incomingData = (data && typeof data === 'object') ? data : {};
  const templateFields = template.fields || {};

  // Check required fields and validate individual field types
  for (const [fieldName, fieldConfig] of Object.entries(templateFields)) {
    const value = incomingData[fieldName];
    const isRequired = Boolean(fieldConfig.required);

    // Missing check
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      if (isRequired) {
        errors.push(`Field "${fieldName}" (${fieldConfig.label || fieldName}) is required for ${template.name}`);
      }
      continue;
    }

    // Type validation
    const type = fieldConfig.type;
    const validation = fieldConfig.validation || {};
    const limits = fieldConfig.limits || {};

    switch (type) {
      case 'text':
      case 'textarea':
      case 'location': {
        if (typeof value !== 'string') {
          errors.push(`Field "${fieldName}" must be a text string`);
        } else {
          if (validation.minLength && value.length < validation.minLength) {
            errors.push(`Field "${fieldName}" must have at least ${validation.minLength} characters`);
          }
          if (validation.maxLength && value.length > validation.maxLength) {
            errors.push(`Field "${fieldName}" cannot exceed ${validation.maxLength} characters`);
          }
        }
        break;
      }

      case 'number':
      case 'price': {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`Field "${fieldName}" must be a valid numeric value`);
        } else {
          if (validation.min !== undefined && num < validation.min) {
            errors.push(`Field "${fieldName}" cannot be less than ${validation.min}`);
          }
          if (validation.max !== undefined && num > validation.max) {
            errors.push(`Field "${fieldName}" cannot exceed ${validation.max}`);
          }
        }
        break;
      }

      case 'image':
      case 'ai-image': {
        if (typeof value !== 'string' || (!value.startsWith('http://') && !value.startsWith('https://') && !value.startsWith('data:image/'))) {
          errors.push(`Field "${fieldName}" must be a valid image URL`);
        }
        break;
      }

      case 'image-list': {
        if (!Array.isArray(value)) {
          errors.push(`Field "${fieldName}" must be an array of image URLs`);
        } else {
          if (limits.maxItems && value.length > limits.maxItems) {
            errors.push(`Field "${fieldName}" cannot have more than ${limits.maxItems} images`);
          }
        }
        break;
      }

      case 'product-list':
      case 'menu': {
        if (!Array.isArray(value)) {
          errors.push(`Field "${fieldName}" must be a list of items`);
        } else {
          if (limits.maxItems && value.length > limits.maxItems) {
            errors.push(`Field "${fieldName}" exceeds maximum item limit of ${limits.maxItems}`);
          }
        }
        break;
      }

      case 'social-links': {
        if (typeof value !== 'string' && typeof value !== 'object') {
          errors.push(`Field "${fieldName}" must be a string or object of social links`);
        }
        break;
      }

      default:
        // Accept other dynamic types
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    template
  };
}

/**
 * Express middleware to validate templateId and incoming data in request body
 */
export function validateTemplateAndDataMiddleware(req, res, next) {
  const { templateId, data } = req.body;

  if (!templateId) {
    return res.status(400).json({
      success: false,
      error: 'templateId is required'
    });
  }

  const validation = validateDataAgainstTemplate(templateId, data);
  if (!validation.valid) {
    return res.status(422).json({
      success: false,
      error: 'Validation failed for the selected template',
      details: validation.errors
    });
  }

  req.validatedTemplate = validation.template;
  next();
}

/**
 * Generate a secure JWT edit token for verified session
 * @param {string} profileId 
 * @param {string} subdomain 
 * @returns {string} JWT Token
 */
export function generateEditToken(profileId, subdomain) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '2h';
  return jwt.sign(
    {
      profileId: String(profileId),
      subdomain: String(subdomain).toLowerCase(),
      scope: 'profile:edit',
    },
    JWT_SECRET,
    { expiresIn }
  );
}

/**
 * Middleware to verify that the request has an authorized edit session token for :id
 */
export function verifyEditAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-edit-token'];
  let token = null;

  if (authHeader) {
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = String(authHeader).trim();
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Edit token is missing. Please verify profile password first via POST /api/profiles/:id/verify'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const targetId = req.params.id;

    if (targetId && decoded.profileId !== String(targetId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Edit token is not valid for this specific profile ID'
      });
    }

    req.authSession = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired edit session token. Please re-verify password.',
      reason: err.message
    });
  }
}

export default {
  RESERVED_SUBDOMAINS,
  validateSubdomainString,
  validateSubdomainMiddleware,
  validateDataAgainstTemplate,
  validateTemplateAndDataMiddleware,
  generateEditToken,
  verifyEditAuthMiddleware,
};
