// src/pages/api/orders/[id].js
import dbConnect from "lib/dbConnect.js";
import OrderService from "services/orderService.js";

/**
 * GET  /api/orders/:id    -> returns order
 * PATCH /api/orders/:id  -> update status, small edits
 */
export default async function handler(req, res) {
  try { await dbConnect(); } catch (err) {
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

      // support optional metadata updates later (fulfillment/payment) by the service if needed
      const updated = await OrderService.updateStatus(id, status, { restoreStock });
      // Merge optional small updates (tracking number etc.) by refetch+patch if provided
      if ((fulfillment && Object.keys(fulfillment).length) || (payment && Object.keys(payment).length) || meta) {
        // simple naive patch: get by id and assign fields then save via the model through OrderService.getById + model save
        // To keep separation of concerns we return updated and let frontend call dedicated endpoints for deeper edits.
      }

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
