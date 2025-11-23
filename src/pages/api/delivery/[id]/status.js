// src/pages/api/delivery/[id]/status.js
import dbConnect from "../../../../lib/dbConnect.js";
import Delivery from "../../../../models/deliveryModel.js";
import { getSessionFromReq } from "../../../../lib/authHelpers.js";
import { sendEmail } from "../../../../lib/mailer.js";
import Order from "../../../../models/orderModel.js"; // Import Order Model
import OrderService from "../../../../services/orderService.js"; // Import Order Service

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = await getSessionFromReq(req);
  if (!session || !session.user) return res.status(401).json({ ok: false, error: "Not authenticated" });
  
  // Role check
  if ((session.user.role || "").toUpperCase() !== "DELIVERY") {
      return res.status(403).json({ ok: false, error: "Forbidden" });
  }

  const { status, note, otp } = req.body || {};
  if (!status) return res.status(400).json({ ok: false, error: "Status is required" });

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery) return res.status(404).json({ ok: false, error: "Delivery not found" });
    
    if (String(delivery.assignedTo) !== String(session.user._id)) {
        return res.status(403).json({ ok: false, error: "Not assigned to you" });
    }

    const now = new Date();
    delivery.timestamps = delivery.timestamps || {};
    delivery.history = Array.isArray(delivery.history) ? delivery.history : [];

    // --- STATUS LOGIC ---

    if (status === "PICKED_UP") {
      delivery.status = "PICKED_UP"; 
      delivery.timestamps.pickedAt = now;
      
      // Ensure OTP exists for the next step
      if (!delivery.deliveryOtp) {
        delivery.deliveryOtp = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit OTP
      }
      
      delivery.history.push({ status: "PICKED_UP", by: session.user._id, note, at: now });

    } else if (status === "OUT_FOR_DELIVERY") {
      delivery.status = "OUT_FOR_DELIVERY";
      delivery.timestamps.outForDeliveryAt = now;
      delivery.history.push({ status: "OUT_FOR_DELIVERY", by: session.user._id, note: note || "", at: now });

      // 2. Generate OTP if it doesn't exist
      if (!delivery.deliveryOtp) {
        delivery.deliveryOtp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digit OTP
      }

      // 3. Send Email
      if (delivery.dropoff?.email) {
        try {
          await sendEmail({
            to: delivery.dropoff.email,
            subject: `Your LiveMart Order is Out for Delivery 🚚`,
            text: `Your order is on its way! Please share this OTP with your delivery partner: ${delivery.deliveryOtp}`,
            html: `
              <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
                <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
                  <h2 style="color: #333; margin: 0;">Out for Delivery</h2>
                </div>
                <div style="padding: 30px 0; text-align: center;">
                  <p style="font-size: 16px; color: #555; line-height: 1.5; margin-bottom: 20px;">
                    Good news! Your LiveMart order is on its way to you.
                  </p>
                  <p style="font-size: 16px; color: #555; margin-bottom: 25px;">
                    Please share the following One-Time Password (OTP) with your delivery partner to confirm receipt:
                  </p>
                  <div style="background-color: #f8f9fa; padding: 15px 30px; border-radius: 6px; display: inline-block; border: 1px dashed #ccc;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">
                      ${delivery.deliveryOtp}
                    </span>
                  </div>
                  <p style="font-size: 14px; color: #888; margin-top: 25px;">
                    For your security, please do not share this code with anyone else.
                  </p>
                </div>
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #999; font-size: 12px;">
                  &copy; ${new Date().getFullYear()} LiveMart. All rights reserved.
                </div>
              </div>
            `
          });
        } catch (e) {
          console.warn("Failed to send OTP email:", e?.message || e);
        }
      }
    
    } else if (status === "DELIVERED") {

      if (delivery.status === "DELIVERED") {
          // --- FIX: Ensure we populate orderRef even if returning early ---
          await delivery.populate("orderRef");
          const dObj = delivery.toObject();
          const orderTotal = dObj.orderRef?.total || 0;

          return res.json({ 
              ok: true, 
              delivery: {
                  ...dObj,
                  id: delivery._id,
                  total: delivery.total || orderTotal || 0,
                  estimatedEarnings: delivery.deliveryFee || delivery.earnings || 0
              } 
          });
      }
      // --- OTP VERIFICATION ---
      if (!otp) return res.status(400).json({ ok: false, error: "Delivery OTP is required" });
      
      // Strict string comparison
      if (String(otp).trim() !== String(delivery.deliveryOtp).trim()) {
          return res.status(400).json({ ok: false, error: "Invalid OTP. Please ask the customer again." });
      }

      delivery.status = "DELIVERED";
      delivery.timestamps.deliveredAt = now;
      delivery.deliveryOtp = null; // Clear OTP after use
      
      delivery.history.push({ status: "DELIVERED", by: session.user._id, note, at: now });
    }
    
    await delivery.save();

    // --- Sync status with Parent Order ---
    if (delivery.orderRef) {
      let orderStatus = null;
      if (status === "OUT_FOR_DELIVERY") orderStatus = "out_for_delivery";
      if (status === "DELIVERED") orderStatus = "delivered";

      if (orderStatus) {
        try {
          await OrderService.updateStatus(delivery.orderRef, orderStatus);
        } catch (syncErr) {
          console.error("Failed to sync order status:", syncErr);
        }
      }
    }

    // --- Send Final Delivery Confirmation Email ---
    if (status === "DELIVERED" && delivery.dropoff?.email) {
      try {
        await sendEmail({
          to: delivery.dropoff.email,
          subject: `Your LiveMart Order Has Been Delivered ✅`,
          text: `Your order has been successfully delivered. Thank you for shopping with LiveMart!`,
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="color: #28a745; margin: 0;">Order Delivered!</h2>
              </div>
              <div style="padding: 30px 0; text-align: center;">
                <p style="font-size: 16px; color: #555; line-height: 1.5;">
                  Your package has been successfully delivered to:
                </p>
                <p style="font-weight: bold; color: #333; margin: 10px 0 20px 0;">
                  ${delivery.dropoff.address}
                </p>
                <div style="margin: 20px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 14px;">View Order Details</a>
                </div>
                <p style="font-size: 14px; color: #777; margin-top: 30px;">
                  Thank you for shopping with LiveMart. We hope to see you again soon!
                </p>
              </div>
              <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #999; font-size: 12px;">
                &copy; ${new Date().getFullYear()} LiveMart. All rights reserved.
              </div>
            </div>
          `
        });
      } catch (emailErr) {
        console.warn("Failed to send delivery confirmation email:", emailErr);
      }
    }

    // --- CRITICAL FIX START: Populate orderRef to get the total price ---
    // This ensures the frontend receives the 'total' field immediately after update
    await delivery.populate("orderRef");
    
    const deliveryObj = delivery.toObject();
    const orderTotal = deliveryObj.orderRef?.total || 0;
    // --- CRITICAL FIX END ---

    return res.json({ 
        ok: true, 
        delivery: {
            ...deliveryObj,
            id: delivery._id,
            // Use delivery.total if exists, otherwise fallback to populated order.total
            total: delivery.total || orderTotal || 0,
            estimatedEarnings: delivery.deliveryFee || delivery.earnings || 0
        } 
    });

  } catch (err) {
    console.error("Status update error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}