import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/orderModel.js";
import OrderService from "../services/orderService.js";

dotenv.config();

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to DB");

  try {
    // --- 1. SETUP: Create 2 Retailers & 1 Customer ---
    const r1Email = `retailer1_${Date.now()}@test.com`;
    const r2Email = `retailer2_${Date.now()}@test.com`;
    const cEmail = `cust_${Date.now()}@test.com`;

    const retailer1 = await User.create({ name: "Retailer One", email: r1Email, role: "RETAILER", verified: true });
    const retailer2 = await User.create({ name: "Retailer Two", email: r2Email, role: "RETAILER", verified: true });
    const customer = await User.create({ name: "Test Customer", email: cEmail, role: "CUSTOMER", verified: true });

    // --- 2. SETUP: Create 1 Product for each Retailer ---
    const prod1 = await Product.create({
      ownerId: retailer1._id,
      name: "Retailer One Shirt",
      price: 100,
      totalStock: 10,
      sizes: [{ size: "M", stock: 10 }],
      isPublished: true
    });

    const prod2 = await Product.create({
      ownerId: retailer2._id,
      name: "Retailer Two Pants",
      price: 200,
      totalStock: 10,
      sizes: [{ size: "L", stock: 10 }],
      isPublished: true
    });

    console.log(`✅ Setup Complete.`);
    console.log(`   Retailer 1: ${retailer1._id} | Product: ${prod1._id}`);
    console.log(`   Retailer 2: ${retailer2._id} | Product: ${prod2._id}`);

    // --- 3. SIMULATE THE CART (Mixed Items) ---
    const cartItems = [
        { productId: prod1._id, sizeLabel: "M", qty: 1, name: prod1.name, unitPrice: 100 }, // From Retailer 1
        { productId: prod2._id, sizeLabel: "L", qty: 1, name: prod2.name, unitPrice: 200 }  // From Retailer 2
    ];

    console.log("\n🛒 Simulating Order Placement with Mixed Cart...");

    // --- 4. EXECUTE SPLIT LOGIC (Copy of API Logic) ---
    // This mimics exactly what src/pages/api/orders/index.js does

    const productIds = cartItems.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).select("ownerId name").lean();
    
    const productMap = {};
    products.forEach(p => { productMap[String(p._id)] = p; });

    const ordersBySeller = {};

    // Grouping
    for (const item of cartItems) {
        const product = productMap[String(item.productId)];
        if (!product) throw new Error("Product not found");
        
        const sellerId = String(product.ownerId);
        if (!ordersBySeller[sellerId]) {
            ordersBySeller[sellerId] = [];
        }
        ordersBySeller[sellerId].push(item);
    }

    console.log(`   Grouping Result: Found ${Object.keys(ordersBySeller).length} distinct sellers.`);

    // Creation
    const createdOrders = [];
    for (const [sellerId, items] of Object.entries(ordersBySeller)) {
        console.log(`   Creating order for Seller ${sellerId} with ${items.length} item(s)...`);
        const orderDoc = await OrderService.createOrder(
            { name: "Test Customer", email: cEmail },
            items,
            sellerId,
            customer._id
        );
        createdOrders.push(orderDoc);
    }

    // --- 5. VERIFICATION ---
    console.log(`\n📊 RESULTS:`);
    console.log(`   Total Orders Created: ${createdOrders.length} (Expected: 2)`);

    if (createdOrders.length === 2) {
        const o1 = createdOrders[0];
        const o2 = createdOrders[1];

        console.log(`   Order 1 ID: ${o1._id} | Seller: ${o1.sellerId}`);
        console.log(`   Order 2 ID: ${o2._id} | Seller: ${o2.sellerId}`);

        if (String(o1.sellerId) !== String(o2.sellerId)) {
            console.log("\n✅ SUCCESS: The single cart was successfully split into two separate orders for different retailers!");
        } else {
            console.error("\n❌ FAILED: Orders were created but assigned to the same seller.");
        }
    } else {
        console.error("\n❌ FAILED: Did not create exactly 2 orders.");
    }

    // Cleanup
    await User.deleteMany({ email: { $in: [r1Email, r2Email, cEmail] } });
    await Product.deleteMany({ _id: { $in: [prod1._id, prod2._id] } });
    await Order.deleteMany({ _id: { $in: createdOrders.map(o => o._id) } });
    console.log("\n🧹 Cleanup done.");

  } catch (err) {
    console.error("❌ SCRIPT ERROR:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();