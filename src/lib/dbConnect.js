// lib/dbConnect.js
import mongoose from "mongoose";

/**
 * @file dbConnect
 * @brief Reusable MongoDB connection util for Next.js API routes.
 *
 * Throws if MONGO_URI missing. Caches connection in global to avoid multiple
 * connections during hot-reload/development.
 */

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI not set");

let cached = global._mongoose || { conn: null, promise: null };
if (!global._mongoose) global._mongoose = cached;

/**
 * Ensure there is a single mongoose connection used across calls.
 * @returns {Promise<mongoose.Mongoose>}
 */
export default async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    // Use the connection string directly; options are managed by mongoose v8 defaults.
    cached.promise = mongoose.connect(MONGO_URI).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
