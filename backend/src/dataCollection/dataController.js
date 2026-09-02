/**
 * Data Controller - Core Business Logic for Business Profile Platform
 * Business Profile Platform
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
import { FRONTEND_URL, MAIN_DOMAIN } from '../dns.js';

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

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
      templates: summaryList,
      data: summaryList
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      message: error.message
    });
  }
}

export async function getTemplateById(req, res) {
  try {
    const { templateId } = req.params;
    const template = getTemplateDefinitionById(templateId);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: `Template "${templateId}" not found in trusted template library`
      });
    }

    return res.status(200).json({
      success: true,
      template,
      data: template
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve template details',
      message: error.message
    });
  }
}

export async function checkSubdomainAvailability(req, res) {
  try {
    const { subdomain } = req.params;
    const validation = validateSubdomainString(subdomain);

    if (!validation.valid) {
      return res.status(200).json({
        success: true,
        available: false,
        subdomain,
        status: 'invalid',
        reason: validation.reason
      });
    }

    const clean = validation.cleanSubdomain;

    if (isMongoConnected()) {
      const existing = await Profile.findOne({ subdomain: clean }).select('_id');
      if (existing) {
        return res.status(200).json({
          success: true,
          available: false,
          subdomain: clean,
          status: 'taken',
          reason: `Subdomain "${clean}" is already registered`
        });
      }
    } else {
      const existsInMemory = await memoryStore.checkSubdomainExists(clean);
      if (existsInMemory) {
        return res.status(200).json({
          success: true,
          available: false,
          subdomain: clean,
          status: 'taken',
          reason: `Subdomain "${clean}" is already registered`
        });
      }
    }

    return res.status(200).json({
      success: true,
      available: true,
      subdomain: clean,
      status: 'available',
      message: `Subdomain "${clean}" is available`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error checking subdomain availability',
      message: error.message
    });
  }
}

export async function createProfile(req, res) {
  try {
    const { templateId, data, password, metadata } = req.body;
    const cleanSubdomain = req.cleanSubdomain;

    let existing = null;
    if (isMongoConnected()) {
      existing = await Profile.findOne({ subdomain: cleanSubdomain });
    } else {
      existing = await memoryStore.findOne({ subdomain: cleanSubdomain });
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Subdomain "${cleanSubdomain}" is already taken. Please choose another one.`,
        field: 'subdomain'
      });
    }

    let createdDoc = null;

    if (isMongoConnected()) {
      const newProfile = new Profile({
        templateId,
        subdomain: cleanSubdomain,
        data: data || {},
        passwordHash: password ? password : null,
        passwordEnabled: Boolean(password && password.trim() !== ''),
        metadata: metadata || {}
      });
      await newProfile.save();
      createdDoc = newProfile.toObject();
      delete createdDoc.passwordHash;
    } else {
      createdDoc = await memoryStore.create({
        templateId,
        subdomain: cleanSubdomain,
        data: data || {},
        password: password || null,
        metadata: metadata || {}
      });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';

    return res.status(201).json({
      success: true,
      message: 'Business profile created successfully',
      profile: {
        id: createdDoc._id || createdDoc.id,
        templateId: createdDoc.templateId,
        subdomain: createdDoc.subdomain,
        data: createdDoc.data,
        passwordEnabled: createdDoc.passwordEnabled,
        isPublished: createdDoc.isPublished,
        createdAt: createdDoc.createdAt,
        updatedAt: createdDoc.updatedAt
      },
      urls: {
        subdomainUrl: `http://${createdDoc.subdomain}.${MAIN_DOMAIN}`,
        directUrl: `${protocol}://${host}/profile/${createdDoc.subdomain}`,
        apiEndpoint: `/api/profiles/${createdDoc.subdomain}`
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Subdomain is already registered',
        field: 'subdomain'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to create business profile',
      message: error.message
    });
  }
}

export async function getPublicProfile(req, res) {
  try {
    const { subdomain } = req.params;
    const clean = String(subdomain).toLowerCase().trim();

    let profile = null;

    if (isMongoConnected()) {
      profile = await Profile.findOne({ subdomain: clean }).lean();
    } else {
      profile = await memoryStore.findOne({ subdomain: clean });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: `Profile for "${clean}" not found`,
        subdomain: clean
      });
    }

    const template = getTemplateDefinitionById(profile.templateId);

    const safeProfile = {
      id: profile._id || profile.id,
      subdomain: profile.subdomain,
      templateId: profile.templateId,
      data: profile.data,
      passwordEnabled: profile.passwordEnabled || false,
      isPublished: profile.isPublished !== undefined ? profile.isPublished : true,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt
    };

    return res.status(200).json({
      success: true,
      profile: safeProfile,
      template: template || { templateId: profile.templateId, name: 'Default Template' }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
}

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

    if (!profile.passwordHash || !profile.passwordEnabled) {
      return res.status(400).json({
        success: false,
        error: 'This profile is not password protected and cannot be modified.'
      });
    }

    let isMatch = false;
    if (typeof profile.comparePassword === 'function') {
      isMatch = await profile.comparePassword(password);
    } else {
      isMatch = await bcrypt.compare(password, profile.passwordHash);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Access denied.'
      });
    }

    const token = generateEditToken(profile._id || profile.id, profile.subdomain);

    return res.status(200).json({
      success: true,
      message: 'Password verified successfully. Edit session token generated.',
      token,
      profile: {
        id: profile._id || profile.id,
        subdomain: profile.subdomain,
        templateId: profile.templateId,
        data: profile.data
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Verification error',
      message: error.message
    });
  }
}

export async function getProfileForEdit(req, res) {
  try {
    const { id } = req.params;
    const session = req.editSession;

    if (session.profileId !== String(id)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Edit token does not grant access to this profile'
      });
    }

    let profile = null;
    if (isMongoConnected()) {
      profile = await Profile.findById(id).lean();
    } else {
      profile = await memoryStore.findById(id);
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    delete profile.passwordHash;

    const template = getTemplateDefinitionById(profile.templateId);

    return res.status(200).json({
      success: true,
      profile,
      template
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile for edit',
      message: error.message
    });
  }
}

export async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const session = req.editSession;
    const { templateId, data, metadata } = req.body;

    if (session.profileId !== String(id)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Edit token does not grant access to this profile'
      });
    }

    let existingProfile = null;
    if (isMongoConnected()) {
      existingProfile = await Profile.findById(id);
    } else {
      existingProfile = await memoryStore.findById(id);
    }

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
    }

    const targetTemplateId = templateId || existingProfile.templateId;

    if (templateId && !isValidTemplateId(templateId)) {
      return res.status(400).json({
        success: false,
        error: `Template "${templateId}" is not recognized`
      });
    }

    const mergedData = { ...(existingProfile.data || {}), ...(data || {}) };

    const validation = validateDataAgainstTemplate(targetTemplateId, mergedData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed for updated template fields',
        details: validation.errors
      });
    }

    let updatedDoc = null;

    if (isMongoConnected()) {
      existingProfile.templateId = targetTemplateId;
      existingProfile.data = mergedData;
      if (metadata) existingProfile.metadata = { ...(existingProfile.metadata || {}), ...metadata };
      await existingProfile.save();
      updatedDoc = existingProfile.toObject();
      delete updatedDoc.passwordHash;
    } else {
      updatedDoc = await memoryStore.updateById(id, {
        templateId: targetTemplateId,
        data: mergedData,
        metadata: metadata || {}
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Business profile updated successfully',
      profile: {
        id: updatedDoc._id || updatedDoc.id,
        templateId: updatedDoc.templateId,
        subdomain: updatedDoc.subdomain,
        data: updatedDoc.data,
        updatedAt: updatedDoc.updatedAt
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
  updateProfile
};
