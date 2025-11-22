import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product"; 
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid product id" });

  if (req.method === "GET") {
    try {
      // 1. Fetch the Retailer's Product
      const product = await Product.findById(id).lean();
      
      if (!product) return res.status(404).json({ error: "Not found" });

      // --- PROXY AVAILABILITY LOGIC START ---
      // If this product is linked to a Wholesaler (has wholesaleSourceId)
      if (product.wholesaleSourceId) {
        
        // Fetch the Wholesaler's original product to check THEIR stock
        const wholesaleProduct = await Product.findById(product.wholesaleSourceId)
          .select("sizes totalStock ownerId")
          .lean();

        if (wholesaleProduct) {
          // Calculate real stock from sizes
          const wholesaleTotal = (wholesaleProduct.sizes || []).reduce((acc, s) => acc + (s.stock || 0), 0);

          // Attach proxy info to the response
          product.proxyData = {
            hasProxySource: true,
            wholesalerId: wholesaleProduct.ownerId,
            stock: wholesaleTotal,
            sizes: wholesaleProduct.sizes || []
          };

          // MERGE STOCK: Combine Retailer Stock + Wholesaler Stock for the UI
          product.sizes = product.sizes.map(localSize => {
            const remoteSize = wholesaleProduct.sizes.find(ws => ws.size === localSize.size);
            const remoteStock = remoteSize ? (remoteSize.stock || 0) : 0;
            
            return {
              ...localSize,
              // The UI can now see: Local Stock (immediate) vs Proxy Stock (delayed)
              proxyStock: remoteStock, 
              totalAvailable: (localSize.stock || 0) + remoteStock
            };
          });
        }
      }
      // --- PROXY AVAILABILITY LOGIC END ---

      return res.status(200).json({ product });
    } catch (err) {
      console.error("Product Detail Error:", err);
      return res.status(500).json({ error: "Server Error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const payload = req.body;
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ error: "Not found" });
      
      delete payload._id;
      delete payload.ownerId;
      delete payload.wholesaleSourceId; 

      Object.assign(product, payload);
      
      if (product.recalculateStock) product.recalculateStock();
      
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