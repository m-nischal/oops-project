// src/pages/api/auth/change-password.js
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import { verifyToken } from "../../../../lib/auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. Authenticate User
  let payload;
  try {
    payload = verifyToken(req);
    if (!payload) throw new Error("No payload");
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  const userId = new mongoose.Types.ObjectId(payload.id);
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords are required." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  try {
    // 2. Fetch User with Password
    const user = await User.findById(userId).select("+password");
    if (!user) return res.status(404).json({ error: "User not found." });

    // 3. Verify Current Password
    // If user has no password set (e.g. Google login only), handle appropriately or force set-password flow.
    // Assuming standard flow here:
    if (!user.password) {
        return res.status(400).json({ error: "No password set for this account. Try 'Forgot Password' instead." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password." });
    }

    // 4. Hash and Save New Password
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully." });

  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
}