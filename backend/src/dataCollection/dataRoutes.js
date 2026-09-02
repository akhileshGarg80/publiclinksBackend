/**
 * Data Routes - Express Routing for Business Profile Platform
 * Business Profile Platform - Backend API
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
  verifyEditAuthMiddleware
} from './dataMiddleware.js';
import { uploadMiddleware, handleImageUpload } from './uploadController.js';

const router = express.Router();

// 1. Templates Routes
router.get('/templates', getTemplates);
router.get('/templates/:templateId', getTemplateById);

// 2. Profile Management Routes
router.get('/profiles/check-subdomain/:subdomain', checkSubdomainAvailability);
router.post('/profiles', validateTemplateAndDataMiddleware, createProfile);
router.post('/profiles/:id/verify', verifyEditPassword);
router.get('/profiles/:id/edit', verifyEditAuthMiddleware, getProfileForEdit);
router.patch('/profiles/:id', verifyEditAuthMiddleware, updateProfile);
router.get('/profiles/:subdomain', getPublicProfile);

// 3. Image Upload Routes
router.post('/upload', uploadMiddleware, handleImageUpload);
router.post('/upload/image', uploadMiddleware, handleImageUpload);

router.get('/upload/info', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ImgBB proxy & Server upload endpoint ready at POST /api/upload',
    hasImgbbApiKey: Boolean(process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY !== 'your_imgbb_api_key_here')
  });
});

export default router;
