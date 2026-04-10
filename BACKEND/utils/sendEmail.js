import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendVerificationEmail = async ({ name, email, verificationUrl }) => {
  const transporter = createTransporter();

  // Verify connection before sending
  await transporter.verify();

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM,
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