// src/pages/api/wholesaler/orders/[id].js
import dbConnect from "../../../../lib/dbConnect";
import Order from "../../../../models/orderModel";
import OrderService from "../../../../services/orderService";
import { verifyToken } from "../../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  
  const { id: orderId } = req.query;

  // --- 1. Authentication (Wholesaler) ---
  let payload;
  try {
    payload = verifyToken(req);
    if (!payload || payload.role !== "WHOLESALER") {
      return res.status(401).json({ error: "Unauthorized. You must be a Wholesaler." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id);

  // --- 2. Handle PATCH Request ---
  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "New 'status' is required." });

      // Security Check: Ensure order belongs to this wholesaler
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ error: "Order not found." });

      if (order.sellerId.toString() !== sellerId.toString()) {
        return res.status(403).json({ error: "Forbidden. You do not own this order." });
      }

      // Update status using service (handles stock restoration if cancelled)
      const updatedOrder = await OrderService.updateStatus(orderId, status, { restoreStock: (status === 'cancelled') });
      
      return res.status(200).json({ order: updatedOrder });
    } catch (err) {
      console.error(err);
      return res.status(400).json({ error: err.message || "Failed to update order status." });
    }
  }

  res.setHeader('Allow', ['PATCH']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}   