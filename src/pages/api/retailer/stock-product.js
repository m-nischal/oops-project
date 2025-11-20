// src/pages/api/retailer/stock-product.js
import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product"; //
import { verifyToken } from "../../../lib/auth";   //
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect(); //

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- 1. Real Authentication ---
  let payload;
  try {
    payload = verifyToken(req); //
    if (!payload || payload.role !== "RETAILER") {
      return res.status(401).json({ error: "Unauthorized. You must be a Retailer." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const retailerId = new mongoose.Types.ObjectId(payload.id);

  // --- 2. Get the Wholesaler's Product ID from the request body ---
  try {
    const { wholesaleProductId } = req.body;
    if (!wholesaleProductId) {
      return res.status(400).json({ error: "wholesaleProductId is required" });
    }

    // --- 3. Check if Retailer already stocks this product ---
    const existingListing = await Product.findOne({
      ownerId: retailerId,
      wholesaleSourceId: wholesaleProductId, //
    }).lean();

    if (existingListing) {
      return res.status(409).json({ error: "You already stock this product.", product: existingListing });
    }

    // --- 4. Find the original Wholesaler's product ---
    const wholesalerProduct = await Product.findById(wholesaleProductId).lean();
    if (!wholesalerProduct) {
      return res.status(404).json({ error: "Wholesale product not found" });
    }

    // --- 5. Prepare the new "Retail Listing" (a copy) ---
    // This is the core logic.
    const newRetailerListingData = {
      ...wholesalerProduct, // Copy all details (name, desc, images, etc.)
      
      // --- Key Overrides ---
      ownerId: retailerId, // This product is now owned by the retailer
      wholesaleSourceId: wholesalerProductId, // Link back to the original
      
      // Retailer manages their own stock, so it starts at 0
      // (Retailers place orders with wholesalers)
      sizes: (wholesalerProduct.sizes || []).map(size => ({
        ...size,
        stock: 0, // Retailer must purchase stock from wholesaler later
      })),
      totalStock: 0,
      
      // Retailer can set their own price
      // We'll copy the wholesaler's price as a default
      price: wholesalerProduct.price,
      
      // --- Clear DB-specific fields ---
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      __v: undefined,
    };

    // --- 6. Create the new Product document ---
    const newProduct = await Product.create(newRetailerListingData);
    
    return res.status(201).json({ 
      message: "Product stocked successfully", 
      product: newProduct 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Failed to stock product" });
  }
}