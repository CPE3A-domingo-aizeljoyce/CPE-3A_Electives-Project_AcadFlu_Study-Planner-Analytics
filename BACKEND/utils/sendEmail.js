import nodemailer from 'nodemailer';

// Using explicit SMTP settings instead of service:'gmail'
// service:'gmail' forces port 465 (SSL) which many networks/ISPs block.
// Port 587 (STARTTLS) works universally.
const createTransporter = () =>
  nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,   // false = STARTTLS on 587 (NOT plain text)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ── Verification email ────────────────────────────────────────────────────────
export const sendVerificationEmail = async ({ name, email, verificationUrl }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from:    `"StudyFlow" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Verify your StudyFlow account',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e2e8f0;padding:40px 32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;">⚡</div>
          <h1 style="color:#fff;font-size:22px;margin:0;font-weight:800;">Welcome to StudyFlow, ${name}!</h1>
        </div>
        <p style="color:#94a3b8;line-height:1.7;margin-bottom:28px;">
          You're almost ready! Click the button below to verify your email address and activate your account.
        </p>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${verificationUrl}"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color:#475569;font-size:12px;text-align:center;line-height:1.6;">
          This link expires in <strong>24 hours</strong>.<br/>
          If you didn't create a StudyFlow account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

// ── Password reset email ──────────────────────────────────────────────────────
export const sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from:    `"StudyFlow" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: 'Reset your StudyFlow password',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e2e8f0;padding:40px 32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;">🔑</div>
          <h1 style="color:#fff;font-size:22px;margin:0;font-weight:800;">Reset your password</h1>
        </div>
        <p style="color:#94a3b8;line-height:1.7;margin-bottom:8px;">Hi ${name},</p>
        <p style="color:#94a3b8;line-height:1.7;margin-bottom:28px;">
          We received a request to reset your StudyFlow password. Click the button below to set a new one.
        </p>
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${resetUrl}"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color:#475569;font-size:12px;text-align:center;line-height:1.6;">
          This link expires in <strong>1 hour</strong>.<br/>
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};