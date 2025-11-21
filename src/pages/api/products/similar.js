// src/pages/api/products/similar.js
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product";
import CatalogService from "../../../services/catalogService";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { productId, tags = "" } = req.query;
  const tagList = Array.isArray(tags) ? tags : String(tags).split(',').filter(t => t.trim().length > 0);

  if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "Valid productId is required." });
  }

  if (tagList.length === 0) {
      return res.status(200).json({ items: [], message: "No tags provided to find similar products." });
  }

  try {
    const filter = {
      _id: { $ne: productId }, // Exclude the current product
      isPublished: true,
      tags: { $in: tagList } // Find products that match any of the tags
    };

    // Prioritize products that share more tags (This requires aggregation, which is complex. 
    // We will use standard find/sort and rely on the client to get the best matches first.)
    
    // Using CatalogService ensures stock computation
    const products = await CatalogService.getProducts(filter, { 
      lean: true, 
      limit: 4, // Limit to 4 for the section display
      sort: { createdAt: -1 } 
    });

    return res.status(200).json({ items: products });

  } catch (err) {
    console.error("GET /api/products/similar error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch similar products" });
  }
}