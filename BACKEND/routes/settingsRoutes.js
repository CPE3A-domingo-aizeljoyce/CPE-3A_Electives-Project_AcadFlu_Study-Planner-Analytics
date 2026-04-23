import express from 'express';
import {
  getSettings,
  updateSettings,
  changePassword,
  updateAvatar,                          // ✅ was missing
} from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);   // all settings routes require auth

router.get  ('/',                getSettings);
router.put  ('/',                updateSettings);
router.post ('/change-password', changePassword);
router.patch('/avatar',          updateAvatar);   // ✅ was missing — caused 404 on upload & remove

export default router;