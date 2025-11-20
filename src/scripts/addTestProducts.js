// scripts/addTestProducts.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Category from "../src/models/categoryModel.js";
import Product from "../src/models/Product.js";

/** helpers */
function slugify(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, "-");
}

async function ensureCategoryByPath(pathParts = [], opts = {}) {
  // pathParts example: ["clothing","men","shirts"]
  // returns the category document (creates ancestors if missing)
  let parent = null;
  let accumulated = "";
  for (const part of pathParts) {
    const slug = slugify(part);
    accumulated = accumulated ? `${accumulated}/${slug}` : `/${slug}`;
    let cat = await Category.findOne({ path: accumulated });
    if (!cat) {
      cat = await Category.create({
        name: part,
        slug,
        parent: parent ? parent._id : null,
        path: accumulated,
        domain: opts.domain || "clothing",
        storefronts: opts.storefronts || ["livemart"],
        meta: { description: opts.description || "" }
      });
      // eslint-disable-next-line no-console
      console.log("Created category:", accumulated);
    }
    parent = cat;
  }
  return parent;
}

async function createProduct(p) {
  // avoids duplicates by sku or name
  const exists = p.sku ? await Product.findOne({ sku: p.sku }) : await Product.findOne({ name: p.name });
  if (exists) {
    console.log("Skipping existing product:", p.name);
    return exists;
  }
  const doc = await Product.create(p);
  console.log("Created product:", doc.name);
  return doc;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // --- Clothing tree (ensure leaves exist) ---
  const clothing = await ensureCategoryByPath(["clothing"]);
  const men = await ensureCategoryByPath(["clothing","men"]);
  const women = await ensureCategoryByPath(["clothing","women"]);
  const kids = await ensureCategoryByPath(["clothing","kids"]);

  const leafNames = ["Shirts","Tshirts","Jeans","Joggers","Shorts"];
  const menLeaves = {};
  const womenLeaves = {};
  const kidsLeaves = {};

  for (const name of leafNames) {
    menLeaves[name] = await ensureCategoryByPath(["clothing","men", name]);
    womenLeaves[name] = await ensureCategoryByPath(["clothing","women", name]);
    kidsLeaves[name] = await ensureCategoryByPath(["clothing","kids", name]);
  }

  // --- Tech categories ---
  const techRoot = await ensureCategoryByPath(["tech"], { domain: "tech" });
  const phones = await ensureCategoryByPath(["tech","phones"], { domain: "tech" });
  const laptops = await ensureCategoryByPath(["tech","laptops"], { domain: "tech" });
  const accessories = await ensureCategoryByPath(["tech","accessories"], { domain: "tech" });

  // --- Grocery (FreshMart) categories ---
  const groceryRoot = await ensureCategoryByPath(["grocery"], { domain: "grocery", storefronts: ["freshmart"] });
  const produce = await ensureCategoryByPath(["grocery","produce"], { domain: "grocery", storefronts: ["freshmart"] });
  const dairy = await ensureCategoryByPath(["grocery","dairy"], { domain: "grocery", storefronts: ["freshmart"] });
  const snacks = await ensureCategoryByPath(["grocery","snacks"], { domain: "grocery", storefronts: ["freshmart"] });

  // --- Create sample products ---

  // Clothing — Men Shirts
  await createProduct({
    name: "Classic Oxford Shirt - Blue (Men)",
    sku: "CLO-M-SHIRT-001",
    price: 1299,
    originalPrice: 1599,
    description: "Classic cotton oxford shirt for men.",
    images: ["/images/clothing/mens/oxford-blue.jpg"],
    sizes: [{ size: "S", stock: 10 }, { size: "M", stock: 8 }, { size: "L", stock: 5 }],
    categories: [menLeaves["Shirts"]._id],
    primaryCategory: menLeaves["Shirts"]._id,
    storefronts: ["livemart"],
    productType: "clothing"
  });

  // ... rest unchanged ...
  console.log("Seeding complete.");
  await mongoose.disconnect();
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
