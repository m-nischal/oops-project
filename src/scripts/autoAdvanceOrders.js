// src/scripts/autoAdvanceOrders.js
import dbConnect from "lib/dbConnect";
import Order from "models/orderModel.js";

/**
 * Auto-advance thresholds (milliseconds)
 * For testing you can keep these short; for production set to days as needed.
 */
const ORDER_TO_SHIPPED_MS = 2 * 60 * 60 * 1000; // demo: 2 hours
const SHIPPED_TO_OUTFOR_MS = 4 * 60 * 60 * 1000; // demo: 4 hours after shipped
const OUTFOR_TO_DELIVERED_MS = 6 * 60 * 60 * 1000; // demo: 6 hours after out-for-delivery

async function runOnce() {
  await dbConnect();

  // 1) ordered -> shipped
  try {
    const cutoff1 = new Date(Date.now() - ORDER_TO_SHIPPED_MS);
    const orderedToShip = await Order.find({
      status: "ordered",
      createdAt: { $lte: cutoff1 }
    });

    for (const o of orderedToShip) {
      const prev = o.status;
      const at = new Date();
      o.status = "shipped";
      o.fulfillment = o.fulfillment || {};
      o.fulfillment.shippedAt = o.fulfillment.shippedAt || at;
      o.shippedAt = o.shippedAt || at;
      o.statusHistory = o.statusHistory || [];
      o.statusHistory.push({ status: "shipped", at, note: `Auto: ${prev} -> shipped` });
      await o.save().catch(err => console.error("save err", err));
      console.log(`Auto advanced order ${o._id} -> shipped`);
    }
  } catch (err) {
    console.error("Error advancing ordered->shipped:", err);
  }

  // 2) shipped -> out_for_delivery
  try {
    const cutoff2 = new Date(Date.now() - SHIPPED_TO_OUTFOR_MS);
    const shippedToOut = await Order.find({
      status: "shipped",
      "fulfillment.shippedAt": { $lte: cutoff2 }
    });

    for (const o of shippedToOut) {
      const prev = o.status;
      const at = new Date();
      o.status = "out_for_delivery";
      o.fulfillment = o.fulfillment || {};
      o.fulfillment.outForDeliveryAt = o.fulfillment.outForDeliveryAt || at;
      o.outForDeliveryAt = o.outForDeliveryAt || at;
      o.statusHistory = o.statusHistory || [];
      o.statusHistory.push({ status: "out_for_delivery", at, note: `Auto: ${prev} -> out_for_delivery` });
      await o.save().catch(err => console.error("save err", err));
      console.log(`Auto advanced order ${o._id} -> out_for_delivery`);
    }
  } catch (err) {
    console.error("Error advancing shipped->out_for_delivery:", err);
  }

  // 3) out_for_delivery -> delivered
  try {
    const cutoff3 = new Date(Date.now() - OUTFOR_TO_DELIVERED_MS);
    const outToDelivered = await Order.find({
      status: "out_for_delivery",
      "fulfillment.outForDeliveryAt": { $lte: cutoff3 }
    });

    for (const o of outToDelivered) {
      const prev = o.status;
      const at = new Date();
      o.status = "delivered";
      o.fulfillment = o.fulfillment || {};
      o.fulfillment.deliveredAt = o.fulfillment.deliveredAt || at;
      o.deliveredAt = o.deliveredAt || at;
      o.statusHistory = o.statusHistory || [];
      o.statusHistory.push({ status: "delivered", at, note: `Auto: ${prev} -> delivered` });
      await o.save().catch(err => console.error("save err", err));
      console.log(`Auto advanced order ${o._id} -> delivered`);
    }
  } catch (err) {
    console.error("Error advancing out_for_delivery->delivered:", err);
  }

  console.log("Auto-advance pass complete");
  process.exit(0);
}

runOnce().catch(err => {
  console.error("Auto-advance fatal error:", err);
  process.exit(1);
});
