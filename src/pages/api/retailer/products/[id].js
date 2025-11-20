// src/pages/api/retailer/products/[id].js
import dbConnect from "../../../../lib/dbConnect";
import Product from "../../../../models/Product";
import { verifyToken } from "../../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  
  const { id: productId } = req.query;

  // 1. Authentication
  let payload;
  try {
    payload = verifyToken(req);
    if (!payload || (payload.role !== "RETAILER" && payload.role !== "WHOLESALER")) {
      return res.status(401).json({ error: "Unauthorized." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id);

  switch (req.method) {
    case 'GET':
      try {
        const product = await Product.findOne({ _id: productId, ownerId: sellerId }).lean();
        if (!product) return res.status(404).json({ error: "Product not found." });
        return res.status(200).json({ product });
      } catch (err) {
        return res.status(500).json({ error: "Failed to fetch product." });
      }

    // --- THIS IS THE UPDATED LOGIC ---
    case 'PUT':
      try {
        const productData = req.body;
        
        // 1. Find the document first
        const product = await Product.findOne({ _id: productId, ownerId: sellerId });
        
        if (!product) {
          return res.status(404).json({ error: "Product not found." });
        }

        // 2. Update fields manually
        // We use Object.assign to update fields, but we be careful not to overwrite _id or ownerId
        delete productData._id;
        delete productData.ownerId;
        Object.assign(product, productData);

        // 3. Recalculate Stock
        if (product.recalculateStock) {
            product.recalculateStock(); // This sums up the sizes to set totalStock
        }

        // 4. Save (This triggers validation and middleware)
        await product.save();
        
        return res.status(200).json({ product });
      } catch (err) {
        console.error(err);
        return res.status(400).json({ error: err.message || "Failed to update product." });
      }
    // --------------------------------

    case 'DELETE':
      try {
        const deletedProduct = await Product.findOneAndDelete({ _id: productId, ownerId: sellerId });
        if (!deletedProduct) return res.status(404).json({ error: "Product not found." });
        return res.status(200).json({ message: "Product deleted successfully." });
      } catch (err) {
        return res.status(500).json({ error: "Failed to delete product." });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}