import express from 'express';
import {
  register,
  login,
  verifyEmail,
  googleAuth,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// NOTE: rateLimiter removed — it was importing a non-existent file
// (../middleware/rateLimiter.js) which caused Node to crash on startup.
// Add it back once you create that middleware file.

router.post('/register',        register);
router.post('/login',           login);
router.get ('/verify-email',    verifyEmail);
router.post('/google',          googleAuth);
router.post('/forgot-password', forgotPassword);   // ← ADDED
router.post('/reset-password',  resetPassword);    // ← ADDED
router.get ('/me',              protect, getMe);

export default router;