// models/deliveryModel.js
import mongoose from "mongoose";

const LocationSchema = new mongoose.Schema({
  address: String,
  lat: Number,
  lng: Number
}, { _id: false });

const HistorySchema = new mongoose.Schema({
  status: String,
  at: { type: Date, default: Date.now },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  location: LocationSchema,
  note: String
}, { _id: false });

const DeliverySchema = new mongoose.Schema({
  externalOrderId: { type: String },
  orderRef: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  fromType: { type: String, enum: ["WHOLESALER", "RETAILER"], required: true },
  toType: { type: String, enum: ["RETAILER", "CUSTOMER"], required: true },

  pickup: LocationSchema,
  dropoff: {
    name: String,
    phone: String,
    email: String,
    address: String,
    lat: Number,
    lng: Number
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  status: {
    type: String,
    enum: ["PENDING","ASSIGNED","ACCEPTED","DECLINED","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","FAILED"],
    default: "PENDING"
  },

  deliveryOtp: { type: String },

  timestamps: {
    createdAt: { type: Date, default: Date.now },
    assignedAt: Date,
    acceptedAt: Date,
    pickedUpAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    failedAt: Date
  },

  notes: String,
  history: [HistorySchema]
}, { timestamps: true });

DeliverySchema.index({ assignedTo: 1, status: 1 });

export default mongoose.models.Delivery || mongoose.model("Delivery", DeliverySchema);