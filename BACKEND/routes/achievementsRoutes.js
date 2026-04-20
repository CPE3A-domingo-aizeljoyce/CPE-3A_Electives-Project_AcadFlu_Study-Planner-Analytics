import express                           from 'express';
import { getAchievements, triggerCheck } from '../controllers/achievementsController.js';
import { protect }                       from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get ('/',      getAchievements);
router.post('/check', triggerCheck);

export default router;