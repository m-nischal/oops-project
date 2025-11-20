// src/pages/api/auth/set-password.js
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: "Missing token" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ ok: false, message: "Server misconfigured" });

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (err) {
    return res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }

  const { password } = req.body || {};
  if (!password || password.length < 6) {
    return res.status(400).json({ ok: false, message: "Password is required (min 6 chars)" });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(404).json({ ok: false, message: "User not found" });

  // Hash & set password, mark verified (already true from OTP verify, but ensure)
  const hashed = await bcrypt.hash(password, 10);
  user.password = hashed;
  user.verified = true;
  await user.save();

  return res.json({ ok: true, message: "Password set" });
}
