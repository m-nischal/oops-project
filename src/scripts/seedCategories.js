// scripts/seedCategories.js (outline)
import mongoose from "mongoose";
import Category from "../models/categoryModel.js";
import { createCategory } from "../helpers/categoryHelpers.js";
import dotenv from "dotenv";
dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // root
  const clothing = await createCategory({ name: "Clothing", parentId: null, domain: "clothing" });

  // children
  const men = await createCategory({ name: "Men", parentId: clothing._id });
  const women = await createCategory({ name: "Women", parentId: clothing._id });
  const kids = await createCategory({ name: "Kids", parentId: clothing._id });

  // leaf categories for each
  const leafNames = ["Shirts","Tshirts","Jeans","Joggers","Shorts"];
  for (const name of leafNames) {
    await createCategory({ name, parentId: men._id });
    await createCategory({ name, parentId: women._id });
    await createCategory({ name, parentId: kids._id });
  }

  console.log("Seeded clothing categories");
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
