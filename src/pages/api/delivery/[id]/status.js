// src/pages/api/delivery/[id]/status.js
import dbConnect from "../../../../lib/dbConnect.js";
import Delivery from "../../../../models/deliveryModel.js";
import { getSessionFromReq } from "../../../../lib/authHelpers.js";
import { sendEmail } from "../../../../lib/mailer.js";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  const role = (session.user.role || "").toUpperCase();
  if (role !== "DELIVERY") return res.status(403).json({ ok: false, error: "Forbidden" });

  const { status, note, otp } = req.body;
  if (!status) return res.status(400).json({ ok: false, error: "status required" });

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery) return res.status(404).json({ ok: false, error: "Delivery not found" });
    if (String(delivery.assignedTo) !== String(session.user._id)) return res.status(403).json({ ok: false, error: "Not assigned to you" });

    const now = new Date();

    if (status === "PICKED_UP") {
      delivery.status = "PICKED_UP";
      delivery.timestamps.pickedAt = now;
      delivery.history.push({ status: "PICKED_UP", by: session.user._id, note: note || "" });

    } else if (status === "OUT_FOR_DELIVERY") {
      delivery.status = "OUT_FOR_DELIVERY";
      delivery.timestamps.outForDeliveryAt = now;
      delivery.history.push({ status: "OUT_FOR_DELIVERY", by: session.user._id, note: note || "" });

      // ensure OTP exists (or generate)
      if (!delivery.deliveryOtp) {
        delivery.deliveryOtp = String(Math.floor(100000 + Math.random() * 900000));
      }

      // send OTP to recipient email if present
      if (delivery.dropoff?.email) {
        try {
          await sendEmail({
            to: delivery.dropoff.email,
            subject: `Your delivery is out for delivery — OTP`,
            text: `Your delivery (${delivery.externalOrderId || delivery._id}) is out for delivery. OTP: ${delivery.deliveryOtp}`
          });
        } catch (e) {
          console.warn("Failed to send OTP email:", e.message);
        }
      }

    } else if (status === "DELIVERED") {
      // require OTP match
      if (!otp) return res.status(400).json({ ok: false, error: "OTP required" });
      if (String(otp) !== String(delivery.deliveryOtp)) return res.status(400).json({ ok: false, error: "Invalid OTP" });

      delivery.status = "DELIVERED";
      delivery.timestamps.deliveredAt = now;
      delivery.history.push({ status: "DELIVERED", by: session.user._id, note: note || "" });
      // clear otp for safety
      delivery.deliveryOtp = null;
    } else {
      // other statuses allowed? set directly
      delivery.status = status;
      delivery.history.push({ status, by: session.user._id, note: note || "" });
    }

    await delivery.save();
    return res.json({ ok: true, delivery });
  } catch (err) {
    console.error("status error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}