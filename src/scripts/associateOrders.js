// src/scripts/associateOrders.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Order from "../models/orderModel.js";
import User from "../models/User.js";

dotenv.config();

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to DB");

  const targetEmail = "nischalreddymuthumula@gmail.com"; // The email from your JSON file

  try {
    // 1. Find the User
    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      console.error(`❌ User with email ${targetEmail} not found.`);
      process.exit(1);
    }
    console.log(`✅ Found User: ${user._id}`);

    // 2. Find Orders with matching email but no userId
    const filter = {
      "customer.email": targetEmail,
      userId: null
    };

    const result = await Order.updateMany(filter, { $set: { userId: user._id } });

    console.log(`✅ Updated ${result.modifiedCount} orders to belong to user ${user._id}.`);

  } catch (err) {
    console.error("❌ Script Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();