// src/pages/api/orders/[id].js
import dbConnect from "../../../lib/dbConnect";
import OrderService from "../../../services/orderService";

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

  if (req.method === "GET") {
    try {
      const order = await OrderService.getById(id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      return res.status(200).json(order);
    } catch (err) {
      console.error("GET /api/orders/[id] error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch order" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const { status, restoreStock = false, fulfillment, payment, meta } = req.body || {};
      if (!status) return res.status(400).json({ error: "status is required" });

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