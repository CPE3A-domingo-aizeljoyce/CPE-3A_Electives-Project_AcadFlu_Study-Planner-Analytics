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
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// CRUD operations
router.route('/')
  .get(getTasks)           // GET /api/tasks - get all tasks for user
  .post(createTask);       // POST /api/tasks - create new task

router.route('/:id')
  .get(getTask)            // GET /api/tasks/:id - get single task
  .put(updateTask)         // PUT /api/tasks/:id - update task
  .delete(deleteTask);     // DELETE /api/tasks/:id - delete task

// Special endpoints
router.patch('/:id/toggle', toggleTask);        // PATCH /api/tasks/:id/toggle - toggle done status
router.patch('/:id/status', updateTaskStatus);  // PATCH /api/tasks/:id/status - update status
router.post('/:id/sync-calendar', syncTaskToCalendar);  // POST /api/tasks/:id/sync-calendar - sync to calendar

// Calendar integration
router.get('/calendar/events', getCalendarEvents);      // GET /api/tasks/calendar/events - fetch calendar events
router.get('/calendar/stats', getCalendarStats);        // GET /api/tasks/calendar/stats - get productivity stats

export default router;
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
} from '../controllers/taskController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// CRUD operations
router.route('/')
  .get(getTasks)           // GET /api/tasks - get all tasks for user
  .post(createTask);       // POST /api/tasks - create new task

router.route('/:id')
  .get(getTask)            // GET /api/tasks/:id - get single task
  .put(updateTask)         // PUT /api/tasks/:id - update task
  .delete(deleteTask);     // DELETE /api/tasks/:id - delete task

// Special endpoints
router.patch('/:id/toggle', toggleTask);        // PATCH /api/tasks/:id/toggle - toggle done status
router.patch('/:id/status', updateTaskStatus);  // PATCH /api/tasks/:id/status - update status
router.post('/:id/sync-calendar', syncTaskToCalendar);  // POST /api/tasks/:id/sync-calendar - sync to calendar

// Calendar integration
router.get('/calendar/events', getCalendarEvents);      // GET /api/tasks/calendar/events - fetch calendar events
router.get('/calendar/stats', getCalendarStats);        // GET /api/tasks/calendar/stats - get productivity stats

export default router;// TASK ROUTES
// Handles all task operations (CRUD)
//
// Connected frontend:
// - Tasks.jsx
//
// Uses:
// - Controller: taskController.js
// - Model: Task.js
// - Middleware: authMiddleware.js
