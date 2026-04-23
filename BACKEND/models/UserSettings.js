import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  profile: {
    bio:       { type: String, default: '' },
    timezone:  { type: String, default: 'Asia/Manila' },
    studyGoal: { type: Number, default: 4 },
  },

  notifs: {
    taskReminders:     { type: Boolean, default: true  },
    breakReminders:    { type: Boolean, default: true  },
    dailyDigest:       { type: Boolean, default: false },
    achievementAlerts: { type: Boolean, default: true  },
    streakWarning:     { type: Boolean, default: true  },
    weeklyReport:      { type: Boolean, default: true  },
    emailNotifs:       { type: Boolean, default: false },
    soundAlerts:       { type: Boolean, default: true  },
  },

  timer: {
    focusDuration:      { type: Number,  default: 25    },
    shortBreak:         { type: Number,  default: 5     },
    longBreak:          { type: Number,  default: 15    },
    sessionsBeforeLong: { type: Number,  default: 4     },
    autoStartBreaks:    { type: Boolean, default: true  },
    autoStartSessions:  { type: Boolean, default: false },
    soundEnabled:       { type: Boolean, default: true  },
    notifyOnComplete:   { type: Boolean, default: true  },
  },

  // ✅ NEW — persists appearance per user across devices/browsers
  appearance: {
    theme:       { type: String,  default: 'dark'   },
    accentColor: { type: String,  default: 'indigo' },
    compactMode: { type: Boolean, default: false     },
    animations:  { type: Boolean, default: true      },
    showXPBar:   { type: Boolean, default: true      },
    showStreak:  { type: Boolean, default: true      },
  },

}, { timestamps: true });

export default mongoose.model('UserSettings', userSettingsSchema);
