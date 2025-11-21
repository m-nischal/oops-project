// src/pages/api/delivery/[id]/accept.js
import dbConnect from "../../../../lib/dbConnect.js";
import Delivery from "../../../../models/deliveryModel.js";
import { getSessionFromReq } from "../../../../lib/authHelpers.js";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  if ((session.user.role || "").toUpperCase() !== "DELIVERY") return res.status(403).json({ ok: false, error: "Forbidden" });

  const { action: rawAction, note } = req.body || {};
  const action = (rawAction || "accept").toString().toLowerCase();

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery) return res.status(404).json({ ok: false, error: "Delivery not found" });

    delivery.timestamps = delivery.timestamps || {};
    delivery.history = Array.isArray(delivery.history) ? delivery.history : [];

    if (action === "accept") {
      // --- CHANGED: CLAIM THE ORDER ---
      
      // 1. Check if someone else already took it
      if (delivery.assignedTo && String(delivery.assignedTo) !== String(session.user._id)) {
        return res.status(409).json({ ok: false, error: "This order was just taken by another agent." });
      }

      // 2. Assign to current user
      delivery.assignedTo = session.user._id;
      delivery.status = "ACCEPTED";
      delivery.timestamps.acceptedAt = new Date();
      
      delivery.history.push({
        status: "ACCEPTED",
        by: session.user._id,
        note: note || "Accepted (Claimed) by agent",
        at: new Date()
      });

    } else {
      // --- DECLINE FLOW ---
      // If they decline, ensure it's unassigned so it goes back to the pool
      if (String(delivery.assignedTo) === String(session.user._id)) {
          delivery.assignedTo = null; 
      }
      
      delivery.status = "PENDING"; // Send back to pool
      delivery.timestamps.declinedAt = new Date();

      delivery.history.push({
        status: "DECLINED",
        by: session.user._id,
        note: note || "Declined by agent",
        at: new Date()
      });
    }

    await delivery.save();
    
    return res.json({ 
        ok: true, 
        delivery: {
            ...delivery.toObject(),
            id: delivery._id,
            estimatedEarnings: delivery.deliveryFee || delivery.earnings || 0
        } 
    });
  } catch (err) {
    console.error("Accept/Decline error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}