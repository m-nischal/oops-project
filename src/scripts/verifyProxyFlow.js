// src/scripts/verifyProxyFlow.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Product from "../models/Product.js";
import OrderService from "../services/orderService.js";
import InventoryService from "../services/inventory.js";

dotenv.config();

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to DB");

  try {
    // 1. Setup Users
    const wholesalerEmail = `w_test_${Date.now()}@example.com`;
    const retailerEmail = `r_test_${Date.now()}@example.com`;
    const customerEmail = `c_test_${Date.now()}@example.com`;

    const wholesaler = await User.create({ name: "Test Wholesaler", email: wholesalerEmail, role: "WHOLESALER", verified: true });
    const retailer = await User.create({ name: "Test Retailer", email: retailerEmail, role: "RETAILER", verified: true });
    const customer = await User.create({ name: "Test Customer", email: customerEmail, role: "CUSTOMER", verified: true });

    console.log("✅ Users created");

    // 2. Wholesaler creates a product
    const wholesaleProduct = await Product.create({
      ownerId: wholesaler._id,
      name: "Super Widget",
      price: 100,
      totalStock: 100,
      sizes: [{ size: "Standard", stock: 100 }],
      isPublished: true
    });
    console.log("✅ Wholesaler Product created:", wholesaleProduct._id);

    // 3. Retailer stocks the product (Stock = 0)
    const retailerProduct = await Product.create({
      ownerId: retailer._id,
      wholesaleSourceId: wholesaleProduct._id,
      name: wholesaleProduct.name,
      price: 150,
      totalStock: 0,
      sizes: [{ size: "Standard", stock: 0 }], // 0 STOCK!
      isPublished: true
    });
    console.log("✅ Retailer Product created (0 Stock):", retailerProduct._id);

    // 4. Verify Pre-Order Stock
    const preStock = await InventoryService.getStock(retailerProduct._id, "Standard");
    console.log(`ℹ️  Pre-Order Retailer Stock: ${preStock} (Expected: 0)`);

    // 5. Customer attempts to buy 5 units (Should trigger Proxy/Backorder)
    console.log("🛒 Attempting to order 5 units...");
    
    const items = [{
        productId: retailerProduct._id,
        sizeLabel: "Standard",
        qty: 5,
        unitPrice: 150
    }];

    const order = await OrderService.createOrder(
        { name: "Test Customer", email: customerEmail },
        items,
        retailer._id, // Seller
        customer._id  // Buyer
    );

    console.log("✅ Order Created Successfully! ID:", order._id);

    // 6. Verify Post-Order Stock (Should be -5)
    const postStock = await InventoryService.getStock(retailerProduct._id, "Standard");
    console.log(`ℹ️  Post-Order Retailer Stock: ${postStock} (Expected: -5)`);

    if (postStock === -5) {
        console.log("🎉 SUCCESS: Proxy flow worked! Stock went negative to indicate backorder.");
        console.log("📧 Check your server console logs above for the simulated email notification.");
    } else {
        console.error("❌ FAILURE: Stock did not update correctly.");
    }

    // Cleanup
    await User.deleteMany({ email: { $in: [wholesalerEmail, retailerEmail, customerEmail] } });
    await Product.deleteMany({ _id: { $in: [wholesaleProduct._id, retailerProduct._id] } });
    await mongoose.connection.collection('orders').deleteOne({ _id: order._id });
    console.log("🧹 Test data cleaned up.");

  } catch (err) {
    console.error("❌ TEST FAILED:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();