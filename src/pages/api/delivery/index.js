// src/pages/api/delivery/index.js
import dbConnect from "../../../lib/dbConnect.js";
import Delivery from "../../../models/deliveryModel.js";
import Order from "../../../models/orderModel.js"; 
import { getSessionFromReq } from "../../../lib/authHelpers.js";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }

  try {
    const role = (session.user.role || "").toUpperCase();
    const userId = session.user._id || session.user.id || session.user?.userId;

    // Build Query
    const query = {};

    // 1. Filter by Assigned User (if Delivery Agent)
    if (role === "DELIVERY") {
        // Agents see their own active jobs OR unassigned pending jobs
        query.$or = [
            { assignedTo: userId },
            { status: "PENDING" } 
        ];
    } else if (req.query.assignedTo) {
        query.assignedTo = req.query.assignedTo;
    }

    // 2. Filter by Status
    if (req.query.status) {
      const raw = String(req.query.status).trim();
      if (raw && raw.toLowerCase() !== "all") {
        const arr = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
        if (arr.length) query.status = { $in: arr };
      }
    }

    // 3. Search
    if (req.query.externalOrderId) {
      query.externalOrderId = { $regex: String(req.query.externalOrderId).trim(), $options: "i" };
    }

    // Fetch Data & POPULATE Order Details
    const deliveries = await Delivery.find(query)
      .populate("orderRef") // <--- CRITICAL: Links to the Order to get items/price
      .sort({ "timestamps.createdAt": -1 })
      .lean();

    // --- KEY CHANGE: Map Data to Flat UI Fields ---
    const formattedDeliveries = deliveries.map(d => {
        const order = d.orderRef || {};
        const pickup = d.pickup || {};
        const dropoff = d.dropoff || {};

        // Extract items: Try delivery items first, then fallback to order items
        let itemList = [];
        if (d.items && d.items.length > 0) {
            itemList = d.items.map(i => typeof i === 'string' ? i : (i.name || "Item"));
        } else if (order.items && order.items.length > 0) {
            itemList = order.items.map(i => i.name || "Item");
        }

        return {
            ...d,
            id: d._id, 
            
            // --- FLATTENING NESTED FIELDS FOR UI ---
            restaurantName: pickup.name || "Seller Warehouse",
            restaurantAddress: pickup.address || "Seller Warehouse Address",
            
            customerName: dropoff.name || "Customer",
            customerAddress: dropoff.address || "Address provided",
            customerPhone: dropoff.phone || "",
            
            // --- STATS ---
            items: itemList,
            // Use total from Delivery doc OR fallback to the Original Order's total
            total: d.total || order.total || 0,
            // If earnings not set, calculate fake 5% commission for display so it's not $0
            estimatedEarnings: d.deliveryFee || d.earnings || (order.total ? order.total * 0.05 : 0) || 0,
            
            // --- VISUALS ---
            distance: d.distance || "3.2 km", // Mock distance so it looks nice
            pickupTime: d.pickupTime || "Ready Now"
        };
    });

    return res.json({ ok: true, deliveries: formattedDeliveries });
  } catch (err) {
    console.error("GET /api/delivery error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}