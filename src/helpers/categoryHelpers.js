// helpers/categoryHelpers.js
import Category from "../models/categoryModel.js";
import Product from "models/Product.js";
import mongoose from "mongoose";

/** normalize slug: lowercase, replace spaces with '-' */
function makeSlug(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, "-");
}

/** create category with computed path */
export async function createCategory({ name, parentId = null, domain = "clothing", storefronts = ["livemart"] }) {
  const slug = makeSlug(name);
  if (parentId) {
    const parent = await Category.findById(parentId);
    if (!parent) throw new Error("parent not found");
    const path = `${parent.path}/${slug}`;
    return Category.create({ name, slug, parent: parentId, path, domain, storefronts });
  } else {
    const path = `/${slug}`; // root category path
    return Category.create({ name, slug, parent: null, path, domain, storefronts });
  }
}

/** get category + all descendant ids */
export async function getCategoryAndDescendantIds(categoryId) {
  const cat = await Category.findById(categoryId);
  if (!cat) return [];
  const prefix = `${cat.path}`; // e.g. "/clothing/men"
  // find all categories whose path starts with prefix (including the category itself)
  const descendants = await Category.find({ path: { $regex: `^${prefix}(/|$)` } }, { _id: 1 });
  return descendants.map(d => d._id);
}

/** get products for a category (including descendants) */
export async function getProductsForCategory(categoryId, { storefront = "livemart", page = 1, limit = 24, inStockOnly = false } = {}) {
  const categoryIds = await getCategoryAndDescendantIds(categoryId);
  const filter = { categories: { $in: categoryIds }, storefronts: storefront };
  if (inStockOnly) filter["sizes.stock"] = { $gt: 0 };
  const skip = (page - 1) * limit;
  const products = await Product.find(filter).skip(skip).limit(limit).lean();
  const total = await Product.countDocuments(filter);
  return { products, total };
}
