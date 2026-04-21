import mongoose from 'mongoose';

const noteSchema = mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    ref: 'User' 
  },
  title: { 
    type: String, 
    required: true,
    default: 'Untitled Note'
  },
  content: { 
    type: String, 
    required: true 
  },
  subject: { 
    type: String, 
    default: 'General' 
  },
  tags: [{ 
    type: String 
  }],
  color: {
    type: String,
    default: '#ffffff'
  }
}, { timestamps: true });

export default mongoose.model('Note', noteSchema);