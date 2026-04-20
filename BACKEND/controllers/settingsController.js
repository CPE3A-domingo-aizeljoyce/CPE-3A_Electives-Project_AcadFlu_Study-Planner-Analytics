const UserSettings = require('../models/UserSettings');

const defaultProfile = {
  name: 'Moran', email: 'secret@gmail.com', username: 'mrnski',
  bio: 'CS student passionate about math and physics. Aiming for a perfect GPA!',
  timezone: 'America/New_York', studyGoal: 4,
};

const defaultNotifs = {
  taskReminders: true, breakReminders: true, dailyDigest: false,
  achievementAlerts: true, streakWarning: true, weeklyReport: true,
  emailNotifs: false, soundAlerts: true,
};

const defaultTimer = {
  focusDuration: 25, shortBreak: 5, longBreak: 15,
  sessionsBeforeLong: 4, autoStartBreaks: true, autoStartSessions: false,
  soundEnabled: true, notifyOnComplete: true,
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user.id });
    if (!settings) {
      return res.json({ profile: defaultProfile, notifs: defaultNotifs, timer: defaultTimer });
    }
    res.json({
      profile: settings.profile,
      notifs: settings.notifs,
      timer: settings.timer,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { profile, notifs, timer } = req.body;
    await UserSettings.findOneAndUpdate(
      { userId: req.user.id },
      { profile, notifs, timer },
      { upsert: true, new: true }
    );
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};