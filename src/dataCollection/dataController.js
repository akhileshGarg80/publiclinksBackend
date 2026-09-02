/**
 * Data Controller - Core Business Logic for Business Profile Platform
 * 
 * Handles all 8 standard endpoints:
 * 1. GET /api/templates
 * 2. GET /api/templates/:templateId
 * 3. GET /api/profiles/check-subdomain/:subdomain
 * 4. POST /api/profiles
 * 5. GET /api/profiles/:subdomain
 * 6. POST /api/profiles/:id/verify
 * 7. GET /api/profiles/:id/edit
 * 8. PATCH /api/profiles/:id
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Profile, memoryStore } from './dataModel.js';
import {
  getAllTemplateDefinitions,
  getTemplateDefinitionById,
  isValidTemplateId
} from '../templates/templateLoader.js';
import {
  validateSubdomainString,
  validateDataAgainstTemplate,
  generateEditToken
} from './dataMiddleware.js';
import { FRONTEND_URL, MAIN_DOMAIN } from '../../dns.js';

/**
 * Helper to check whether Mongoose is active or fallback store should be queried
 */
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

/**
 * 1. GET /api/templates
 * Returns all available templates with summary information
 */
export async function getTemplates(req, res) {
  try {
    const templates = getAllTemplateDefinitions();
    const category = req.query.category;

    let filtered = templates;
    if (category) {
      filtered = templates.filter(t => t.category?.toLowerCase() === String(category).toLowerCase());
    }

    const summaryList = filtered.map(t => ({
      templateId: t.templateId,
      name: t.name,
      category: t.category || 'General',
      description: t.description || '',
      previewImage: t.previewImage || '',
      theme: t.theme || {},
      fieldCount: Object.keys(t.fields || {}).length,
      requiredFields: Object.entries(t.fields || {})
        .filter(([_, f]) => f.required)
        .map(([key, f]) => ({ key, label: f.label || key, type: f.type }))
    }));

    return res.status(200).json({
      success: true,
      count: summaryList.length,
      templates: summaryList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      message: error.message
    });
  }
}

/**
 * 2. GET /api/templates/:templateId
 * Returns complete JSON schema and field definitions of a specific template
 */
