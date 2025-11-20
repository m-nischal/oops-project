// src/pages/api/products/estimate-delivery.js
// src/pages/api/products/estimate-delivery.js
import dbConnect from "lib/dbConnect";
import Product from "models/Product.js";
import mongoose from "mongoose";


export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).end();

  // Body: { productId, customerLocation: { city, state, country, pincode } }
  const { productId, customerLocation } = req.body;
  if (!productId || !mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ error: "productId required" });
  }
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: "product not found" });

  const estimation = product.estimateDeliveryTo(customerLocation || {});
  return res.status(200).json({ estimation });
}
