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
  googleId: { type: String, default: null },
  avatar:   { type: String, default: null },

  isVerified:          { type: Boolean, default: false },
  verificationToken:   { type: String },
  verificationExpires: { type: Date   },

  resetPasswordToken:   { type: String }, // ← ADDED
  resetPasswordExpires: { type: Date   }, // ← ADDED

}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hashed
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Generate email verification token
userSchema.methods.createVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 h
  return rawToken;
};

// Generate password reset token ← ADDED
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 h
  return rawToken;
};

export default mongoose.model('User', userSchema);