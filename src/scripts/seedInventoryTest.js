// src/scripts/seedInventoryTest.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing. Check your .env file.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB...");

  // 1. Clear old data
  console.log("Clearing old products and users...");
  await Product.deleteMany({});
  await User.deleteMany({});

  // 2. Create the Retailer
  const hashedPassword = await bcrypt.hash("password123", 10);
  const retailer = await User.create({
    name: "Test Retailer",
    email: "retailer@livemart.com",
    password: hashedPassword,
    role: "RETAILER",
    verified: true,
  });
  console.log(`Created Retailer: ${retailer.email} / password123`);

  // 3. Create PUBLISHED Products (Should appear in "My Shop")
  const publishedItems = [];
  for (let i = 1; i <= 5; i++) {
    publishedItems.push({
      ownerId: retailer._id,
      name: `Live Product ${i}`,
      description: `This product is LIVE and visible to customers.`,
      price: 500 + (i * 10),
      images: ["/images/placeholder.png"],
      sizes: [{ size: "M", stock: 10 }],
      isPublished: true, // <--- THIS MAKES IT LIVE
    });
  }
  await Product.insertMany(publishedItems);
  console.log(`Created ${publishedItems.length} PUBLISHED products.`);

  // 4. Create UNPUBLISHED Products (Should appear in "Inventory")
  const draftItems = [];
  for (let i = 1; i <= 5; i++) {
    draftItems.push({
      ownerId: retailer._id,
      name: `Draft Item ${i}`,
      description: `This item is in the warehouse but NOT yet sold.`,
      price: 200 + (i * 10),
      images: ["/images/placeholder.png"],
      sizes: [{ size: "L", stock: 50 }],
      isPublished: false, // <--- THIS KEEPS IT IN INVENTORY
    });
  }
  await Product.insertMany(draftItems);
  console.log(`Created ${draftItems.length} DRAFT (Inventory) products.`);

  console.log("\nDone! You can now test the dashboard.");
  await mongoose.disconnect();
}

seed().catch(console.error);