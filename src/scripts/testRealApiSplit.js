import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";

dotenv.config();

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to DB");

  let retailer1, retailer2, customer;
  let prod1, prod2;

  try {
    // --- 1. SETUP FRESH DATA ---
    const timestamp = Date.now();
    retailer1 = await User.create({ name: "API Ret 1", email: `r1_${timestamp}@test.com`, role: "RETAILER", verified: true });
    retailer2 = await User.create({ name: "API Ret 2", email: `r2_${timestamp}@test.com`, role: "RETAILER", verified: true });
    customer = await User.create({ name: "API Cust", email: `c_${timestamp}@test.com`, role: "CUSTOMER", verified: true });

    prod1 = await Product.create({
      ownerId: retailer1._id,
      name: "Retailer 1 Item",
      price: 100,
      totalStock: 10,
      sizes: [{ size: "M", stock: 10 }],
      isPublished: true
    });

    prod2 = await Product.create({
      ownerId: retailer2._id,
      name: "Retailer 2 Item",
      price: 200,
      totalStock: 10,
      sizes: [{ size: "L", stock: 10 }],
      isPublished: true
    });

    console.log("✅ Test Data Created in DB");

    // --- 2. CALL THE API ---
    const url = "http://localhost:3000/api/orders";
    const payload = {
      customer: {
        name: "API Test User",
        email: customer.email,
        phone: "1234567890",
        address: "123 Test St",
        customerLocation: { lat: 12, lng: 77 }
      },
      items: [
        { productId: prod1._id, sizeLabel: "M", qty: 1, unitPrice: 100, name: "Retailer 1 Item" },
        { productId: prod2._id, sizeLabel: "L", qty: 1, unitPrice: 200, name: "Retailer 2 Item" }
      ]
    };

    console.log("🚀 Sending Request to API...");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    // --- 3. VERIFY ---
    console.log(`\n📡 API Status: ${res.status}`);

    if (res.ok && data.orders && data.orders.length === 2) {
        console.log("✅ SUCCESS! The API successfully split the order.");
        console.log(`   Order 1 ID: ${data.orders[0]._id} (Seller: ${data.orders[0].sellerId})`);
        console.log(`   Order 2 ID: ${data.orders[1]._id} (Seller: ${data.orders[1].sellerId})`);
        
        // Extra Check: Are sellers different?
        if (String(data.orders[0].sellerId) !== String(data.orders[1].sellerId)) {
             console.log("   (Confirmed: Orders are assigned to different sellers)");
        } else {
             console.error("   ⚠️ WARNING: Orders created but assigned to SAME seller!");
        }

        // Delete the orders we just created
        await Order.deleteMany({ _id: { $in: [data.orders[0]._id, data.orders[1]._id] } });

    } else {
        console.error("❌ FAILED. Response:", JSON.stringify(data, null, 2));
    }

  } catch (err) {
    console.error("❌ SCRIPT ERROR:", err);
  } finally {
    // --- 4. CLEANUP ---
    if (retailer1) await User.deleteMany({ email: { $in: [retailer1.email, retailer2.email, customer.email] } });
    if (prod1) await Product.deleteMany({ _id: { $in: [prod1._id, prod2._id] } });
    
    console.log("🧹 Test data cleaned up.");
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();