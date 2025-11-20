// src/pages/api/wholesaler/analytics.js
import dbConnect from "../../../lib/dbConnect";
import Order from "../../../models/orderModel";
import { verifyToken } from "../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  // 1. Connect to DB
  try {
    await dbConnect();
  } catch (error) {
    console.error("Database connection failed:", error);
    return res.status(500).json({ error: "Database connection failed" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let sellerId;

  // 2. Authentication (Wholesaler Only)
  try {
    const payload = verifyToken(req);
    if (!payload || payload.role !== "WHOLESALER") {
      return res.status(401).json({ error: "Unauthorized. You must be a Wholesaler." });
    }
    sellerId = new mongoose.Types.ObjectId(payload.id);
  } catch (err) {
    console.error("Auth failed:", err.message);
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  // 3. Fetch Analytics
  try {
    // Fetch all orders for this wholesaler
    const allOrders = await Order.find({ sellerId: sellerId }).lean();
    
    // Initialize counters
    let totalSales = 0;
    let activeOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0; // New metric

    // Calculate stats
    for (const order of allOrders) {
      if (order.status === 'delivered') {
        completedOrders++;
        totalSales += order.total || 0;
      } else if (order.status === 'cancelled' || order.status === 'refunded') {
        cancelledOrders++;
      } else {
        // All other statuses (pending, shipped, etc.) are "Active"
        activeOrders++;
      }
    }

    // Calculate Sales Graph (Last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const salesData = await Order.aggregate([
      {
        $match: {
          sellerId: sellerId,
          status: 'delivered',
          createdAt: { $gte: oneYearAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalRevenue: { $sum: "$total" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const formattedSalesGraph = salesData.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      sales: item.totalRevenue
    }));

    // Return complete data
    return res.status(200).json({
      stats: {
        totalSales,
        totalOrders: allOrders.length,
        activeOrders,
        completedOrders,
        cancelledOrders // Include this so the dashboard adds up
      },
      saleGraph: formattedSalesGraph
    });

  } catch (err) {
    console.error("CRITICAL ANALYTICS ERROR:", err);
    return res.status(500).json({ error: "Server error: " + err.message });
  }
}