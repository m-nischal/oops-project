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
    let exists = false;
    
    if (type === 'product') {
       const product = await Product.findById(targetId).select("reviews").lean();
       if (product && Array.isArray(product.reviews)) {
         exists = product.reviews.some(r => String(r.userId) === String(userId));
       }
    } else if (type === 'retailer') {
       const retailer = await User.findById(targetId).select("Feedback").lean();
       if (retailer && Array.isArray(retailer.Feedback)) {
         exists = retailer.Feedback.some(r => String(r.reviewerId) === String(userId));
       }
    }

    return res.json({ exists });
  } catch (e) {
    console.error("Review check error:", e);
    return res.status(500).json({ error: e.message });
  }
}
