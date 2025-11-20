// src/pages/api/categories/index.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../../../models/categoryModel.js";
dotenv.config();

export default async function handler(req, res) {
  if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGO_URI);

  if (req.method === "GET") {
    try {
      const { parentId, path, domain, storefront } = req.query;
      const filter = {};
      if (parentId === "null") filter.parent = null;
      else if (parentId) filter.parent = parentId;
      if (path) filter.path = path;
      if (domain) filter.domain = domain;
      if (storefront) filter.storefronts = storefront;
      const cats = await Category.find(filter).sort({ path: 1 }).lean();
      return res.status(200).json(cats);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch categories" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
