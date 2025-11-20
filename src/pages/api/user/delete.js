// src/pages/api/user/delete.js
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import { verifyToken } from "../../../lib/auth";
import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // <--- ADDED

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body || {}; // <--- ADDED: Get credentials from body
  
  if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required for verification." });
  }

  // 1. Authentication (Token check for context)
  let payload;
  try {
    payload = verifyToken(req);
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const userId = new mongoose.Types.ObjectId(payload.id);
  
  // 2. Re-authentication (Verify provided email/password matches the authenticated user)
  try {
    // Find user by ID first
    const user = await User.findById(userId).select("+password"); 

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    // Check if provided email matches the authenticated user's email
    if (user.email !== String(email).toLowerCase().trim()) {
        return res.status(401).json({ error: "Invalid credentials." });
    }
    
    // Check if password matches
    if (!user.password || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // 3. Delete the User
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found after verification." });
    }

    return res.status(200).json({ 
        message: "Account deleted successfully.", 
        userId: deletedUser._id 
    });
  } catch (err) {
    console.error("DELETE /api/user/delete error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete account." });
  }
}