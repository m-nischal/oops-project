// src/pages/api/retailer/wholesale-products.js
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product"; //
import User from "../../../models/User";       //
import { verifyToken } from "../../../lib/auth";   //
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect(); //

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- 1. Real Authentication ---
  // Only a Retailer can browse wholesaler products
  let payload;
  try {
    payload = verifyToken(req); //
    if (!payload || payload.role !== "RETAILER") {
      return res.status(401).json({ error: "Unauthorized. You must be a Retailer." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  // --- 2. Fetch All Wholesaler Products ---
  try {
    const { page = 1, limit = 10, q = "" } = req.query;

    // First, find all User IDs that are Wholesalers
    const wholesalers = await User.find({ role: "WHOLESALER" }).select("_id").lean(); //
    const wholesalerIds = wholesalers.map(w => w._id);

    if (wholesalerIds.length === 0) {
      // No wholesalers exist, so no products can be found
      return res.status(200).json({ items: [], total: 0, page: 1, limit: Number(limit) });
    }

    // Now, find all products owned by any of these Wholesalers
    const filter = {
      ownerId: { $in: wholesalerIds }, //
    };
    
    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    const products = await Product.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();
      
    const total = await Product.countDocuments(filter);

    return res.status(200).json({ 
      items: products, 
      total,
      page: Number(page),
      limit: Number(limit),
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch wholesale products" });
  }
}