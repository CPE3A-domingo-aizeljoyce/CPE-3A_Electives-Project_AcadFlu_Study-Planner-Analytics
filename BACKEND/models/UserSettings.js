const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  profile: {
    name: { type: String, default: 'Moran' },
    email: { type: String, default: 'secret@gmail.com' },
    username: { type: String, default: 'mrnski' },
    bio: { type: String, default: 'CS student passionate about math and physics. Aiming for a perfect GPA!' },
    timezone: { type: String, default: 'America/New_York' },
    studyGoal: { type: Number, default: 4 },
  },
  notifs: {
    taskReminders: { type: Boolean, default: true },
    breakReminders: { type: Boolean, default: true },
    dailyDigest: { type: Boolean, default: false },
    achievementAlerts: { type: Boolean, default: true },
    streakWarning: { type: Boolean, default: true },
    weeklyReport: { type: Boolean, default: true },
    emailNotifs: { type: Boolean, default: false },
    soundAlerts: { type: Boolean, default: true },
  },
  timer: {
    focusDuration: { type: Number, default: 25 },
    shortBreak: { type: Number, default: 5 },
    longBreak: { type: Number, default: 15 },
    sessionsBeforeLong: { type: Number, default: 4 },
    autoStartBreaks: { type: Boolean, default: true },
    autoStartSessions: { type: Boolean, default: false },
    soundEnabled: { type: Boolean, default: true },
    notifyOnComplete: { type: Boolean, default: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('UserSettings', userSettingsSchema);