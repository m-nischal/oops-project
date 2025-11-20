// src/lib/otpSenders.js
import nodemailer from "nodemailer";

/**
 * Single shared transporter instance (lazy created).
 * Uses SMTP_* env vars:
 *  - SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 */
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure:
      (process.env.SMTP_SECURE === "true") ||
      Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  return transporter;
}

/**
 * sendEmailOTP - sends a nicely formatted OTP email via the configured SMTP.
 * If SMTP is not configured, falls back to console mock (so local dev still works).
 */
export async function sendEmailOTP(email, code) {
  const t = getTransporter();
  if (!t) {
    console.log(`Mock email to ${email}: OTP ${code}`);
    return true;
  }

  const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f7;">
    <div style="max-width: 520px; margin: auto; background: white; border-radius: 10px; padding: 28px; box-shadow: 0 6px 16px rgba(0,0,0,0.08);">
      <h2 style="text-align: center; color: #222; margin: 0 0 8px; font-size: 20px;">🔐 Your LiveMart Verification Code</h2>

      <p style="font-size: 15px; color: #555; line-height: 1.4; margin-top: 12px;">
        Hi there,
        <br><br>
        Use the One-Time Password (OTP) below to verify your account on <strong>LiveMart</strong>. This code is valid for <strong>10 minutes</strong>.
      </p>

      <div style="text-align: center; margin: 22px 0;">
        <div style="display: inline-block; background: #4CAF50; padding: 14px 28px; border-radius: 8px; font-size: 28px; letter-spacing: 3px; color: white; font-weight: 600;">
          ${code}
        </div>
      </div>

      <p style="font-size: 14px; color: #777; margin-top: 6px;">
        If you did not request this, you can safely ignore this email.
      </p>

      <hr style="margin: 26px 0; border: none; border-top: 1px solid #eee;">

      <p style="text-align: center; font-size: 13px; color: #999;">
        © ${new Date().getFullYear()} LiveMart • All rights reserved.
      </p>
    </div>
  </div>
  `;

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || "LiveMart <no-reply@livemart.com>",
      to: email,
      subject: "Your LiveMart OTP Code",
      text: `Your LiveMart OTP is ${code}. It expires in 10 minutes.`,
      html: htmlTemplate,
    });
    return true;
  } catch (err) {
    console.error("sendEmailOTP failed:", err?.message || err);
    return false;
  }
}
