StudySession.js
import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  user: {
    type:     mongoose.Schema.Types.ObjectId,
    required: true,
    ref:      'User',
  },
  title: {
    type:      String,
    required:  [true, 'Session title is required'],
    trim:      true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  subject: {
    type:     String,
    required: [true, 'Subject is required'],
    trim:     true,
  },
  startTime: {
    type:     Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type:     Date,
    validate: {
      validator: function(value) {
        return !value || value > this.startTime;
      },
      message: 'End time must be after start time',
    },
  },
  duration: {
    type:    Number, // in seconds
    default: 0,
    min:     [0, 'Duration cannot be negative'],
  },
  pausedDuration: {
    type:    Number, // in seconds
    default: 0,
    min:     [0, 'Paused duration cannot be negative'],
  },
  status: {
    type:    String,
    enum:    ['running', 'paused', 'completed', 'abandoned'],
    default: 'running',
  },
  mode: {
    type:    String,
    enum:    ['work', 'short', 'long'],
    default: 'work',
  },
  notes: {
    type:      String,
    trim:      true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  isCompleted: {
    type:    Boolean,
    default: false,
  },
  lastPausedAt: {
    type: Date,
  },
  pomodoroCount: {
    type:    Number,
    default: 0,
  },
  // ─── Clockify integration ───────────────────────────────────────────────────
  clockifyEntryId: {
    type:    String,
    default: null, // stores the Clockify time entry ID
  },
}, {
  timestamps:  true,
  toJSON:      { virtuals: true },
  toObject:    { virtuals: true },
});

// Virtual: actual study time (duration - paused duration)
studySessionSchema.virtual('actualDuration').get(function() {
  return Math.max(0, this.duration - this.pausedDuration);
});

// Pre-save: calculate duration
studySessionSchema.pre('save', function(next) {
  if (this.isModified('endTime') && this.endTime && this.startTime) {
    this.duration    = Math.floor((this.endTime - this.startTime) / 1000);
    this.isCompleted = this.status === 'completed';
  }
  next();
});

// Method: pause
studySessionSchema.methods.pause = function() {
  if (this.status !== 'running') throw new Error('Can only pause a running session');
  this.status       = 'paused';
  this.lastPausedAt = new Date();
};

// Method: resume
studySessionSchema.methods.resume = function() {
  if (this.status !== 'paused') throw new Error('Can only resume a paused session');
  this.status = 'running';
  if (this.lastPausedAt) {
    this.pausedDuration += Math.floor((new Date() - this.lastPausedAt) / 1000);
    this.lastPausedAt    = undefined;
  }
};

// Method: stop
studySessionSchema.methods.stop = function() {
  if (this.status === 'completed' || this.status === 'abandoned') {
    throw new Error('Session is already stopped');
  }
  this.endTime = new Date();
  this.status  = 'completed';
  if (this.lastPausedAt) {
    this.pausedDuration += Math.floor((new Date() - this.lastPausedAt) / 1000);
    this.lastPausedAt    = undefined;
  }
};

// Method: abandon
studySessionSchema.methods.abandon = function() {
  if (this.status === 'completed' || this.status === 'abandoned') {
    throw new Error('Session is already stopped');
  }
  this.endTime = new Date();
  this.status  = 'abandoned';
  if (this.lastPausedAt) {
    this.pausedDuration += Math.floor((new Date() - this.lastPausedAt) / 1000);
    this.lastPausedAt    = undefined;
  }
};

// Static: stats
studySessionSchema.statics.getStats = async function(userId, startDate, endDate) {
  const matchStage = { user: userId, status: 'completed' };

  if (startDate || endDate) {
    matchStage.startTime = {};
    if (startDate) matchStage.startTime.$gte = new Date(startDate);
    if (endDate)   matchStage.startTime.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id:                 null,
        totalSessions:       { $sum: 1 },
        totalDuration:       { $sum: '$duration' },
        totalPausedDuration: { $sum: '$pausedDuration' },
        totalActualDuration: { $sum: { $subtract: ['$duration', '$pausedDuration'] } },
        avgDuration:         { $avg: '$duration' },
        avgActualDuration:   { $avg: { $subtract: ['$duration', '$pausedDuration'] } },
      },
    },
  ]);

  return stats.length > 0 ? stats[0] : {
    totalSessions:       0,
    totalDuration:       0,
    totalPausedDuration: 0,
    totalActualDuration: 0,
    avgDuration:         0,
    avgActualDuration:   0,
  };
};

// Indexes
studySessionSchema.index({ user: 1, startTime: -1 });
studySessionSchema.index({ user: 1, status: 1 });
studySessionSchema.index({ user: 1, subject: 1 });

export default mongoose.model('StudySession', studySessionSchema);