// src/scripts/addRetailerFeedback.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const FEEDBACK_DATA = {
  rating: 5,
  comment: "Great service! Fast shipping and very responsive communication.",
};

async function addRetailerFeedback() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI not set in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Find a Customer (The Reviewer)
    const reviewer = await User.findOne({ role: "CUSTOMER" });
    if (!reviewer) {
      console.error("❌ No customer found to leave feedback.");
      process.exit(1);
    }
    console.log(`👤 Reviewer: ${reviewer.name} (${reviewer.email})`);

    // 2. Find a Retailer (The Recipient)
    // You can also search by specific email: User.findOne({ email: "retailer@example.com" })
    const retailer = await User.findOne({ role: "RETAILER" });
    if (!retailer) {
      console.error("❌ No retailer found to receive feedback.");
      process.exit(1);
    }
    console.log(`🏪 Retailer: ${retailer.name} (${retailer.email})`);

    // 3. Construct the Feedback Object
    // Matches the FeedbackSchema added to src/models/User.js
    const newFeedback = {
      reviewerId: reviewer._id,
      rating: FEEDBACK_DATA.rating,
      comment: FEEDBACK_DATA.comment,
      author: reviewer.name, // Snapshot of reviewer's name
      createdAt: new Date()
    };

    // 4. Add to Retailer's Feedback array and Save
    // Ensure the Feedback array exists (it should by default schema, but good to be safe)
    if (!retailer.Feedback) {
        retailer.Feedback = [];
    }
    
    retailer.Feedback.push(newFeedback);
    await retailer.save();

    console.log("------------------------------------------------");
    console.log("🌟 Feedback Added Successfully!");
    console.log("   To Retailer:", retailer.name);
    console.log("   Rating:", newFeedback.rating);
    console.log("   Comment:", newFeedback.comment);
    console.log("   Total Feedback Count:", retailer.Feedback.length);
    console.log("------------------------------------------------");

  } catch (error) {
    console.error("❌ Error adding feedback:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected");
    process.exit(0);
  }
}

addRetailerFeedback();