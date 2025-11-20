// src/pages/api/products/index.js
import dbConnect from "lib/dbConnect";
import CatalogService from "services/catalogService.js";
import ProductModel from "models/Product.js"; // used to compute count

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { categoryId, limit = 20, page = 1, q = "", inStockOnly, storefront } = req.query;
      const filter = {};

      if (categoryId) {
        // keep behaviour simple here; if you have getDescendantCategoryIds helper, call it.
        // NOTE: your previous code used filter.categories; keep same semantics if your model differs.
        filter.categories = { $in: [categoryId] };
      }
      if (storefront) filter.storefronts = storefront;
      if (inStockOnly === "true") {
        // ensure product has at least one size with stock > 0
        filter["sizes.stock"] = { $gt: 0 };
      }
      if (q) {
        // text search - only apply if you have text index
        filter.$text = { $search: q };
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Ask CatalogService to return lean results (plain objects) and compute totalStock for each
      const products = await CatalogService.getProducts(filter, { lean: true, limit: Number(limit), skip, sort: { createdAt: -1 } });

      // compute total count using Product model (preserve previous behaviour)
      const total = await ProductModel.countDocuments(filter);

      return res.status(200).json({ items: products, total });
    } catch (err) {
      console.error("GET /api/products error:", err && (err.stack || err));
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
