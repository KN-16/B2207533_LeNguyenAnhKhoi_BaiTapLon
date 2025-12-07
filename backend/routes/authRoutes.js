import express from 'express';
import {
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
} from '../controllers/authController.js';
import {
  registerReaderValidator,
  loginValidator,
  updateUserProfileValidator,
} from '../utils/validators.js';
import handleValidationErrors from '../middleware/validationMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { createReader } from '../controllers/adminController.js';
const router = express.Router();

router.post(
  '/register',
  authLimiter,
  registerReaderValidator,
  handleValidationErrors,
  createReader
);
router.post(
  '/login',
  authLimiter,
  loginValidator,
  handleValidationErrors,
  loginUser
);
router.post('/refresh', refreshToken);
router.post('/logout', requireAuth, logoutUser);
router.get('/profile', requireAuth, getUserProfile)
router.put('/profile',requireAuth, updateUserProfileValidator, handleValidationErrors, updateUserProfile);

export default router;