// src/pages/api/auth/otp/verify.js
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie"; // <--- IMPORT ADDED

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

  const { email, password } = req.body || {};
  const providedCode = (req.body && (req.body.otp || req.body.code)) || null;

  if (!email || !providedCode) {
    return res.status(400).json({ ok: false, message: "Email and OTP required" });
  }

  try {
    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (!user) {
      return res.status(400).json({ ok: false, message: "Invalid OTP" });
    }

    // Support both shapes: user.otp.code or user.resetOtp
    const storedHash = (user.otp && user.otp.code) || user.resetOtp || null;
    const expiresAt =
      (user.otp && user.otp.expiresAt && new Date(user.otp.expiresAt).getTime()) ||
      (user.resetOtpExpiry && Number(user.resetOtpExpiry)) ||
      null;

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

    // sign token
    const token = signToken(user);

    // --- FIX START: Set HTTP-Only Cookie ---
    const maxAgeSeconds = (() => {
        if (!process.env.JWT_EXPIRES_IN) return 7 * 24 * 60 * 60; // Default 7d
        const v = process.env.JWT_EXPIRES_IN;
        const m = v.match(/^(\d+)([dhm])$/);
        if (m) {
          const amount = Number(m[1]);
          if (m[2] === "d") return amount * 24 * 60 * 60;
          if (m[2] === "h") return amount * 60 * 60;
          if (m[2] === "m") return amount * 60;
        }
        const maybeNum = Number(v);
        if (!isNaN(maybeNum)) return maybeNum;
        return 7 * 24 * 60 * 60;
    })();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeSeconds
    };

    res.setHeader("Set-Cookie", cookie.serialize("token", token, cookieOptions));
    // --- FIX END ---

    return res.status(200).json({ ok: true, message: "OTP verified", token });
  } catch (err) {
    console.error("OTP verify error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
}