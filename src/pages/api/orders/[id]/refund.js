// src/pages/api/orders/[id]/refund.js
import dbConnect from "lib/dbConnect.js";
import OrderService from "services/orderService.js";

/**
 * POST /api/orders/:id/refund
 * Body: { restoreStock: boolean = true, refundInfo: {...} }
 *
 * NOTE: Do payment-provider refund before calling this in production.
 */
export default async function handler(req, res) {
  try { await dbConnect(); } catch (err) {
    console.error("DB connect failed:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }

  const { id } = req.query;

  if (req.method === "POST") {
    try {
      const { restoreStock = true, refundInfo = {} } = req.body || {};

      // In real integration you should call payment provider refund here first.
      const refunded = await OrderService.refundOrder(id, { restoreStock, refundInfo });
      return res.status(200).json(refunded);
    } catch (err) {
      console.error("POST /api/orders/[id]/refund error:", err);
      if (err.name === "InsufficientStockError") return res.status(409).json({ error: err.message });
      if (err.name === "InvalidOrderParamsError" || err.name === "OrderError") return res.status(400).json({ error: err.message });
      return res.status(500).json({ error: err.message || "Refund failed" });
    }
  }

  res.setHeader("Allow", ["POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
