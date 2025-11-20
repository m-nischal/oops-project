// src/pages/api/products/[id].js
// src/pages/api/products/[id].js
import dbConnect from "../../../lib/dbConnect";
import Product from "models/Product.js";
import mongoose from "mongoose";


export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid product id" });

  if (req.method === "GET") {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: "Not found" });
    return res.status(200).json({ product });
  }

  if (req.method === "PUT") {
    try {
      const payload = req.body;
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ error: "Not found" });
      Object.assign(product, payload);
      product.recalculateStock();
      await product.save();
      return res.status(200).json({ product });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    await Product.findByIdAndDelete(id);
    return res.status(204).end();
  }

  return res.status(405).end();
}
