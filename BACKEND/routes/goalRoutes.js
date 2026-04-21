import express from 'express';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/goalController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

router.route('/').get(protect, getGoals).post(protect, createGoal);
router.route('/:id').delete(protect, deleteGoal).put(protect, updateGoal); 

export default router;