import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import crypto   from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type:      String,
    required:  [true, 'Name is required'],
    trim:      true,
    minlength: [2,  'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
  },
  password: {
    type:      String,
    minlength: [8, 'Password must be at least 8 characters'],
    select:    false,
  },
  googleId:           { type: String, default: null },
  googleRefreshToken: { type: String, default: null },
  googleAccessToken:  { type: String, default: null },
  googleTokenExpiry:  { type: Date,   default: null },
  avatar:             { type: String, default: null },

  // ✅ NEW: stored sync token for incremental Google Calendar polling
  // Google returns this after each events.list() call — used to fetch only CHANGES
  calendarSyncToken:  { type: String, default: null },

  isVerified:          { type: Boolean, default: false },
  verificationToken:   { type: String },
  verificationExpires: { type: Date   },

  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date   },

}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.createVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return rawToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  return rawToken;
};

export default mongoose.model('User', userSchema);