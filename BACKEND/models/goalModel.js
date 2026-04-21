import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' 
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String, 
    required: true
  },
  timeframe: {
    type: String, 
    required: true
  },
  targetAmount: {
    type: Number, 
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0 
  },
  unit: {
    type: String, 
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  color: {
    type: String
  }
}, {
  timestamps: true 
});

export default mongoose.model('Goal', goalSchema);