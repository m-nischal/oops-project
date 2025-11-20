// pages/api/auth/otp/verify.js
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role || "CUSTOMER", email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  // accept body fields `otp` or `code`
  const { email, password } = req.body || {};
  const providedCode = (req.body && (req.body.otp || req.body.code)) || null;

  if (!email || !providedCode) {
    return res.status(400).json({ ok: false, message: "Email and OTP required" });
  }

  try {
    const user = await User.findOne({ email: String(email).toLowerCase() });

    console.log("OTP verify request for:", email, "providedCode:", providedCode);

    if (!user) {
      return res.status(400).json({ ok: false, message: "Invalid OTP" });
    }

    // Support both shapes: user.otp.code (with expiresAt) or user.resetOtp/resetOtpExpiry
    const storedHash = (user.otp && user.otp.code) || user.resetOtp || null;
    const expiresAt =
      (user.otp && user.otp.expiresAt && new Date(user.otp.expiresAt).getTime()) ||
      (user.resetOtpExpiry && Number(user.resetOtpExpiry)) ||
      null;

    console.log("Stored hash exists:", !!storedHash, "expiresAt:", expiresAt);

    if (!storedHash) {
      return res.status(400).json({ ok: false, message: "Invalid OTP" });
    }

    if (expiresAt && Date.now() > Number(expiresAt)) {
      // clear expired OTP fields
      if (user.otp) user.otp = undefined;
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      user.resetAttempts = undefined;
      await user.save();
      return res.status(400).json({ ok: false, message: "OTP expired" });
    }

    const matches = await bcrypt.compare(String(providedCode).trim(), storedHash);
    if (!matches) {
      // optional attempts counter
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ ok: false, message: "Invalid OTP" });
    }

    // OTP valid: consume it, set verified, optionally set password
    user.verified = true;
    if (user.otp) user.otp = undefined;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetAttempts = undefined;

    if (password && String(password).trim().length > 0) {
      const hashed = await bcrypt.hash(String(password).trim(), 10);
      user.password = hashed;
    }

    await user.save();

    // sign token so frontend can login immediately
    const token = signToken(user);

    return res.status(200).json({ ok: true, message: "OTP verified", token });
  } catch (err) {
    console.error("OTP verify error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}
