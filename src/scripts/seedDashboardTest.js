// src/scripts/seedDashboardTest.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Order from "../models/orderModel.js";

dotenv.config();

// --- Helper Functions ---

// Creates a realistic order
function createOrderData(seller, customer, products, status) {
  const orderItems = products.map(p => ({
    productId: p.product._id,
    name: p.product.name,
    sizeLabel: p.size,
    qty: p.qty,
    unitPrice: p.product.price,
    subtotal: p.product.price * p.qty,
  }));

  const subtotal = orderItems.reduce((acc, item) => acc + item.subtotal, 0);
  const total = subtotal; // Keep it simple, no tax/shipping

  return {
    sellerId: seller._id,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: "123 Test St, Test City",
    },
    items: orderItems,
    subtotal,
    total,
    status: status,
    statusHistory: [{ status: status, at: new Date() }],
  };
}

// Helper to pick a random item from an array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Main Seeding Function ---

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in environment. Set it in your .env file.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB...");

  // 1. --- Clear Old Data ---
  console.log("Clearing old data (Users, Products, Orders)...");
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});

  // 2. --- Create Users ---
  console.log("Creating users...");
  const hashedPassword = await bcrypt.hash("password123", 10);

  const testWholesaler = await User.create({
    name: "Global Wholesalers Inc.",
    email: "wholesaler@livemart.com",
    role: "WHOLESALER",
    password: hashedPassword,
    verified: true,
  });

  const testRetailer = await User.create({
    name: "Arik Retail Store",
    email: "retailer@livemart.com",
    role: "RETAILER",
    password: hashedPassword,
    verified: true,
  });

  const testCustomer = await User.create({
    name: "Test Customer",
    email: "customer@livemart.com",
    role: "CUSTOMER",
    password: hashedPassword,
    verified: true,
  });
  
  console.log(`Created Wholesaler: ${testWholesaler.email}`);
  console.log(`Created Retailer: ${testRetailer.email}`);
  console.log(`Created Customer: ${testCustomer.email}`);

  // 3. --- Create Products ---
  console.log("Creating Wholesaler base products...");
  const wholesalerProducts = [];
  for (let i = 1; i <= 15; i++) {
    const p = await Product.create({
      ownerId: testWholesaler._id,
      name: `Wholesale Gadget ${i}`,
      description: `Bulk-priced gadget ${i} from Global Wholesalers.`,
      price: 1000 + i * 50, // Wholesale price
      images: ["/images/placeholder.png"],
      tags: ["gadget", "wholesale"],
      sizes: [
        { size: "default", sku: `W-GADGET-${i}`, stock: 1000 }
      ],
      productDetails: { countryOfOrigin: "China" },
      warehouses: [{ city: "Shenzhen", state: "Guangdong", country: "China" }]
    });
    wholesalerProducts.push(p);
  }
  console.log(`Created ${wholesalerProducts.length} wholesaler products.`);

  console.log("Creating Retailer-owned products (from scratch)...");
  const retailerOwnedProducts = [];
  for (let i = 1; i <= 5; i++) {
    const p = await Product.create({
      ownerId: testRetailer._id,
      name: `Handmade Local Item ${i}`,
      description: `Locally sourced item ${i} from Arik Retail.`,
      price: 300 + i * 20, // Retail price
      images: ["/images/placeholder.png"],
      tags: ["local", "handmade"],
      sizes: [
        { size: "S", sku: `R-LOCAL-${i}-S`, stock: 10 + i },
        { size: "M", sku: `R-LOCAL-${i}-M`, stock: 20 + i }
      ],
      productDetails: { countryOfOrigin: "India" },
      warehouses: [{ city: "Chennai", state: "Tamil Nadu", country: "India" }]
    });
    retailerOwnedProducts.push(p);
  }
  console.log(`Created ${retailerOwnedProducts.length} local products for the retailer.`);

  console.log("Simulating Retailer stocking from Wholesaler...");
  const retailerStockedProducts = [];
  for (let i = 0; i < 5; i++) {
    const baseProduct = wholesalerProducts[i];
    const p = await Product.create({
      ...baseProduct.toObject(), // Copy all data
      _id: undefined, // Let mongoose create a new ID
      __v: undefined,
      ownerId: testRetailer._id, // Set new owner
      wholesaleSourceId: baseProduct._id, // Link to original
      price: baseProduct.price * 1.5, // Retailer marks up the price by 50%
      sizes: baseProduct.sizes.map(s => ({ ...s, stock: 20 + i })), // Retailer has their own stock
    });
    retailerStockedProducts.push(p);
  }
  console.log(`Created ${retailerStockedProducts.length} retailer-stocked products.`);

  const allRetailerProducts = [...retailerOwnedProducts, ...retailerStockedProducts];

  // 4. --- Create Orders ---
  console.log("Creating Customer-to-Retailer orders...");
  const customerOrders = [];
  const statuses = ["processing", "shipped", "delivered", "cancelled"];
  for (let i = 0; i < 30; i++) {
    const productToBuy = randomItem(allRetailerProducts);
    const order = createOrderData(
      testRetailer, // Seller
      testCustomer, // Customer
      [{ product: productToBuy, size: productToBuy.sizes[0].size, qty: 1 }],
      randomItem(statuses)
    );
    customerOrders.push(order);
  }
  await Order.insertMany(customerOrders);
  console.log(`Created ${customerOrders.length} orders for the Retailer.`);

  console.log("Creating Retailer-to-Wholesaler (restock) orders...");
  // These orders will appear on the Wholesaler's dashboard
  const restockOrders = [];
  for (let i = 0; i < 8; i++) {
    const productToRestock = randomItem(wholesalerProducts);
    const order = createOrderData(
      testWholesaler, // Seller
      testRetailer,   // Customer (The retailer is the customer here)
      [{ product: productToRestock, size: productToRestock.sizes[0].size, qty: 50 }], // Bulk order
      randomItem(statuses)
    );
    restockOrders.push(order);
  }
  await Order.insertMany(restockOrders);
  console.log(`Created ${restockOrders.length} restock orders for the Wholesaler.`);
  
  // --- Done ---
  console.log("\nDatabase seeding complete!");
  console.log("You can now log in with:");
  console.log(`- Wholesaler: wholesaler@livemart.com / password123`);
  console.log(`- Retailer: retailer@livemart.com / password123`);
  
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});