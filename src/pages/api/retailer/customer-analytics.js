// src/pages/api/retailer/customer-analytics.js
import dbConnect from "../../../lib/dbConnect";
import Order from "../../../models/orderModel"; //
import { verifyToken } from "../../../lib/auth"; //
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- 1. Authentication (Retailer) ---
  let payload;
  try {
    payload = verifyToken(req); //
    if (!payload || (payload.role !== "RETAILER" && payload.role !== "WHOLESALER")) {
      return res.status(401).json({ error: "Unauthorized." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id);

  // --- 2. Get Customer Email from Query ---
  const { customerEmail } = req.query;
  if (!customerEmail) {
    return res.status(400).json({ error: "customerEmail is required." });
  }

  // --- 3. Fetch Analytics for that Customer ---
  try {
    // Find all orders that match BOTH the seller and the customer's email
    const customerOrders = await Order.find({
      sellerId: sellerId,
      "customer.email": customerEmail //
    }).sort({ createdAt: -1 }).limit(50).lean(); // Get last 50 orders

    if (!customerOrders || customerOrders.length === 0) {
      return res.status(404).json({ 
        customerName: "Unknown", 
        totalOrders: 0, 
        totalSpent: 0, 
        orders: [] 
      });
    }

    // Calculate stats
    let totalSpent = 0;
    customerOrders.forEach(order => {
      if (order.status === 'delivered') { // Only count completed orders
        totalSpent += order.total || 0;
      }
    });
    
    const customerName = customerOrders[0].customer.name; // Get name from the most recent order

    return res.status(200).json({
      customerName: customerName,
      totalOrders: customerOrders.length,
      totalSpent: totalSpent,
      orders: customerOrders, // Send the recent orders
    });

  } catch (err) {
    console.error("Failed to fetch customer analytics:", err);
    return res.status(500).json({ error: "Failed to fetch customer analytics" });
  }
}