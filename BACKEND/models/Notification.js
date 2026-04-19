import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['goal_deadline', 'goal_milestone', 'achievement', 'badge', 'reminder', 'system'],
      default: 'system',
    },
    icon: {
      type: String,
      default: 'Bell',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Goal', 'Achievement', 'StudySession', null],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
