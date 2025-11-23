// src/pages/api/products/similar.js
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product";
import CatalogService from "../../../services/catalogService";
import mongoose from "mongoose";
import User from "../../../models/User"; // FIX: ADDED MISSING IMPORT

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { productId, tags = "" } = req.query;
  // Ensure tags is an array of strings, handling comma-separated input
  const tagList = Array.isArray(tags) 
    ? tags 
    : String(tags).split(',').map(t => t.trim()).filter(t => t.length > 0);

  // productId is optional for recommendation systems but helpful for exclusion
  const validProductId = productId && mongoose.isValidObjectId(productId);

  if (tagList.length === 0) {
      return res.status(200).json({ items: [], message: "No tags provided to find similar products." });
  }

  try {
    const filter = {
      isPublished: true,
      tags: { $in: tagList } // Find products that match any of the tags
    };

    if (validProductId) {
        filter._id = { $ne: productId }; // Exclude the current product if an ID is provided
    }
    
    // --- Exclude Wholesaler Products (Retailer products only for customer view) ---
    const wholesalers = await User.find({ role: "WHOLESALER" }).select("_id").lean();
    const wholesalerIds = wholesalers.map(u => u._id);
    if (wholesalerIds.length > 0) {
        filter.ownerId = { $nin: wholesalerIds };
    }
    // ----------------------------------------------------------------------------


    // Using CatalogService ensures stock computation
    const products = await CatalogService.getProducts(filter, { 
      lean: true, 
      limit: 20, // Fetch more than needed so filtering/sorting by match score works in component
      sort: { createdAt: -1 } 
    });

    return res.status(200).json({ items: products });

  } catch (err) {
    console.error("GET /api/products/similar error:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch similar products" });
  }
}