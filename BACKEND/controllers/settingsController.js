import User         from '../models/User.js';
import UserSettings from '../models/UserSettings.js';

// ── GET /api/settings ─────────────────────────────────────────────────────────
export const getSettings = async (req, res) => {
  try {
    const user     = req.user;
    const settings = await UserSettings.findOne({ userId: user._id });

    const profile = {
      name:      user.name,
      email:     user.email,
      avatar:    user.avatar || null,
      bio:       settings?.profile?.bio       ?? '',
      timezone:  settings?.profile?.timezone  ?? 'Asia/Manila',
      studyGoal: settings?.profile?.studyGoal ?? 4,
    };

    const notifs = settings?.notifs ?? {
      taskReminders:     true,
      breakReminders:    true,
      dailyDigest:       false,
      achievementAlerts: true,
      streakWarning:     true,
      weeklyReport:      true,
      emailNotifs:       false,
      soundAlerts:       true,
    };

    const timer = settings?.timer ?? {
      focusDuration:      25,
      shortBreak:         5,
      longBreak:          15,
      sessionsBeforeLong: 4,
      autoStartBreaks:    true,
      autoStartSessions:  false,
      soundEnabled:       true,
      notifyOnComplete:   true,
    };

    const appearance = settings?.appearance ?? {
      theme:       'dark',
      accentColor: 'indigo',
      compactMode: false,
      animations:  true,
      showXPBar:   true,
      showStreak:  true,
    };

    res.json({ profile, notifs, timer, appearance });
  } catch (err) {
    console.error('getSettings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── PUT /api/settings ─────────────────────────────────────────────────────────
export const updateSettings = async (req, res) => {
  try {
    const { profile, notifs, timer, appearance } = req.body;
    const user = req.user;

    // Update name in User model if changed
    if (profile?.name) {
      const trimmed = profile.name.trim();
      if (trimmed.length < 2 || trimmed.length > 50)
        return res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
      if (trimmed !== user.name)
        await User.findByIdAndUpdate(user._id, { name: trimmed });
    }

    // Build the update object — only include fields that were sent
    const updateFields = {};
    if (profile)    updateFields.profile    = { bio: profile.bio ?? '', timezone: profile.timezone ?? 'Asia/Manila', studyGoal: profile.studyGoal ?? 4 };
    if (notifs)     updateFields.notifs     = notifs;
    if (timer)      updateFields.timer      = timer;
    if (appearance) updateFields.appearance = appearance;

    await UserSettings.findOneAndUpdate(
      { userId: user._id },
      { $set: updateFields },
      { upsert: true, new: true }
    );

    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── POST /api/settings/change-password ───────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ error: 'All password fields are required.' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: 'New passwords do not match.' });

    if (newPassword.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      return res.status(400).json({ error: 'Password must include uppercase, lowercase, and a number.' });

    const user = await User.findById(req.user._id).select('+password');

    if (!user.password)
      return res.status(400).json({ error: 'This account uses Google sign-in and has no password to change.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ error: 'Current password is incorrect.' });

    if (currentPassword === newPassword)
      return res.status(400).json({ error: 'New password must be different from your current one.' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};