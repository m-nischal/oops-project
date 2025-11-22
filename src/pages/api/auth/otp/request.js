// src/pages/api/auth/otp/request.js
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { otpEmailHtml } from "../../../../lib/emailTemplates";

const OTP_TTL_MS = 10 * 60 * 1000;

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  const { email, role, isRegister } = req.body || {};
  if (!email) return res.status(400).json({ ok: false, message: "Email required" });

  try {
    // generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // hash for storage
    const hash = await bcrypt.hash(otp, 10);

    // find or create user
    let user = await User.findOne({ email: String(email).toLowerCase() });
    
    // --- LOGIC VERIFICATION: CHECK EXISTING USER ---
    if (isRegister && user && user.verified) {
        // If this is a registration attempt and the user exists + is verified
        return res.status(409).json({ 
            ok: false, 
            message: "Account already exists. Please log in instead." 
        });
    }
    // -----------------------------------------------

    if (!user) {
      user = new User({ email: String(email).toLowerCase(), role: role || "CUSTOMER" });
    }

    user.otp = { code: hash, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
    await user.save();

    // send email — adjust transporter to your SMTP envs
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_PORT) === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

        // Subject + html
    const subject = "Your LiveMart verification code";
    const html = otpEmailHtml({ otp, expiryMinutes: 10, appName: "LiveMart" });

    // send
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: user.email,
      subject,
      html,
      // optionally include text fallback
      text: `Your LiveMart verification code is ${otp}. It expires in 10 minutes.`
    });
    
    return res.status(200).json({ ok: true, message: "OTP sent" });
  } catch (err) {
    console.error("OTP request error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}