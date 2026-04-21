import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    minlength: [1, 'Title cannot be empty'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Task date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:mm format'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:mm format'],
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: false 
  },
  
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  },
  done: {
    type: Boolean,
    default: false,
  },
  googleEventId: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
