// src/scripts/addReview.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const REVIEW_DATA = {
  rating: 5,
  comment: "Amazing quality! Fits perfectly and feels premium.",
};

async function addReview() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Find a User to be the reviewer (e.g., the first Customer)
    const user = await User.findOne({ role: "CUSTOMER" });
    if (!user) {
      console.error("❌ No customer found to write the review.");
      process.exit(1);
    }
    console.log(`👤 Reviewer: ${user.name} (${user.email})`);

    // 2. Find a Product to review (e.g., the first published product)
    const product = await Product.findOne({ isPublished: true });
    if (!product) {
      console.error("❌ No published product found.");
      process.exit(1);
    }
    console.log(`📦 Product: ${product.name}`);

    // 3. Construct the Review Object
    const newReview = {
      userId: user._id,
      rating: REVIEW_DATA.rating,
      comment: REVIEW_DATA.comment,
      author: user.name, // Snapshot of the user's name
      createdAt: new Date()
    };

    // 4. Add to Product and Save
    product.reviews.push(newReview);
    await product.save();

    console.log("------------------------------------------------");
    console.log("🌟 Review Added Successfully!");
    console.log("   Rating:", newReview.rating);
    console.log("   Comment:", newReview.comment);
    console.log("   Total Reviews:", product.reviews.length);
    console.log("------------------------------------------------");

  } catch (error) {
    console.error("❌ Error adding review:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
    process.exit(0);
  }
}

addReview();