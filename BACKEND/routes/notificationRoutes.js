import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/unread-count', getUnreadCount);
router.put('/mark-all', markAllAsRead);

router.get('/', getNotifications);
router.put('/:id', markAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', clearAllNotifications);

export default router;
