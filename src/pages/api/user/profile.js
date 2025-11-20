// src/pages/api/user/profile.js
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import { verifyToken } from "../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  // 1. Authentication: Extract payload (user ID, role)
  let payload;
  try {
    payload = verifyToken(req);
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const userId = new mongoose.Types.ObjectId(payload.id);

  // GET: Fetch user profile (Selecting 'phone' field)
  if (req.method === "GET") {
    try {
      const user = await User.findById(userId).select("name email role addresses phone").lean();
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      return res.status(200).json({ user });
    } catch (err) {
      console.error("GET /api/user/profile error:", err);
      return res.status(500).json({ error: "Failed to fetch profile." });
    }
  }

  // PUT: Update user profile (name, addresses, phone)
  if (req.method === "PUT") {
    try {
      const { name, addresses, phone } = req.body;
      
      const updateFields = {};
      if (name !== undefined) updateFields.name = String(name).trim();
      // Added phone to update fields
      if (phone !== undefined) updateFields.phone = String(phone).trim(); 

      if (addresses !== undefined && Array.isArray(addresses)) {
        updateFields.addresses = addresses;
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, runValidators: true }
      ).select("name email role addresses phone").lean(); // Select phone on return

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found." });
      }
      
      return res.status(200).json({ user: updatedUser });
    } catch (err) {
      console.error("PUT /api/user/profile error:", err);
      return res.status(400).json({ error: err.message || "Failed to update profile." });
    }
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}