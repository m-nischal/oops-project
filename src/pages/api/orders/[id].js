// src/pages/api/orders/[id].js
import dbConnect from "../../../lib/dbConnect";
import OrderService from "../../../services/orderService";
import { getSessionFromReq } from "../../../lib/authHelpers"; // Import auth helper
import mongoose from "mongoose"; // Import mongoose

/**
 * GET  /api/orders/:id    -> returns order
 * PATCH /api/orders/:id  -> update status, small edits
 */
export default async function handler(req, res) {
  try {
    await dbConnect();
  } catch (err) {
    console.error("DB connect failed:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }

  const { id } = req.query;
  const session = await getSessionFromReq(req);
  const userId = session?.user?._id;

  if (req.method === "GET") {
    try {
      const order = await OrderService.getById(id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // Basic Auth check for GET: allow customer (userId) or seller/partner (sellerId) to view it.
      if (!userId || (String(order.userId) !== String(userId) && String(order.sellerId) !== String(userId))) {
          return res.status(403).json({ error: "Forbidden. You do not own this order." });
      }

      return res.status(200).json(order);
    } catch (err) {
      console.error("GET /api/orders/[id] error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch order" });
    }
  }

  if (req.method === "PATCH") {
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
      let { status, restoreStock = false, ...rest } = req.body || {};
      if (!status) return res.status(400).json({ error: "status is required" });
      
      const order = await OrderService.getById(id);
      if (!order) return res.status(404).json({ error: "Order not found" });

      // --- CRITICAL AUTHORIZATION CHECK FOR CANCELLATION ---
      const isCustomerCancelling = String(order.userId) === String(userId) && status === 'cancelled';
      
      if (isCustomerCancelling) {
          // A customer can only set status to 'cancelled'
          status = 'cancelled';
          // Force stock restoration for customer cancellation
          restoreStock = true; 
      } else if (String(order.sellerId) !== String(userId)) {
          // If not the customer cancelling their own order, check if they are the seller/owner
          return res.status(403).json({ error: "Forbidden. Only the buyer can cancel, or the seller can update other statuses." });
      }

      const updated = await OrderService.updateStatus(id, status, { restoreStock });
      
      return res.status(200).json(updated);
    } catch (err) {
      console.error("PATCH /api/orders/[id] error:", err);
      if (err.name === "InsufficientStockError") return res.status(409).json({ error: err.message });
      if (err.name === "InvalidOrderParamsError" || err.name === "OrderError") return res.status(400).json({ error: err.message });
      return res.status(500).json({ error: err.message || "Failed to update order status" });
    }
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}