// src/pages/api/delivery/assign.js
import dbConnect from "../../../lib/dbConnect.js";
import Delivery from "../../../models/deliveryModel.js";
import User from "../../../models/User.js";
import { getSessionFromReq } from "../../../lib/authHelpers.js";
import { sendEmail } from "../../../lib/mailer.js";

export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  if (!["DISPATCHER", "ADMIN"].includes((session.user.role || "").toUpperCase())) {
    return res.status(403).json({ ok: false, error: "Forbidden: must be dispatcher/admin" });
  }

  const { deliveryId, agentId, notifyRecipient } = req.body;
  if (!deliveryId || !agentId) return res.status(400).json({ ok: false, error: "deliveryId and agentId required" });

  try {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) return res.status(404).json({ ok: false, error: "Delivery not found" });

    const agent = await User.findById(agentId);
    if (!agent) return res.status(404).json({ ok: false, error: "Agent not found" });

    delivery.assignedTo = agent._id;
    delivery.status = "ASSIGNED";
    delivery.timestamps = delivery.timestamps || {};
    delivery.timestamps.assignedAt = new Date();
    delivery.history = delivery.history || [];
    delivery.history.push({ status: "ASSIGNED", by: session.user._id, note: "Assigned by dispatcher" });

    await delivery.save();

    // notify agent
    if (agent.email) {
      try {
        await sendEmail({
          to: agent.email,
          subject: `New delivery assigned — ${delivery.externalOrderId || delivery._id}`,
          text: `You have been assigned delivery ${delivery._id}.\nPickup: ${delivery.pickup?.address || "N/A"}\nDropoff: ${delivery.dropoff?.address || "N/A"}`
        });
      } catch (e) {
        console.warn("Agent email failed:", e.message);
      }
    }

    if (notifyRecipient && delivery.dropoff?.email) {
      try {
        await sendEmail({
          to: delivery.dropoff.email,
          subject: `Your delivery is assigned — OTP inside`,
          text: `Your delivery (${delivery.externalOrderId || delivery._id}) has been assigned and will be out for delivery soon. OTP: ${delivery.deliveryOtp}`
        });
      } catch (e) {
        console.warn("Recipient email failed:", e.message);
      }
    }

    return res.json({ ok: true, delivery });
  } catch (err) {
    console.error("assign error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}