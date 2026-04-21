import Goal from '../models/goalModel.js';

// @desc    Get goals
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get goals' });
  }
};

// @desc    Create new goal
// @route   POST /api/goals
// @access  Private
export const createGoal = async (req, res) => {
  try {
    const { title, subject, color } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Please add a goal title' });
    }

    const goal = await Goal.create({
      title,
      subject: subject || 'General',
      color: color || '#6366f1',
      user: req.user.id
    });

    res.status(200).json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update goal (Para sa Edit at Complete toggle)
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check for user
    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await goal.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};