import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  achievementId: { type: String, required: true },
  xpAwarded:     { type: Number, default: 0 },
  unlockedAt:    { type: Date,   default: Date.now },
}, { timestamps: true });

// Prevent a user from unlocking the same achievement twice
achievementSchema.index({ user: 1, achievementId: 1 }, { unique: true });

export default mongoose.model('Achievement', achievementSchema);