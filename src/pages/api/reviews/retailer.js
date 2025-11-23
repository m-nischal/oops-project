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

  try {
    const retailer = await User.findById(retailerId);
    if (!retailer) return res.status(404).json({ error: "Retailer not found" });

    const userIdStr = String(session.user._id);

    if (!retailer.Feedback) retailer.Feedback = [];

    const existingIndex = retailer.Feedback.findIndex(r => String(r.reviewerId) === userIdStr);

    const feedbackData = {
      reviewerId: session.user._id,
      rating: Number(rating),
      comment,
      author: session.user.name || "Customer",
      createdAt: new Date()
    };

    if (existingIndex > -1) {
        // Overwrite existing feedback
        retailer.Feedback[existingIndex] = feedbackData;
    } else {
        // Add new feedback
        retailer.Feedback.push(feedbackData);
    }

    await retailer.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}