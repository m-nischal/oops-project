// src/pages/api/auth/forgot/verify.js
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ ok: false, message: "Missing fields" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ ok: false, message: "Invalid or expired OTP" });
    }

    // check expiry
    if (Date.now() > user.resetOtpExpiry) {
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      user.resetAttempts = undefined;
      await user.save();
      return res.status(400).json({ ok: false, message: "OTP expired" });
    }

    // optional attempts check
    user.resetAttempts = (user.resetAttempts || 0) + 1;
    if (user.resetAttempts > 10) {
      await user.save();
      return res.status(429).json({ ok: false, message: "Too many attempts. Try again later." });
    }

    const otpMatches = await bcrypt.compare(String(otp), user.resetOtp);
    if (!otpMatches) {
      await user.save();
      return res.status(400).json({ ok: false, message: "Invalid OTP" });
    }

    // OTP valid -> set new password
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetAttempts = undefined;
    // optionally mark verified
    user.verified = true;
    await user.save();

    return res.status(200).json({ ok: true, message: "Password updated. Please login." });
  } catch (err) {
    console.error("forgot verify error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
