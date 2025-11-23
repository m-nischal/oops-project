import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { otpEmailHtml } from "../../../../lib/emailTemplates";

const OTP_TTL_MS = 10 * 60 * 1000;

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  // FIX: Destructure 'name' from body
  const { email, role, isRegister, name } = req.body || {};
  
  if (!email) return res.status(400).json({ ok: false, message: "Email required" });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = await bcrypt.hash(otp, 10);

    let user = await User.findOne({ email: String(email).toLowerCase() });
    
    if (isRegister && user && user.verified) {
        return res.status(409).json({ 
            ok: false, 
            message: "Account already exists. Please log in instead." 
        });
    }

    if (!user) {
      // FIX: Save the name when creating the user
      user = new User({ 
          email: String(email).toLowerCase(), 
          role: role || "CUSTOMER",
          name: name || "" 
      });
    } else if (name && !user.name) {
        // Optional: Update name if it was missing
        user.name = name;
    }

    user.otp = { code: hash, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_PORT) === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    const subject = "Your LiveMart verification code";
    const html = otpEmailHtml({ otp, expiryMinutes: 10, appName: "LiveMart" });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: user.email,
      subject,
      html,
      text: `Your LiveMart verification code is ${otp}. It expires in 10 minutes.`
    });
    
    return res.status(200).json({ ok: true, message: "OTP sent" });
  } catch (err) {
    console.error("OTP request error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}