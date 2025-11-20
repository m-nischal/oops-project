// src/pages/api/delivery/index.js
import dbConnect from "../../../lib/dbConnect.js";
import Delivery from "../../../models/deliveryModel.js";
import { getSessionFromReq } from "../../../lib/authHelpers.js";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) return res.status(401).json({ ok: false, error: "Not authenticated" });

  try {
    const role = (session.user.role || "").toUpperCase();
    let query = {};
    if (role === "DELIVERY") {
      // agent sees only deliveries assigned to them
      query.assignedTo = session.user._id;
    }
    // Optionally allow query params for filtering (status, externalOrderId)
    if (req.query.status) query.status = req.query.status;
    if (req.query.externalOrderId) query.externalOrderId = req.query.externalOrderId;

    const deliveries = await Delivery.find(query).sort({ "timestamps.createdAt": -1 }).lean();
    return res.json({ ok: true, deliveries });
  } catch (err) {
    console.error("GET /api/delivery error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}