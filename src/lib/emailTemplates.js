// lib/emailTemplates.js
export function otpEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 10 }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color: #222; margin-bottom: 6px;">${appName} — Verification Code</h2>
      <p style="color: #555; margin-top: 0;">
        Use the code below to verify your email address. The code expires in ${expiryMinutes} minutes.
      </p>

      <div style="margin: 22px 0; text-align: center;">
        <div style="display:inline-block; padding: 14px 22px; border-radius:8px; background:#f0f4ff;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1a56db;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Team
      </p>
    </div>
  </div>
  `;
}

export function paymentOtpEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 5 }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color: #222; margin-bottom: 6px;">${appName} — Payment Confirmation</h2>
      <p style="color: #555; margin-top: 0;">
        Please use the OTP below to complete your secure payment. Do not share this code with anyone.
      </p>

      <div style="margin: 22px 0; text-align: center;">
        <div style="display:inline-block; padding: 14px 22px; border-radius:8px; background:#fff7ed;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #c2410c;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        This code expires in ${expiryMinutes} minutes.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Security
      </p>
    </div>
  </div>
  `;
}

export function resetPasswordEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 10 }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color:#222; margin-bottom:6px;">${appName} — Password Reset</h2>
      <p style="color:#555; margin-top:0;">
        We received a request to reset the password for your account. Use the code below to continue.
      </p>

      <div style="margin:22px 0; text-align:center;">
        <div style="display:inline-block; padding:14px 22px; border-radius:8px; background:#fff0f0;">
          <span style="font-size:28px; font-weight:700; letter-spacing:6px; color:#d5182a;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        This code is valid for ${expiryMinutes} minutes. If you did not request a password reset, ignore this message.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Team
      </p>
    </div>
  </div>
  `;
}
