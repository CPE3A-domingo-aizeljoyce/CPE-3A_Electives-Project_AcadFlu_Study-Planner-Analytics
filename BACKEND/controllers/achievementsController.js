import { getAchievementsWithProgress, checkAndAwardAchievements } from '../utils/achievementService.js';

// @desc  Get all achievements with unlock status + progress for current user
// @route GET /api/achievements
// @access Private
export const getAchievements = async (req, res) => {
  try {
    const data = await getAchievementsWithProgress(req.user._id);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Get achievements error:', err);
    res.status(500).json({ message: 'Failed to fetch achievements', error: err.message });
  }
};

// @desc  Manually trigger an achievement check (e.g., on page load)
// @route POST /api/achievements/check
// @access Private
export const triggerCheck = async (req, res) => {
  try {
    const newlyUnlocked = await checkAndAwardAchievements(req.user._id);
    res.json({ success: true, newlyUnlocked });
  } catch (err) {
    console.error('Trigger achievement check error:', err);
    res.status(500).json({ message: 'Failed to check achievements', error: err.message });
  }
};