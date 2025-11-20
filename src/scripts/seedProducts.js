// src/scripts/seedProducts.js
import dotenv from "dotenv";
import mongoose from "mongoose";
// <-- use a relative path so plain `node` can resolve it from scripts/
import Product from "../models/Product.js";

dotenv.config();

/**
 * Simple seeding script that wipes products collection and inserts sample items.
 * Run via: npm run seed  (package.json => "seed": "node src/scripts/seedProducts.js")
 */

const items = [
  {
    name: "Blue Hoodie",
    price: 1499,
    originalPrice: 1999,
    description: "Warm blue hoodie",
    materials: ["cotton", "polyester"],
    images: ["/images/hoodie1.jpg"],
    sizes: [{ size: "S", stock: 4 }, { size: "M", stock: 6 }]
  },
  {
    name: "Red Tee",
    price: 499,
    originalPrice: 699,
    description: "Soft cotton T-shirt",
    materials: ["cotton"],
    images: ["/images/redtee.jpg"],
    sizes: [{ size: "M", stock: 10 }]
  },
  {
    name: "Black Joggers",
    price: 1299,
    originalPrice: 1499,
    description: "Comfortable joggers for daily wear",
    materials: ["polyester", "spandex"],
    images: ["/images/joggers.jpg"],
    sizes: [{ size: "L", stock: 8 }, { size: "M", stock: 3 }]
  }
];

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in environment. Set it in your .env file.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected - Seeding...");
  await Product.deleteMany({});
  await Product.insertMany(items);
  console.log("Seeded", items.length, "products");
  await mongoose.disconnect();
  console.log("Disconnected");
}

seed().catch(e => {
  console.error("Seeding failed:", e);
  process.exit(1);
});
