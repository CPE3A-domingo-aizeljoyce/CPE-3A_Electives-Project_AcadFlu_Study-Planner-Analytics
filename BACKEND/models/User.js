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

  isVerified:          { type: Boolean, default: false },
  verificationToken:   { type: String },
  verificationExpires: { type: Date   },

  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date   },

}, { timestamps: true });

// ─── Hash password before saving ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Compare plain password with hashed ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ─── Generate email verification token ───────────────────────────────────────
userSchema.methods.createVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 h
  return rawToken;
};

// ─── Generate password reset token ───────────────────────────────────────────
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken   = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 h
  return rawToken;
};

// ─── CASCADE DELETE ───────────────────────────────────────────────────────────
// Triggers automatically whenever User.findByIdAndDelete() or
// User.findOneAndDelete() is called.
//
// Uses mongoose.model() instead of imports to avoid circular dependency issues.
// All models are already registered by the time this hook fires because
// server.js loads all routes (which load all models) at startup.
//
// To add a new collection later, just add one more line inside Promise.all.
// ─────────────────────────────────────────────────────────────────────────────
userSchema.post('findOneAndDelete', async function (doc) {
  if (!doc) return;

  const userId = doc._id;

  try {
    // ── Confirmed active models ──────────────────────────────────────────────
    const StudySession = mongoose.model('StudySession');
    const Task         = mongoose.model('Task');
    const Goal         = mongoose.model('Goal');
    const Notification = mongoose.model('Notification');

    await Promise.all([
      StudySession.deleteMany({ user: userId }),
      Task        .deleteMany({ user: userId }),
      Goal        .deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
    ]);

    // ── Uncomment below once Note / UserSettings / Achievement are implemented
    // const Note         = mongoose.model('Note');
    // const UserSettings = mongoose.model('UserSettings');
    // const Achievement  = mongoose.model('Achievement');
    // await Promise.all([
    //   Note        .deleteMany({ user: userId }),
    //   UserSettings.deleteMany({ user: userId }),
    //   Achievement .deleteMany({ user: userId }),
    // ]);

    console.log(`[Cascade] Deleted all data for user ${userId}`);
  } catch (err) {
    // Non-fatal: log the error but don't crash the delete operation
    console.error(`[Cascade] Failed to delete data for user ${userId}:`, err.message);
  }
});

export default mongoose.model('User', userSchema);