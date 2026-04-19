import Notification from '../models/Notification.js';

// ── GET /api/notifications ────────────────────────────────────────────────────
export const getNotifications = async (req, res) => {
  try {
    const { unread } = req.query;

    const filter = { user: req.user._id };
    if (unread === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const notificationCount = await Notification.countDocuments(filter);

    res.status(200).json({
      notifications,
      count: notificationCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications.' });
  }
};

// ── GET /api/notifications/unread-count ───────────────────────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count.' });
  }
};

// ── PUT /api/notifications/:id (mark as read) ──────────────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this notification.' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to update notification.' });
  }
};

// ── PUT /api/notifications/mark-all (mark all as read) ─────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      message: 'All notifications marked as read.',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark all as read.' });
  }
};

// ── DELETE /api/notifications/:id ──────────────────────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this notification.' });
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Notification deleted.' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification.' });
  }
};

// ── DELETE /api/notifications (clear all) ──────────────────────────────────────
export const clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user._id });

    res.status(200).json({
      message: 'All notifications cleared.',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ message: 'Failed to clear notifications.' });
  }
};
