import { Resend } from 'resend';

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const FROM      = () => process.env.EMAIL_FROM || 'noreply@acadflu.com';

// ── Verification email ─────────────────────────────────────────────────────────
export const sendVerificationEmail = async ({ name, email, verificationUrl, googleAuthUrl = null }) => {
  await getResend().emails.send({
    from:     FROM(),
    to:       email,
    subject:  'Verify your AcadFlu account',
    // ✅ ANTI-SPAM: Plain text version — Gmail/Outlook score emails higher when
    // both HTML and text versions are provided (avoids "suspicious email" flag)
    text: `
Welcome to AcadFlu, ${name}!

Please verify your email address by clicking the link below:
${verificationUrl}

This link expires in 24 hours.

If you didn't create an AcadFlu account, you can safely ignore this email.

— The AcadFlu Team
https://acadflu.com
    `.trim(),
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e2e8f0;padding:40px 32px;border-radius:16px;">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;">⚡</div>
          <h1 style="color:#fff;font-size:22px;margin:0;font-weight:800;">Welcome to AcadFlu, ${name}!</h1>
        </div>

        <!-- Body -->
        <p style="color:#94a3b8;line-height:1.7;margin-bottom:28px;">
          You're almost ready! Click the button below to verify your email address and activate your account.
        </p>

        <!-- Verify button -->
        <div style="text-align:center;margin-bottom:28px;">
          <a href="${verificationUrl}"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Verify Email Address
          </a>
        </div>

        <!-- Fallback link -->
        <p style="color:#475569;font-size:12px;text-align:center;line-height:1.6;margin-bottom:16px;">
          Button not working? Copy and paste this link into your browser:<br/>
          <a href="${verificationUrl}" style="color:#818cf8;word-break:break-all;">${verificationUrl}</a>
        </p>

        <!-- Expiry note -->
        <p style="color:#475569;font-size:12px;text-align:center;line-height:1.6;margin-bottom:${googleAuthUrl ? '28px' : '0'};">
          This link expires in <strong>24 hours</strong>.<br/>
          If you didn't create an AcadFlu account, you can safely ignore this email.
        </p>

        ${googleAuthUrl ? `
        <!-- Divider -->
        <div style="border-top:1px solid #1a2540;margin-bottom:24px;"></div>

        <!-- Google consent suggestion — Gmail users only -->
        <div style="background:#0f1626;border:1px solid #1e3a5f;border-radius:14px;padding:20px 24px;">
          <p style="color:#64748b;font-size:11px;margin:0 0 8px 0;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;">
            💡 One more step — connect Google Calendar
          </p>
          <p style="color:#94a3b8;font-size:13px;line-height:1.7;margin:0 0 18px 0;">
            Since you used a <strong style="color:#cbd5e1;">Gmail address</strong>, you can also connect your
            <strong style="color:#cbd5e1;">Google Calendar</strong> to AcadFlu — so your study sessions,
            goals, and tasks sync automatically. No extra setup needed.
          </p>
          <a href="${googleAuthUrl}"
            style="display:block;background:#ffffff;color:#1e293b;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;text-align:center;box-sizing:border-box;">
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="" width="16" height="16"
              style="vertical-align:middle;margin-right:8px;"
            />
            Connect Google &amp; verify my account
          </a>
          <p style="color:#334155;font-size:11px;text-align:center;margin:10px 0 0 0;line-height:1.6;">
            Clicking this also verifies your email — no need to click both buttons.<br/>
            You can skip Calendar access anytime in Settings.
          </p>
        </div>
        ` : ''}

        <!-- ✅ ANTI-SPAM: Footer with unsubscribe info & physical address -->
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1a2540;text-align:center;">
          <p style="color:#334155;font-size:11px;line-height:1.6;margin:0;">
            You received this email because you signed up for AcadFlu.<br/>
            AcadFlu · Bulacan State University · Malolos, Bulacan, Philippines<br/>
            <a href="${process.env.CLIENT_URL || 'https://acadflu.com'}" style="color:#475569;">acadflu.com</a>
          </p>
        </div>

      </div>
    `,
  });
};

// ── Password reset email ───────────────────────────────────────────────────────
export const sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  await getResend().emails.send({
    from:    FROM(),
    to:      email,
    subject: 'Reset your AcadFlu password',
    // ✅ ANTI-SPAM: Plain text version
    text: `
Hi ${name},

We received a request to reset your AcadFlu password.

Click the link below to set a new password:
${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will not change.

— The AcadFlu Team
https://acadflu.com
    `.trim(),
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#0d1117;color:#e2e8f0;padding:40px 32px;border-radius:16px;">
        <div style="text-align:center;margin-bottom:28px;">
          <div style="width:52px;height:52px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:14px;">🔑</div>
          <h1 style="color:#fff;font-size:22px;margin:0;font-weight:800;">Reset your password</h1>
        </div>
        <p style="color:#94a3b8;line-height:1.7;margin-bottom:8px;">Hi ${name},</p>
        <p style="color:#94a3b8;line-height:1.7;margin-bottom:28px;">
          We received a request to reset your AcadFlu password. Click the button below to set a new one.
        </p>
        <div style="text-align:center;margin-bottom:20px;">
          <a href="${resetUrl}"
            style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
            Reset Password
          </a>
        </div>
        <!-- Fallback link -->
        <p style="color:#475569;font-size:12px;text-align:center;line-height:1.6;margin-bottom:16px;">
          Button not working? Copy and paste this link:<br/>
          <a href="${resetUrl}" style="color:#818cf8;word-break:break-all;">${resetUrl}</a>
        </p>
        <p style="color:#475569;font-size:12px;text-align:center;line-height:1.6;">
          This link expires in <strong>1 hour</strong>.<br/>
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        <!-- Footer -->
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1a2540;text-align:center;">
          <p style="color:#334155;font-size:11px;line-height:1.6;margin:0;">
            AcadFlu · Bulacan State University · Malolos, Bulacan, Philippines<br/>
            <a href="${process.env.CLIENT_URL || 'https://acadflu.com'}" style="color:#475569;">acadflu.com</a>
          </p>
        </div>
      </div>
    `,
  });
};