// src/pages/api/auth/forgot/request.js
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function resetPasswordEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 10 }) {
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

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email || String(email).trim().length === 0) {
    return res.status(400).json({ ok: false, message: "Email required" });
  }

  try {
    const normalized = String(email).toLowerCase().trim();

    // find or create user
    let user = await User.findOne({ email: normalized });
    if (!user) {
      // create a user record with no password (OTP-only account)
      user = new User({ email: normalized });
    }

    // generate OTP and store hashed version + expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = await bcrypt.hash(otp, 10);
    user.resetOtp = hashed;
    user.resetOtpExpiry = Date.now() + OTP_TTL_MS;
    user.resetAttempts = 0;
    await user.save();

    // create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_PORT) === "465", // true for 465, false for 587
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // verify transporter (helpful for debugging)
    try {
      await transporter.verify();
      console.log("SMTP verify OK");
    } catch (verifyErr) {
      console.warn("SMTP verify failed:", verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
      // we continue — dev fallback below will help when SMTP isn't configured
    }

    // build email content
    const subject = "Reset your LiveMart password";
    const html = resetPasswordEmailHtml({ otp, expiryMinutes: 10 });

    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: user.email,
        subject,
        html,
        text: `Your LiveMart password reset code is ${otp}. It expires in 10 minutes.`,
      });

      return res.status(200).json({ ok: true, message: "OTP sent" });
    } catch (mailErr) {
      console.error("Error sending OTP mail:", mailErr && mailErr.stack ? mailErr.stack : mailErr);

      // Dev fallback — return OTP so you can test locally (DO NOT use in production)
      if (process.env.NODE_ENV === "development") {
        console.log(`[DEV OTP] ${user.email} -> ${otp}`);
        return res.status(200).json({ ok: true, message: "OTP (dev) returned", otp });
      }

      return res.status(500).json({ ok: false, message: "Failed to send OTP email" });
    }
  } catch (err) {
    console.error("Forgot/request error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
