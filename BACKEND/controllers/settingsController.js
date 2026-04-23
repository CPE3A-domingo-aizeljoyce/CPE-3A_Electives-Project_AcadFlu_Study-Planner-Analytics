import User         from '../models/User.js';
import UserSettings from '../models/UserSettings.js';

// ── GET /api/settings ─────────────────────────────────────────────────────────
export const getSettings = async (req, res) => {
  try {
    const user     = await User.findById(req.user._id).select('+password');
    const settings = await UserSettings.findOne({ userId: user._id });

    const isGoogleOnly = !!user.googleId && !user.password;
    const hasPassword  = !!user.password;

    const profile = {
      name:      user.name,
      email:     user.email,
      avatar:    user.avatar || null,
      bio:       settings?.profile?.bio       ?? '',
      studyGoal: settings?.profile?.studyGoal ?? 4,
      isGoogleAccount: isGoogleOnly,
      hasPassword:     hasPassword,
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

    if (profile?.name) {
      const trimmed = profile.name.trim();
      if (trimmed.length < 2 || trimmed.length > 50)
        return res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
      if (trimmed !== user.name)
        await User.findByIdAndUpdate(user._id, { name: trimmed });
    }

    const updateFields = {};
    if (profile) {
      updateFields.profile = {
        bio:       profile.bio       ?? '',
        studyGoal: profile.studyGoal ?? 4,
      };
    }
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

    if (!newPassword || !confirmPassword)
      return res.status(400).json({ error: 'New password and confirmation are required.' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: 'New passwords do not match.' });

    if (newPassword.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword))
      return res.status(400).json({ error: 'Password must include uppercase, lowercase, and a number.' });

    const user = await User.findById(req.user._id).select('+password');
    const isGoogleOnly = !!user.googleId && !user.password;

    if (isGoogleOnly) {
      user.password = newPassword;
      await user.save();
      return res.json({ message: 'Password set successfully. You can now also sign in with your email and password.' });
    }

    if (!currentPassword)
      return res.status(400).json({ error: 'Current password is required.' });

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

// ── PATCH /api/settings/avatar ────────────────────────────────────────────────
// ✅ NEW — was missing entirely, which crashed the whole settings router on startup
export const updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    // null / empty = remove avatar
    if (avatar === null || avatar === '' || avatar === undefined) {
      await User.findByIdAndUpdate(req.user._id, { avatar: null });
      return res.json({ message: 'Avatar removed.', avatar: null });
    }

    if (typeof avatar !== 'string' || !avatar.startsWith('data:image/'))
      return res.status(400).json({ error: 'Invalid image format. Expected a base64 data URL.' });

    const mimeMatch = avatar.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    if (!mimeMatch)
      return res.status(400).json({ error: 'Could not read image type from data URL.' });

    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(mimeMatch[1]))
      return res.status(400).json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed.' });

    // Rough size check: base64 length × 0.75 ≈ actual bytes
    const base64Payload  = avatar.split(',')[1] || '';
    const estimatedBytes = Math.ceil(base64Payload.length * 0.75);
    if (estimatedBytes > 2 * 1024 * 1024)
      return res.status(400).json({ error: 'Image is too large. Please use an image under 2 MB.' });

    await User.findByIdAndUpdate(req.user._id, { avatar });

    res.json({ message: 'Avatar updated successfully.', avatar });
  } catch (err) {
    console.error('updateAvatar error:', err);
    res.status(500).json({ error: 'Server error while updating avatar.' });
  }
};