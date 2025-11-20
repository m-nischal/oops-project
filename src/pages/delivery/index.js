// pages/api/delivery/index.js
import dbConnect from "../../lib/dbConnect";
import Delivery from "../../models/deliveryModel";
import requireRole from "../../lib/requireRole";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const agent = await requireRole("DELIVERY")(req, res);
  if (!agent) return; // requireRole already sent response

  const filter = { assignedTo: agent._id };
  if (req.query.status) filter.status = req.query.status;

  try {
    const deliveries = await Delivery.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, deliveries });
  } catch (err) {
    console.error("list deliveries error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}