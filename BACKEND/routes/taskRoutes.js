import express from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  toggleTask,
  updateTaskStatus,
  syncTaskToCalendar,
  getCalendarEvents,
  getCalendarStats,
  syncFromCalendar,          // ← NEW
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// CRUD
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Task-level operations
router.patch('/:id/toggle',       toggleTask);
router.patch('/:id/status',       updateTaskStatus);
router.post ('/:id/sync-calendar', syncTaskToCalendar);

// Calendar integration
router.get  ('/calendar/events',             getCalendarEvents);
router.get  ('/calendar/stats',              getCalendarStats);
router.post ('/calendar/sync-from-calendar', syncFromCalendar);  // ← NEW (2-way sync)

export default router;