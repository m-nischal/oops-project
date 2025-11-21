// testConnection.js
import mongoose from "mongoose";
import dotenv from "dotenv";
// FIX: Removed "src/" because we are already inside the src folder
import Product from "./models/Product.js"; 

dotenv.config(); // loads .env by default

/**
 * Quick local connection + CRUD test. Useful to verify MONGO_URI in .env.
 * Example: node src/testConnection.js
 */
async function test() {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set in environment");

    await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose v8 uses improved defaults; explicit options are still accepted
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    const sample = new Product({
      name: "Test Product",
      price: 100,
      description: "Just checking connection",
      sizes: [{ size: "M", stock: 5 }]
    });

    await sample.save();
    console.log("✅ Product saved successfully (id:", sample._id, ")");

    // cleanup sample
    await Product.deleteOne({ _id: sample._id });
    console.log("🧹 Cleanup done - sample removed");
  } catch (err) {
    console.error("❌ Error:", err.message || err);
  } finally {
    try {
      await mongoose.disconnect();
      console.log("🔌 Disconnected");
    } catch (e) {
      console.error("❌ Error during disconnect:", e.message || e);
    }
  }
}

test();