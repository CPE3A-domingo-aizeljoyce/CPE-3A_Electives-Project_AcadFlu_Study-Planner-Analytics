import Goal from '../models/goalModel.js';
import Notification from '../models/Notification.js';
import * as notifService from '../utils/notificationService.js';

export const createGoal = async (req, res) => {
  try {
    const { title, category, timeframe, targetAmount, unit, deadline, color } = req.body;

    const goal = await Goal.create({
      user: req.user.id,
      title,
      category,
      timeframe,
      targetAmount,
      unit,
      deadline,
      color
    });

    // Create "Goal Created" notification
    await notifService.createNotification({
      userId: req.user.id,
      type: 'system',
      title: 'New Goal Created! 🎯',
      body: `You created a new goal: "${title}"`,
      icon: 'Target',
      color: '#06b6d4',
      relatedId: goal._id,
      relatedModel: 'Goal',
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─── Helper: Check and Create Reminder Notifications ────────────────────────
const checkGoalReminders = async (userId, goals) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (const goal of goals) {
    try {
      const goalDeadline = new Date(goal.deadline);
      const deadlineDate = new Date(goalDeadline.getFullYear(), goalDeadline.getMonth(), goalDeadline.getDate());

      // ─── Check 1: Goal is not yet completed ───────────────────────────────
      const isCompleted = goal.currentAmount >= goal.targetAmount;

      // ─── Check 2: Stale goal (3+ days without update) ────────────────────
      const lastUpdateDate = new Date(goal.updatedAt);
      const daysSinceUpdate = Math.floor((now - lastUpdateDate) / (1000 * 60 * 60 * 24));

      if (!isCompleted && daysSinceUpdate >= 3) {
        // Check if notification for this goal already exists (today)
        const existingNotif = await Notification.findOne({
          user: userId,
          type: 'reminder',
          relatedId: goal._id,
          title: 'Goal Needs Attention 📌',
          createdAt: { $gte: new Date(today) },
        });

        if (!existingNotif) {
          await notifService.notifyGoalStale(userId, goal.title, daysSinceUpdate, goal._id);
        }
      }

      // ─── Check 3: Deadline is today ──────────────────────────────────────
      if (!isCompleted && deadlineDate.getTime() === today.getTime()) {
        const existingNotif = await Notification.findOne({
          user: userId,
          type: 'goal_deadline',
          relatedId: goal._id,
          title: 'Goal Deadline Today! ⏰',
          createdAt: { $gte: new Date(today) },
        });

        if (!existingNotif) {
          await notifService.notifyGoalDeadlineToday(userId, goal.title, goal._id);
        }
      }

      // ─── Check 4: Deadline is tomorrow ──────────────────────────────────
      else if (!isCompleted && deadlineDate.getTime() === tomorrow.getTime()) {
        const existingNotif = await Notification.findOne({
          user: userId,
          type: 'goal_deadline',
          relatedId: goal._id,
          title: 'Goal Deadline Tomorrow 🕐',
          createdAt: { $gte: new Date(today) },
        });

        if (!existingNotif) {
          await notifService.notifyGoalDeadlineTomorrow(userId, goal.title, goal._id);
        }
      }

      // ─── Check 5: Goal is overdue ──────────────────────────────────────
      else if (!isCompleted && deadlineDate < today) {
        const existingNotif = await Notification.findOne({
          user: userId,
          type: 'goal_deadline',
          relatedId: goal._id,
          title: 'Goal is Overdue ⚠️',
          createdAt: { $gte: new Date(today) },
        });

        if (!existingNotif) {
          await notifService.notifyGoalOverdue(userId, goal.title, goal._id);
        }
      }
    } catch (err) {
      console.error(`Error checking reminders for goal ${goal._id}:`, err);
      // Continue to next goal
    }
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id });

    // Check and create reminder notifications
    await checkGoalReminders(req.user.id, goals);

    res.status(200).json(goals);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGoalProgress = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    const wasCompleted = goal.currentAmount >= goal.targetAmount;
    const oldProgress = Math.round((goal.currentAmount / goal.targetAmount) * 100);

    goal.currentAmount = req.body.currentAmount;
    const newProgress = Math.round((goal.currentAmount / goal.targetAmount) * 100);

    const isNowCompleted = goal.currentAmount >= goal.targetAmount;

    const updatedGoal = await goal.save();

    // ─── Milestone Notifications ───────────────────────────────────────────

    // 100% - Goal Completed
    if (!wasCompleted && isNowCompleted) {
      await notifService.createNotification({
        userId: req.user.id,
        type: 'goal_milestone',
        title: 'Goal Completed! 🎉',
        body: `You've completed your goal: "${goal.title}"`,
        icon: 'Star',
        color: '#8b5cf6',
        relatedId: goal._id,
        relatedModel: 'Goal',
      });
    }
    // 90% - Nearly Complete
    else if (oldProgress < 90 && newProgress >= 90 && newProgress < 100) {
      await notifService.createNotification({
        userId: req.user.id,
        type: 'goal_milestone',
        title: 'Almost There! 🏁',
        body: `You're 90% done with "${goal.title}" - keep pushing!`,
        icon: 'Zap',
        color: '#f97316',
        relatedId: goal._id,
        relatedModel: 'Goal',
      });
    }
    // 75% - Three quarters
    else if (oldProgress < 75 && newProgress >= 75 && newProgress < 90) {
      await notifService.createNotification({
        userId: req.user.id,
        type: 'goal_milestone',
        title: 'Three Quarters Done! 📊',
        body: `You've reached 75% of "${goal.title}"`,
        icon: 'TrendingUp',
        color: '#22c55e',
        relatedId: goal._id,
        relatedModel: 'Goal',
      });
    }
    // 50% - Halfway
    else if (oldProgress < 50 && newProgress >= 50 && newProgress < 75) {
      await notifService.createNotification({
        userId: req.user.id,
        type: 'goal_milestone',
        title: 'Halfway There! 🌟',
        body: `You've reached the 50% mark on "${goal.title}"`,
        icon: 'Zap',
        color: '#6366f1',
        relatedId: goal._id,
        relatedModel: 'Goal',
      });
    }
    // 25% - Just started
    else if (oldProgress < 25 && newProgress >= 25 && newProgress < 50) {
      await notifService.createNotification({
        userId: req.user.id,
        type: 'goal_milestone',
        title: 'Great Start! 🚀',
        body: `You've completed 25% of "${goal.title}"`,
        icon: 'Zap',
        color: '#0ea5e9',
        relatedId: goal._id,
        relatedModel: 'Goal',
      });
    }

    res.status(200).json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Goal.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
