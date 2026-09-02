/**
 * Data Routes - Express Routing for Business Profile Platform
 * 
 * Maps all endpoints to their corresponding middlewares and controllers:
 * - Templates endpoints
 * - Subdomain availability check
 * - Profile creation, public fetching, password verification, edit retrieval, and patching
 */
import express from 'express';
import {
  getTemplates,
  getTemplateById,
  checkSubdomainAvailability,
  createProfile,
  getPublicProfile,
  verifyEditPassword,
  getProfileForEdit,
  updateProfile
} from './dataController.js';
import {
  validateTemplateAndDataMiddleware,
  verifyEditAuthMiddleware,
  validateSubdomainMiddleware
} from './dataMiddleware.js';

const router = express.Router();

// ==========================================
// 1. Templates Routes
// ==========================================

// GET /api/templates - Retrieve all available templates
router.get('/templates', getTemplates);

// GET /api/templates/:templateId - Retrieve specific template schema
router.get('/templates/:templateId', getTemplateById);

// ==========================================
// 2. Profile Management Routes
// ==========================================

// GET /api/profiles/check-subdomain/:subdomain - Real-time subdomain availability
router.get('/profiles/check-subdomain/:subdomain', checkSubdomainAvailability);

// POST /api/profiles - Create new profile with template validation & password hashing
router.post('/profiles', validateTemplateAndDataMiddleware, createProfile);

// POST /api/profiles/:id/verify - Verify edit password and issue short-lived JWT token
router.post('/profiles/:id/verify', verifyEditPassword);

// GET /api/profiles/:id/edit - Get existing profile data for authenticated edit session
router.get('/profiles/:id/edit', verifyEditAuthMiddleware, getProfileForEdit);

// PATCH /api/profiles/:id - Update profile (data, template switch, settings)
router.patch('/profiles/:id', verifyEditAuthMiddleware, updateProfile);

// GET /api/profiles/:subdomain - Public profile load by subdomain
router.get('/profiles/:subdomain', getPublicProfile);

// ==========================================
// 3. ImgBB Upload Helper (Optional Utility)
// ==========================================
router.post('/upload/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Images should be uploaded directly to ImgBB from frontend, and the resulting URL saved into the form state.',
    provider: 'ImgBB',
    hasApiKey: Boolean(process.env.IMGBB_API_KEY)
  });
});

export default router;
