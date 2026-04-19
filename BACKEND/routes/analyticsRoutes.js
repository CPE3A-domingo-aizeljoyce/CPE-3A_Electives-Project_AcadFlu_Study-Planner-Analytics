import express from 'express';
import { getAnalyticsData, saveStudySession } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.route('/').get(protect, getAnalyticsData);
router.route('/save').post(protect, saveStudySession);

export default router;