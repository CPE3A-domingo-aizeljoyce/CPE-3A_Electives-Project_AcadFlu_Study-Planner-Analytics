import crypto from 'crypto';
import User              from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { sendVerificationEmail } from '../utils/sendEmail.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const safeUser = (user) => ({
  id:         user._id,
  name:       user.name,
  email:      user.email,
  avatar:     user.avatar,
  isVerified: user.isVerified,
});

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // Basic field check
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    name  = name.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    email = email.trim().toLowerCase();

    // Email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address.' });

    // Password strength
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return res.status(400).json({ message: 'Password must include uppercase, lowercase, and a number.' });

    // Check if account already exists
    const existing = await User.findOne({ email });
    if (existing) {
      if (!existing.isVerified) {
        // Resend verification email
        const rawToken = existing.createVerificationToken();
        await existing.save();
        const url = `${process.env.SERVER_URL}/api/auth/verify-email?token=${rawToken}`;
        await sendVerificationEmail({
          name:            existing.name,
          email:           existing.email,
          verificationUrl: url,
        });
        return res.status(200).json({
          message:              'Account already exists but is not verified. We sent a new verification email.',
          requiresVerification: true,
        });
      }
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Create user
    const user     = await User.create({ name, email, password });
    const rawToken = user.createVerificationToken();
    await user.save();

    // Send verification email
    const url = `${process.env.SERVER_URL}/api/auth/verify-email?token=${rawToken}`;
    await sendVerificationEmail({
      name:            user.name,
      email:           user.email,
      verificationUrl: url,
    });

    res.status(201).json({
      message:              'Account created! Please check your email to verify your account.',
      requiresVerification: true,
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    email = email.trim().toLowerCase();

    // Find user and include password field (select: false by default)
    const user = await User.findOne({ email }).select('+password');

    // Generic message — don't reveal whether email exists
    if (!user || !user.password)
      return res.status(401).json({ message: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid email or password.' });

    if (!user.isVerified)
      return res.status(403).json({
        message:              'Please verify your email before logging in. Check your inbox.',
        requiresVerification: true,
      });

    const token = generateToken(user._id);
    res.status(200).json({ token, user: safeUser(user) });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ── GET /api/auth/verify-email?token=xxx ─────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token)
      return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_token`);

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken:   hashed,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_token`);

    user.isVerified          = true;
    user.verificationToken   = undefined;
    user.verificationExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);

    // Redirect to frontend — auto logs the user in
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${jwtToken}&verified=true`);

  } catch (err) {
    console.error('Verify email error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Frontend sends access_token from useGoogleLogin hook
export const googleAuth = async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token)
      return res.status(400).json({ message: 'Google access token is required.' });

    // Verify token by fetching user profile from Google
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!googleRes.ok)
      return res.status(401).json({ message: 'Invalid Google token. Please try again.' });

    const { sub: googleId, email, name, picture } = await googleRes.json();

    if (!email)
      return res.status(400).json({ message: 'Could not retrieve email from Google account.' });

    // Find or create user
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if email already registered with email/password
      user = await User.findOne({ email });

      if (user) {
        // Link Google to existing account
        user.googleId   = googleId;
        user.avatar     = user.avatar || picture;
        user.isVerified = true;
        await user.save();
      } else {
        // Brand new user via Google
        user = await User.create({
          name,
          email,
          googleId,
          avatar:     picture,
          isVerified: true, // Google accounts are pre-verified
        });
      }
    }

    const token = generateToken(user._id);
    res.status(200).json({ token, user: safeUser(user) });

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ message: 'Google sign-in failed. Please try again.' });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ user: safeUser(user) });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};