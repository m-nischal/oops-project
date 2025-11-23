// src/pages/api/retailer/pos/checkout.js
import dbConnect from "../../../../lib/dbConnect";
import OrderService from "../../../../services/orderService";
import Order from "../../../../models/orderModel"; // Direct access needed for manual overrides
import { verifyToken } from "../../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. Auth Check
  let payload;
  try {
    payload = verifyToken(req);
    if (!payload || payload.role !== "RETAILER") {
      return res.status(401).json({ error: "Unauthorized." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id);

  const { items, customer, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in order." });
  }

  try {
    // 2. Prepare "Walk-in" Customer Data
    // If no customer info provided, use a placeholder
    const customerData = {
        name: customer?.name || "Walk-in Customer",
        phone: customer?.phone || "",
        email: customer?.email || "",
        address: "In-Store Pickup", 
        customerLocation: null // No location needed for POS
    };

    // 3. Create Order using Service (This handles Stock Decrement & Validation)
    // We pass 'null' as userId because Walk-in customers usually don't have an account
    // unless you want to link them.
    const orderDoc = await OrderService.createOrder(
        customerData,
        items,
        sellerId,
        null // userId (Buyer)
    );

    // 4. IMMEDIATE COMPLETION (POS Logic)
    // Since this is an offline sale, the items are handed over immediately.
    // We manually update status to 'delivered' and record payment.
    
    orderDoc.status = "delivered";
    const now = new Date();
    
    orderDoc.statusHistory.push(
        { status: "processing", at: now, note: "POS: Sale Recorded" },
        { status: "delivered", at: now, note: "POS: Items handed over" }
    );

    orderDoc.payment = {
        method: paymentMethod || "Cash",
        paidAt: now,
        provider: "POS_MANUAL"
    };
    
    // Set fulfillment dates
    orderDoc.shippedAt = now;
    orderDoc.outForDeliveryAt = now;
    orderDoc.deliveredAt = now;
    orderDoc.fulfillment = {
        shippedAt: now,
        outForDeliveryAt: now,
        deliveredAt: now,
        carrier: "Handover"
    };

    await orderDoc.save();

    return res.status(201).json({ 
        success: true, 
        orderId: orderDoc._id,
        total: orderDoc.total
    });

  } catch (err) {
    console.error("POS Checkout Error:", err);
    return res.status(500).json({ error: err.message || "Failed to record sale" });
  }
}