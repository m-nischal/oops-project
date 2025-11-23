// src/pages/api/reviews/check.js
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product";
import User from "../../../models/User";
import { getSessionFromReq } from "../../../lib/authHelpers";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") return res.status(405).end();

  const session = await getSessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { type, targetId } = req.query;
  const userId = session.user._id;

  try {
    let existingReview = null;
    
    if (type === 'product') {
       const product = await Product.findById(targetId).select("reviews").lean();
       if (product && Array.isArray(product.reviews)) {
         // Find the specific review by the current user
         existingReview = product.reviews.find(r => String(r.userId) === String(userId));
         // Remove userId for cleaner return
         if (existingReview) delete existingReview.userId;
       }
    } else if (type === 'retailer') {
       const retailer = await User.findById(targetId).select("Feedback").lean();
       if (retailer && Array.isArray(retailer.Feedback)) {
         // Find the specific feedback by the current user
         existingReview = retailer.Feedback.find(r => String(r.reviewerId) === String(userId));
         // Remove reviewerId for cleaner return
         if (existingReview) delete existingReview.reviewerId;
       }
    }

    return res.json({ 
        exists: !!existingReview,
        review: existingReview // Return the full review object if found
    });
  } catch (e) {
    console.error("Review check error:", e);
    return res.status(500).json({ error: e.message });
  }
}