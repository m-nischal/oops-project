// src/pages/api/public/user/[id].js
import dbConnect from "../../../../lib/dbConnect";
import User from "../../../../models/User";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    // UPDATED: Select email, phone, and Feedback fields
    const user = await User.findById(id)
      .select("name role Feedback email phone")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User/Retailer not found." });
    }

    const totalReviews = user.Feedback?.length || 0;
    let averageRating = 0;

    if (totalReviews > 0) {
      const totalSum = user.Feedback.reduce(
        (sum, feedback) => sum + (feedback.rating || 0),
        0
      );
      averageRating = (totalSum / totalReviews).toFixed(1);
    }

    // NEW: Sanitize Feedback to remove internal IDs
    const sanitizedFeedback = (user.Feedback || []).map(f => {
        // We keep author, rating, comment, createdAt
        const { reviewerId, ...rest } = f;
        return rest;
    });

    return res.status(200).json({
      name: user.name,
      role: user.role,
      rating: parseFloat(averageRating),
      reviewCount: totalReviews,
      email: user.email,
      phone: user.phone,
      // ADDED RAW FEEDBACK HERE
      feedback: sanitizedFeedback,
    });
  } catch (err) {
    console.error("GET /api/public/user/[id] error:", err);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
}