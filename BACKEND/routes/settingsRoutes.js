import express from 'express';
import {
  getSettings,
  updateSettings,
  changePassword,
} from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get ('/',                getSettings);
router.put ('/',                updateSettings);
router.post('/change-password', changePassword);

export default router;
