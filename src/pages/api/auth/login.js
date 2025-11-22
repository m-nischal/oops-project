// pages/api/auth/login.js
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { signToken, getJwtMaxAgeSeconds } from "../../../lib/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";


export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, message: "Email and password required" });

  const normalizedEmail = String(email).toLowerCase().trim();
  try {
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({ ok: false, message: "No password set for this account. Please use OTP login." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const token = signToken(user);

    // Set HttpOnly cookie named "token"
    // cookie expiry aligned with JWT expiry (approx)
    const maxAgeSeconds = getJwtMaxAgeSeconds();


    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: maxAgeSeconds
    };

    res.setHeader("Set-Cookie", cookie.serialize("token", token, cookieOptions));

    // Keep the same JSON response for backward compatibility (token included)
    return res.status(200).json({ ok: true, token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, message: "Server error during login" });
  }
}