export async function getTemplateById(req, res) {
  try {
    const { templateId } = req.params;
    const template = getTemplateDefinitionById(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template with ID "${templateId}" not found`
      });
    }

    return res.status(200).json({
      success: true,
      template
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve template details',
      message: error.message
    });
  }
}

/**
 * 3. GET /api/profiles/check-subdomain/:subdomain
 * Live Subdomain Availability Checker
 */
export async function checkSubdomainAvailability(req, res) {
  try {
    const { subdomain } = req.params;
    const validation = validateSubdomainString(subdomain);

    if (!validation.valid) {
      return res.status(200).json({
        success: true,
        available: false,
        subdomain: String(subdomain || '').toLowerCase().trim(),
        status: 'invalid',
        reason: validation.message
      });
    }

    const cleanSubdomain = validation.sanitized;
    let exists = false;

    if (isMongoConnected()) {
      exists = await Profile.exists({ subdomain: cleanSubdomain });
    } else {
      exists = await memoryStore.exists({ subdomain: cleanSubdomain });
    }

    if (exists) {
      return res.status(200).json({
        success: true,
        available: false,
        subdomain: cleanSubdomain,
        status: 'taken',
        reason: `Subdomain "${cleanSubdomain}" is already registered`
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      subdomain: cleanSubdomain,
      status: 'available',
      message: `Subdomain "${cleanSubdomain}" is available for registration`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to check subdomain availability',
      message: error.message
    });
  }
}

/**
 * 4. POST /api/profiles
 * Creates a brand new Business Profile
 */
export async function createProfile(req, res) {
  try {
    const { templateId, subdomain, data, password, isPublished } = req.body;

    // 1. Subdomain validation
    const subValidation = validateSubdomainString(subdomain);
    if (!subValidation.valid) {
      return res.status(400).json({
        success: false,
        error: subValidation.message
      });
    }
    const cleanSubdomain = subValidation.sanitized;

    // 2. Database uniqueness check
    let alreadyExists = false;
    if (isMongoConnected()) {
      alreadyExists = await Profile.exists({ subdomain: cleanSubdomain });
    } else {
      alreadyExists = await memoryStore.exists({ subdomain: cleanSubdomain });
    }

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        error: `Subdomain "${cleanSubdomain}" is already taken. Please choose another subdomain.`
      });
    }

    // 3. Template validation & trusted field verification
    if (!isValidTemplateId(templateId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid templateId "${templateId}". Template not found.`
      });
    }

    const dataValidation = validateDataAgainstTemplate(templateId, data);
    if (!dataValidation.valid) {
      return res.status(422).json({
        success: false,
        error: 'Data validation failed for the selected template',
        details: dataValidation.errors
      });
    }

    // 4. Password hashing
    let passwordHash = null;
    let passwordEnabled = false;

    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 4 characters long'
        });
      }
      passwordHash = await bcrypt.hash(password, 10);
      passwordEnabled = true;
    }

    // 5. Construct payload
    const profilePayload = {
      templateId,
      subdomain: cleanSubdomain,
      data: data || {},
      passwordHash,
      passwordEnabled,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
    };

    let newProfile = null;
    if (isMongoConnected()) {
      const doc = new Profile(profilePayload);
      await doc.save();
      newProfile = doc.toJSON();
    } else {
      const doc = await memoryStore.create(profilePayload);
      newProfile = doc.toJSON();
    }

    const publicUrl = `http://${cleanSubdomain}.${MAIN_DOMAIN}`;
    const directUrl = `${FRONTEND_URL}/profile/${cleanSubdomain}`;

    return res.status(201).json({
      success: true,
      message: 'Business profile created successfully',
      profile: {
        id: newProfile._id || newProfile.id,
        templateId: newProfile.templateId,
        subdomain: newProfile.subdomain,
        data: newProfile.data,
        passwordEnabled: newProfile.passwordEnabled,
        isPublished: newProfile.isPublished,
        createdAt: newProfile.createdAt,
        updatedAt: newProfile.updatedAt,
      },
      urls: {
        subdomainUrl: publicUrl,
        directUrl,
        apiEndpoint: `/api/profiles/${cleanSubdomain}`
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Subdomain is already registered (unique constraint violation)'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create profile',
      message: error.message
    });
  }
}

/**
 * 5. GET /api/profiles/:subdomain
 * Loads public profile by subdomain
 */
export async function getPublicProfile(req, res) {
  try {
    const subdomain = req.params.subdomain?.toLowerCase().trim();

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain is required'
      });
    }

    let profile = null;
    if (isMongoConnected()) {
      profile = await Profile.findOne({ subdomain });
    } else {
      profile = await memoryStore.findOne({ subdomain });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: `Profile for "${subdomain}" not found`
      });
    }

    if (!profile.isPublished) {
      return res.status(403).json({
        success: false,
        error: 'This profile is currently unpublished by the owner'
      });
    }

    // Load template definition
    const template = getTemplateDefinitionById(profile.templateId);

    // Track views count asynchronously
    if (isMongoConnected()) {
      Profile.updateOne({ _id: profile._id }, { $inc: { viewsCount: 1 } }).catch(() => {});
    }

    const cleanProfile = typeof profile.toJSON === 'function' ? profile.toJSON() : profile;

    return res.status(200).json({
      success: true,
      profile: {
        id: cleanProfile._id || cleanProfile.id,
        subdomain: cleanProfile.subdomain,
        templateId: cleanProfile.templateId,
        data: cleanProfile.data,
        passwordEnabled: cleanProfile.passwordEnabled,
        isPublished: cleanProfile.isPublished,
        createdAt: cleanProfile.createdAt,
        updatedAt: cleanProfile.updatedAt,
      },
      template: template ? {
        templateId: template.templateId,
        name: template.name,
        category: template.category,
        theme: template.theme,
        fields: template.fields
      } : null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch public profile',
      message: error.message
    });
  }
}

/**
 * 6. POST /api/profiles/:id/verify
 * Verifies profile edit password and returns a short-lived JWT edit session token
 */
