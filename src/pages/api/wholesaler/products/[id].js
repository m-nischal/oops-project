// src/pages/api/wholesaler/products/[id].js
import dbConnect from "../../../../lib/dbConnect";
import Product from "../../../../models/Product"; //
import { verifyToken } from "../../../../lib/auth"; //
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  
  const { id: productId } = req.query; // Get the product ID from the URL

  // --- 1. Authentication ---
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

  const sellerId = new mongoose.Types.ObjectId(payload.id);

  // --- 2. Handle Different Request Methods ---

  switch (req.method) {
    // --- GET (For the "Edit" page) ---
    case 'GET':
      try {
        const product = await Product.findOne({ _id: productId, ownerId: sellerId }).lean();
        
        if (!product) {
          return res.status(404).json({ error: "Product not found or you do not own this product." });
        }
        
        return res.status(200).json({ product });
      } catch (err) {
        return res.status(500).json({ error: "Failed to fetch product." });
      }

    // --- PUT (For saving "Edit" changes) ---
    case 'PUT':
      try {
        const productData = req.body;
        
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: productId, ownerId: sellerId }, // Condition
          productData, // The new data to set
          { new: true, runValidators: true } // Options: return the new doc
        );

        if (!updatedProduct) {
          return res.status(404).json({ error: "Product not found or you do not own this product." });
        }
        
        return res.status(200).json({ product: updatedProduct });
      } catch (err) {
        return res.status(400).json({ error: err.message || "Failed to update product." });
      }

    // --- DELETE (For the "Delete" button) ---
    case 'DELETE':
      try {
        const deletedProduct = await Product.findOneAndDelete({ 
          _id: productId, 
          ownerId: sellerId 
        });

        if (!deletedProduct) {
          return res.status(404).json({ error: "Product not found or you do not own this product." });
        }
        
        return res.status(200).json({ message: "Product deleted successfully." });
      } catch (err) {
        return res.status(500).json({ error: "Failed to delete product." });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}