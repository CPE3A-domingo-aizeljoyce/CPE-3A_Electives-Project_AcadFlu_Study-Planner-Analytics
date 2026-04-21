import mongoose from 'mongoose';

const studySessionSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  subject: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  source: { type: String, default: 'timer' } 
}, { timestamps: true });

export default mongoose.model('StudySession', studySessionSchema);