export async function verifyEditPassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to unlock edit session'
      });
    }

    let profile = null;
    if (isMongoConnected()) {
      // Must select passwordHash explicitly as it is select: false
      profile = await Profile.findById(id).select('+passwordHash');
    } else {
      profile = await memoryStore.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    if (!profile.passwordEnabled || !profile.passwordHash) {
      return res.status(403).json({
        success: false,
        error: 'Editing is locked: This profile was created without a password.'
      });
    }

    const isValid = await profile.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Access denied.'
      });
    }

    const profileId = profile._id || profile.id;
    const token = generateEditToken(profileId, profile.subdomain);

    return res.status(200).json({
      success: true,
      message: 'Password verified successfully',
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      profile: {
        id: profileId,
        subdomain: profile.subdomain,
        templateId: profile.templateId,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to verify password',
      message: error.message
    });
  }
}

/**
 * 7. GET /api/profiles/:id/edit
 * Returns existing master data and available templates for an authenticated edit session
 */
export async function getProfileForEdit(req, res) {
  try {
    const { id } = req.params;

    let profile = null;
    if (isMongoConnected()) {
      profile = await Profile.findById(id);
    } else {
      profile = await memoryStore.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    const cleanProfile = typeof profile.toJSON === 'function' ? profile.toJSON() : profile;
    const currentTemplate = getTemplateDefinitionById(profile.templateId);
    const allTemplates = getAllTemplateDefinitions().map(t => ({
      templateId: t.templateId,
      name: t.name,
      category: t.category,
      previewImage: t.previewImage
    }));

    return res.status(200).json({
      success: true,
      profile: {
        id: cleanProfile._id || cleanProfile.id,
        subdomain: cleanProfile.subdomain,
        templateId: cleanProfile.templateId,
        data: cleanProfile.data, // Master data dictionary
        passwordEnabled: cleanProfile.passwordEnabled,
        isPublished: cleanProfile.isPublished,
        createdAt: cleanProfile.createdAt,
        updatedAt: cleanProfile.updatedAt,
      },
      currentTemplate,
      availableTemplates: allTemplates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to load profile for editing',
      message: error.message
    });
  }
}

/**
 * 8. PATCH /api/profiles/:id
 * Updates existing profile, supports template switching while preserving historical master data!
 */
export async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const { templateId, data, password, isPublished } = req.body;

    let profile = null;
    if (isMongoConnected()) {
      profile = await Profile.findById(id).select('+passwordHash');
    } else {
      profile = await memoryStore.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    // Check if template is being switched or kept
    const targetTemplateId = templateId || profile.templateId;
    if (!isValidTemplateId(targetTemplateId)) {
      return res.status(400).json({
        success: false,
        error: `Target template "${targetTemplateId}" is not valid`
      });
    }

    // Deep merge: Combine existing master data with incoming updates
    const existingData = profile.data || {};
    const incomingData = data && typeof data === 'object' ? data : {};
    const mergedMasterData = {
      ...existingData,
      ...incomingData
    };

    // Validate merged master data against the target template
    const validation = validateDataAgainstTemplate(targetTemplateId, mergedMasterData);
    if (!validation.valid) {
      return res.status(422).json({
        success: false,
        error: `Validation failed for template "${targetTemplateId}". Some required fields are missing.`,
        details: validation.errors,
        missingFields: validation.errors
      });
    }

    // Build update object
    const updatePayload = {
      templateId: targetTemplateId,
      data: mergedMasterData,
    };

    if (isPublished !== undefined) {
      updatePayload.isPublished = Boolean(isPublished);
    }

    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.length < 4) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 4 characters long'
        });
      }
      updatePayload.passwordHash = await bcrypt.hash(password, 10);
      updatePayload.passwordEnabled = true;
    }

    let updated = null;
    if (isMongoConnected()) {
      updated = await Profile.findByIdAndUpdate(
        id,
        { $set: updatePayload },
        { new: true, runValidators: true }
      );
    } else {
      updated = await memoryStore.findByIdAndUpdate(id, updatePayload);
    }

    const clean = typeof updated.toJSON === 'function' ? updated.toJSON() : updated;

    return res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      profile: {
        id: clean._id || clean.id,
        templateId: clean.templateId,
        subdomain: clean.subdomain,
        data: clean.data,
        passwordEnabled: clean.passwordEnabled,
        isPublished: clean.isPublished,
        updatedAt: clean.updatedAt,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
}

export default {
  getTemplates,
  getTemplateById,
  checkSubdomainAvailability,
  createProfile,
  getPublicProfile,
  verifyEditPassword,
  getProfileForEdit,
  updateProfile,
};
