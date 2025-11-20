// src/pages/api/inventory/[productId].js
import dbConnect from "lib/dbConnect.js";
import ProductModel from "models/Product.js";

/**
 * GET /api/inventory/:productId
 * Returns sizes and stock for a product
 * Public for now — restrict to admin if necessary.
 */
export default async function handler(req, res) {
  try { await dbConnect(); } catch (err) {
    console.error("DB connect failed:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }

  const { productId } = req.query;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const doc = await ProductModel.findById(productId, { sizes: 1, name: 1 }).lean();
    if (!doc) return res.status(404).json({ error: "Product not found" });
    return res.status(200).json({ productId: doc._id, name: doc.name, sizes: doc.sizes || [] });
  } catch (err) {
    console.error("GET /api/inventory/[productId] error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch inventory" });
  }
}
