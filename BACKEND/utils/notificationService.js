import Notification from '../models/Notification.js';

/**
 * Create a notification for a user
 * @param {Object} options
 * @param {string} options.userId - User ID (required)
 * @param {string} options.type - Notification type (e.g., 'goal_deadline', 'achievement')
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification message/body
 * @param {string} [options.icon] - Icon name from lucide (default: 'Bell')
 * @param {string} [options.color] - Hex color code (default: '#6366f1')
 * @param {string} [options.relatedId] - ID of related document
 * @param {string} [options.relatedModel] - Related model type ('Goal', 'Achievement', 'StudySession')
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (options) => {
  try {
    const {
      userId,
      type = 'system',
      title,
      body,
      icon = 'Bell',
      color = '#6366f1',
      relatedId = null,
      relatedModel = null,
    } = options;

    if (!userId || !title || !body) {
      throw new Error('userId, title, and body are required');
    }

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      body,
      icon,
      color,
      relatedId,
      relatedModel,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create a goal deadline notification
 */
export const notifyGoalDeadline = async (userId, goalTitle, goalId) => {
  return createNotification({
    userId,
    type: 'goal_deadline',
    title: 'Goal Deadline Approaching',
    body: `Your goal "${goalTitle}" is approaching its deadline.`,
    icon: 'AlertCircle',
    color: '#ef4444',
    relatedId: goalId,
    relatedModel: 'Goal',
  });
};

/**
 * Create a goal milestone notification
 */
export const notifyGoalMilestone = async (userId, goalTitle, percentage, goalId) => {
  return createNotification({
    userId,
    type: 'goal_milestone',
    title: 'Milestone Reached!',
    body: `You've reached ${percentage}% of your goal "${goalTitle}"!`,
    icon: 'Zap',
    color: '#6366f1',
    relatedId: goalId,
    relatedModel: 'Goal',
  });
};

/**
 * Create an achievement notification
 */
export const notifyAchievement = async (userId, achievementTitle, achievementId) => {
  return createNotification({
    userId,
    type: 'achievement',
    title: 'Achievement Unlocked!',
    body: `You've unlocked: ${achievementTitle}`,
    icon: 'Award',
    color: '#fbbf24',
    relatedId: achievementId,
    relatedModel: 'Achievement',
  });
};

/**
 * Create a streak notification
 */
export const notifyStreakWarning = async (userId, streakDays) => {
  return createNotification({
    userId,
    type: 'reminder',
    title: 'Streak at risk!',
    body: `Study today to keep your ${streakDays}-day streak.`,
    icon: 'Flame',
    color: '#f97316',
  });
};

/**
 * Create a system notification
 */
export const notifySystem = async (userId, title, body) => {
  return createNotification({
    userId,
    type: 'system',
    title,
    body,
    icon: 'Bell',
    color: '#6366f1',
  });
};

/**
 * Goal Reminder: Goal not updated in 3+ days
 */
export const notifyGoalStale = async (userId, goalTitle, daysWithoutUpdate, goalId) => {
  return createNotification({
    userId,
    type: 'reminder',
    title: 'Goal Needs Attention 📌',
    body: `You haven't updated "${goalTitle}" in ${daysWithoutUpdate} days. Keep the momentum going!`,
    icon: 'Clock',
    color: '#f97316',
    relatedId: goalId,
    relatedModel: 'Goal',
  });
};

/**
 * Goal Reminder: Deadline is today
 */
export const notifyGoalDeadlineToday = async (userId, goalTitle, goalId) => {
  return createNotification({
    userId,
    type: 'goal_deadline',
    title: 'Goal Deadline Today! ⏰',
    body: `Your goal "${goalTitle}" is due TODAY. Time to finish it!`,
    icon: 'AlertCircle',
    color: '#ef4444',
    relatedId: goalId,
    relatedModel: 'Goal',
  });
};

/**
 * Goal Reminder: Deadline is tomorrow
 */
export const notifyGoalDeadlineTomorrow = async (userId, goalTitle, goalId) => {
  return createNotification({
    userId,
    type: 'goal_deadline',
    title: 'Goal Deadline Tomorrow 🕐',
    body: `Your goal "${goalTitle}" is due TOMORROW. Prepare to finish it!`,
    icon: 'Clock',
    color: '#fb923c',
    relatedId: goalId,
    relatedModel: 'Goal',
  });
};

/**
 * Goal Reminder: Deadline has passed
 */
export const notifyGoalOverdue = async (userId, goalTitle, goalId) => {
  return createNotification({
    userId,
    type: 'goal_deadline',
    title: 'Goal is Overdue ⚠️',
    body: `Your goal "${goalTitle}" deadline has passed. Complete it ASAP!`,
    icon: 'AlertCircle',
    color: '#ef4444',
    relatedId: goalId,
    relatedModel: 'Goal',
  });
};
