// src/pages/api/retailer/analytics.js
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

  // --- 1. Authentication ---
  let payload;
  try {
    payload = verifyToken(req);
    if (!payload || payload.role !== "RETAILER") {
      return res
        .status(401)
        .json({ error: "Unauthorized. You must be a Retailer." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id);

  // --- 2. Fetch Dashboard Analytics (FIXED CANCELLED COUNT) ---
  try {
    const allOrders = await Order.find({ sellerId: sellerId }).lean(); 

    let totalSales = 0;
    let activeOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0; // ADDED: New counter for cancelled orders

    for (const order of allOrders) {
      if (order.status === "delivered") {
        completedOrders++;
        totalSales += order.total || 0;
      } else if (order.status === "cancelled" || order.status === "refunded") {
        // ADDED LOGIC: Explicitly count cancelled/refunded orders
        cancelledOrders++;
      } else {
        // All other statuses (ordered, processing, shipped, etc.) are "Active"
        activeOrders++;
      }
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const salesData = await Order.aggregate([
      {
        $match: {
          sellerId: sellerId,
          status: "delivered",
          createdAt: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedSalesGraph = salesData.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      sales: item.totalRevenue,
    }));

    return res.status(200).json({
      stats: {
        totalSales: totalSales,
        totalOrders: allOrders.length,
        activeOrders: activeOrders,
        completedOrders: completedOrders,
        cancelledOrders: cancelledOrders, // ADDED: Include the new counter
      },
      saleGraph: formattedSalesGraph,
    });
  } catch (err) {
    console.error("Failed to fetch analytics:", err);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
}