import Goal from '../models/goalModel.js';

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

    res.status(201).json(goal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id });
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
