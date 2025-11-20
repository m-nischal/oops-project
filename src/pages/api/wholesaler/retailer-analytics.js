// src/pages/api/wholesaler/retailer-analytics.js
import dbConnect from "../../../lib/dbConnect";
import Order from "../../../models/orderModel";
import { verifyToken } from "../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- 1. Authentication (Wholesaler) ---
  let payload;
  try {
    payload = verifyToken(req); //
    if (!payload || payload.role !== "WHOLESALER") {
      return res.status(401).json({ error: "Unauthorized. You must be a Wholesaler." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id);

  // --- 2. Get Retailer Email from Query ---
  // In the wholesaler's order list, the "Customer" is actually the Retailer.
  const { retailerEmail } = req.query;
  if (!retailerEmail) {
    return res.status(400).json({ error: "retailerEmail is required." });
  }

  // --- 3. Fetch Analytics ---
  try {
    const retailerOrders = await Order.find({
      sellerId: sellerId,
      "customer.email": retailerEmail //
    }).sort({ createdAt: -1 }).limit(50).lean();

    if (!retailerOrders || retailerOrders.length === 0) {
      return res.status(404).json({ 
        retailerName: "Unknown", 
        totalOrders: 0, 
        totalSpent: 0, 
        orders: [] 
      });
    }

    // Calculate stats
    let totalSpent = 0;
    retailerOrders.forEach(order => {
      if (order.status === 'delivered') {
        totalSpent += order.total || 0;
      }
    });
    
    const retailerName = retailerOrders[0].customer.name;

    return res.status(200).json({
      retailerName: retailerName,
      totalOrders: retailerOrders.length,
      totalSpent: totalSpent,
      orders: retailerOrders,
    });

  } catch (err) {
    console.error("Failed to fetch retailer analytics:", err);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
}