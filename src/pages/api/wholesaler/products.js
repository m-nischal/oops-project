// src/pages/api/wholesaler/products.js
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product"; //
import { verifyToken } from "../../../lib/auth"; //
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  // --- 1. Real Authentication ---
  let payload;
  try {
    payload = verifyToken(req); //
    
    // --- THIS IS THE ONLY CHANGE ---
    // We now check for the 'WHOLESALER' role
    if (!payload || (payload.role !== "WHOLESALER")) {
      return res.status(401).json({ error: "Unauthorized. You must be a Wholesaler." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id); // Get the logged-in seller's ID

  // --- 2. Handle GET request for the "All Products" grid ---
  if (req.method === "GET") {
    try {
      const { page = 1, limit = 10, q = "" } = req.query;

      const filter = {
        ownerId: sellerId, //
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
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  // --- 3. Handle POST request from the "Add New Product" form ---
  if (req.method === "POST") {
    try {
      const productData = req.body;

      // Force the ownerId to be the logged-in seller
      productData.ownerId = sellerId; //
      
      // Wholesalers always create "Base Products"
      productData.wholesaleSourceId = null; //

      const newProduct = await Product.create(productData);
      
      return res.status(201).json({ product: newProduct });

    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err.message || "Failed to create product" });
    }
  }

  // Handle other methods
  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}