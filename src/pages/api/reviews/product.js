// src/pages/api/reviews/product.js
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product";
import { getSessionFromReq } from "../../../lib/authHelpers";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).end();

  const session = await getSessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { productId, rating, comment } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const userIdStr = String(session.user._id);
    
    // Check if review exists
    const existingIndex = product.reviews.findIndex(r => String(r.userId) === userIdStr);

    const reviewData = {
      userId: session.user._id,
      rating: Number(rating),
      comment,
      author: session.user.name || "Customer",
      createdAt: new Date() // Update timestamp
    };

    if (existingIndex > -1) {
       // Overwrite existing review
       product.reviews[existingIndex] = reviewData;
    } else {
       // Add new review
       product.reviews.push(reviewData);
    }

    await product.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}