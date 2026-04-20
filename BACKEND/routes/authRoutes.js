import express from 'express';
import {
  register,
  login,
  verifyEmail,
  googleAuth,
  getGoogleAuthUrl,
  googleCallback,
  forgotPassword,
  resetPassword,
  getMe,
  deleteAccount,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post  ('/register',        register);
router.post  ('/login',           login);
router.get   ('/verify-email',    verifyEmail);
router.post  ('/google',          googleAuth);
router.get   ('/google/url',      getGoogleAuthUrl);
router.get   ('/google/callback', googleCallback);
router.post  ('/forgot-password', forgotPassword);
router.post  ('/reset-password',  resetPassword);
router.get   ('/me',              protect, getMe);
router.delete('/delete-account',  protect, deleteAccount);  // ← ADDED

export default router;