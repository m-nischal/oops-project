// models/orderModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Minimal snapshot item schema used inside Order documents.
 */
const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  sizeLabel: { type: String, required: true },
  qty: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  estimatedDelivery: { type: Date }
}, { _id: false });

/**
 * Status history entries
 */
const statusHistorySchema = new Schema({
  status: { type: String, required: true },
  at: { type: Date, default: Date.now },
  note: { type: String }
}, { _id: false });

const orderSchema = new Schema({
  
  // --- NEW FIELD ---
  // Tracks which User (Retailer or Wholesaler) is the seller
  // responsible for fulfilling this order.
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Every order must have a seller
    index: true
  },

  /* --- Existing Fields --- */
  customer: {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    customerLocation: { type: Schema.Types.Mixed }
  },
  items: { type: [orderItemSchema], required: true },

  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  status: {
    type: String,
    enum: [
      "created", "ordered", "pending", "paid", "processing",
      "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"
    ],
    default: "created"
  },

  statusHistory: { type: [statusHistorySchema], default: [] },
  estimatedDelivery: { type: Date },
  payment: {
    provider: { type: String },
    paymentId: { type: String },
    method: { type: String },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    refundInfo: { type: Schema.Types.Mixed }
  },
  fulfillment: {
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date
  },

  shippedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,

  userId: { type: Schema.Types.ObjectId, ref: "User" }, // This is the Customer's ID
  meta: { type: Schema.Types.Mixed },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

// Useful indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ "customer.email": 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// --- NEW INDEX ---
// This will make dashboard queries for orders much faster.
orderSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);