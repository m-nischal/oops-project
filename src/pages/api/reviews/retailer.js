// src/pages/api/reviews/retailer.js
import dbConnect from "../../../lib/dbConnect";
import User from "../../../models/User";
import { getSessionFromReq } from "../../../lib/authHelpers";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).end();

  const session = await getSessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { retailerId, rating, comment } = req.body;
  const numericRating = Number(rating);

  try {
    const retailer = await User.findById(retailerId);
    if (!retailer) return res.status(404).json({ error: "Retailer not found" });

    const userIdStr = String(session.user._id);

    if (!retailer.Feedback) retailer.Feedback = [];

    const existingIndex = retailer.Feedback.findIndex(r => String(r.reviewerId) === userIdStr);

    // --- CRITICAL FIX START: Handle Deletion (rating: 0) ---
    if (existingIndex > -1 && numericRating === 0 && comment === "") {
        // If review exists AND payload signifies deletion (rating 0, empty comment)
        retailer.Feedback.splice(existingIndex, 1);
        await retailer.save();
        return res.status(200).json({ success: true, message: "Review deleted" });
    }
    // --- CRITICAL FIX END ---

    const feedbackData = {
      reviewerId: session.user._id,
      rating: numericRating,
      comment,
      author: session.user.name || "Customer",
      createdAt: new Date()
    };

    // Handle Update or Creation
    if (existingIndex > -1) {
        // Overwrite existing feedback
        retailer.Feedback[existingIndex] = feedbackData;
    } else {
        // Add new feedback
        retailer.Feedback.push(feedbackData);
    }

    await retailer.save();

    return res.status(200).json({ success: true, message: "Review saved/updated" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}