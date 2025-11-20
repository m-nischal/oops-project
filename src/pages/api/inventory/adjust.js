// src/pages/api/inventory/adjust.js
import dbConnect from "lib/dbConnect.js";
import InventoryService from "services/inventory.js";

/**
 * POST /api/inventory/adjust
 * Body:
 * { productId: "id", sizeLabel: "M", qty: 5, operation: "increase"|"decrease"|"set" }
 *
 * Admin-only endpoint (add auth in real app).
 */
export default async function handler(req, res) {
  try { await dbConnect(); } catch (err) {
    console.error("DB connect failed:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { productId, sizeLabel, qty, operation = "increase" } = req.body || {};
    if (!productId || !sizeLabel) return res.status(400).json({ error: "productId and sizeLabel are required" });
    const nQty = Number(qty || 0);
    if (!Number.isFinite(nQty)) return res.status(400).json({ error: "qty must be a number" });

    // Choose operation
    if (operation === "increase") {
      const ok = await InventoryService.increaseStock(productId, sizeLabel, nQty);
      if (!ok) {
        // size missing — create
        await InventoryService.addOrCreateSize(productId, sizeLabel, nQty);
      }
      return res.status(200).json({ success: true });
    }

    if (operation === "decrease") {
      const ok = await InventoryService.decreaseStock(productId, sizeLabel, nQty);
      if (!ok) return res.status(409).json({ error: "Insufficient stock or size not found" });
      return res.status(200).json({ success: true });
    }

    if (operation === "set") {
      // set exact stock value for size (create if missing)
      await InventoryService.addOrCreateSize(productId, sizeLabel, nQty);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "invalid operation" });
  } catch (err) {
    console.error("POST /api/inventory/adjust error:", err);
    return res.status(500).json({ error: err.message || "Inventory adjust failed" });
  }
}
