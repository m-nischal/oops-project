// src/pages/api/delivery/[id]/decline.js
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
  if (!session || !session.user)
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  if ((session.user.role || "").toUpperCase() !== "DELIVERY")
    return res.status(403).json({ ok: false, error: "Forbidden" });

  const { note } = req.body || {};

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery)
      return res.status(404).json({ ok: false, error: "Delivery not found" });

    if (String(delivery.assignedTo) !== String(session.user._id))
      return res.status(403).json({ ok: false, error: "Not assigned to you" });

    // --- FIX 1: ensure timestamps exists ---
    delivery.timestamps = delivery.timestamps || {};

    // --- FIX 2: ensure history exists & is array ---
    delivery.history = Array.isArray(delivery.history) ? delivery.history : [];

    // apply decline update
    delivery.status = "UNASSIGNED";
    delivery.assignedTo = null;
    delivery.timestamps.declinedAt = new Date();

    delivery.history.push({
      status: "DECLINED",
      by: session.user._id,
      note: note || "Declined by agent",
      at: new Date(),
    });

    await delivery.save();
    return res.json({ ok: true, delivery });
  } catch (err) {
    console.error("DECLINE ERROR:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
