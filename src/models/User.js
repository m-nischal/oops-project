// src/models/User.js
import mongoose from "mongoose";

const { Schema } = mongoose; // Destructure Schema for use in sub-schema

// --- UPDATED SUB-SCHEMA: Address (Updated for Geo-location and full name) ---
const addressSchema = new Schema({
  label: { type: String, default: "Home" }, 
  firstName: { type: String }, // NEW
  lastName: { type: String }, // NEW
  addressLine1: { type: String, required: true }, // Main street address from Google
  addressLine2: { type: String }, // NEW: For apartment, suite, etc.
  city: { type: String, required: true },
  state: { type: String },
  pincode: { type: String }, 
  country: { type: String, required: true }, // NEW
  phone: { type: String }, 
  countryCode: { type: String, default: "+91" }, // NEW
  // NEW: GeoJSON structure for map display and future distance queries
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }, // [longitude, latitude]
  },
}, { _id: true });
// --- END UPDATED SUB-SCHEMA ---

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, index: true, sparse: true, unique: true },
  password: { type: String, select: false },
  oauthProvider: String,
  oauthId: String,
  phone: { type: String },
  role: { type: String, enum: ["CUSTOMER","RETAILER","WHOLESALER"], default: "CUSTOMER" },
  verified: { type: Boolean, default: false },
  otp: {
    code: String,
    expiresAt: Date
  },
  resetOtp: { type: String },
  resetOtpExpiry: { type: Number },
  resetAttempts: { type: Number },
  addresses: [addressSchema]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);