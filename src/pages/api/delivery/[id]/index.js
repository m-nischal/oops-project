// src/pages/api/delivery/[id]/index.js
import dbConnect from "../../../../lib/dbConnect.js";
import Delivery from "../../../../models/deliveryModel.js";
import { getSessionFromReq } from "../../../../lib/authHelpers.js";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const delivery = await Delivery.findById(id).lean();
    if (!delivery) return res.status(404).json({ ok: false, error: "Delivery not found" });

    const role = (session.user.role || "").toUpperCase();
    if (role === "DELIVERY" && String(delivery.assignedTo) !== String(session.user._id)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    return res.json({ ok: true, delivery });
  } catch (err) {
    console.error("GET /api/delivery/[id] error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}