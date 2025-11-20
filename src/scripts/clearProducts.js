// scripts/clearProducts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Product from "../src/models/Product.js";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await Product.deleteMany({});
  console.log("Deleted products count:", res.deletedCount);
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
