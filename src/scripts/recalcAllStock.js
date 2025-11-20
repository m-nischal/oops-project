// src/scripts/recalcAllStock.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Product from "../models/Product.js";

async function main() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const products = await Product.find({});
  console.log("Found", products.length, "products");

  let updated = 0;
  for (const p of products) {
    const old = Number(p.totalStock || 0);
    const calc = (p.sizes || []).reduce((s, it) => s + (Number(it.stock || 0)), 0);
    if (old !== calc) {
      p.totalStock = calc;
      await p.save();
      updated++;
      console.log(`Updated ${p._id} totalStock ${old} -> ${calc}`);
    }
  }

  console.log("Done — updated", updated, "products.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});