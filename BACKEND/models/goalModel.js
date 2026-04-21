import mongoose from 'mongoose';

const goalSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Please add a goal title']
  },
  subject: {
    type: String,
    default: 'General'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);