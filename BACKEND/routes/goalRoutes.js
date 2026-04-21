import express from 'express';
import { createGoal, getGoals, updateGoalProgress, deleteGoal } from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.route('/').get(protect, getGoals).post(protect, createGoal);
router.route('/:id').put(protect, updateGoalProgress).delete(protect, deleteGoal);

export default router;