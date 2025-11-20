// src/pages/api/retailer/place-wholesale-order.js
import dbConnect from "../../../lib/dbConnect";
import OrderService from "../../../services/orderService";
import Product from "../../../models/Product";
import { verifyToken } from "../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // 1. Auth Check
  let payload;
  try {
    payload = verifyToken(req); //
    if (!payload || payload.role !== "RETAILER") {
      return res.status(401).json({ error: "Unauthorized. Retailers only." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const retailerId = payload.id;
  const retailerEmail = payload.email || "retailer@example.com"; // We might need to fetch the user to get the real email

  // 2. Parse Body
  // Body: { productId, qty, size }
  const { productId, qty, size } = req.body;
  
  if (!productId || !qty || !size) {
    return res.status(400).json({ error: "Product, Quantity, and Size are required." });
  }

  try {
    // 3. Find the Product to get the Seller (Wholesaler) ID
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const sellerId = product.ownerId; // This is the Wholesaler

    // 4. Construct Order Data
    const customerData = {
      name: "Retailer Order", // ideally fetch Retailer name
      email: retailerEmail,
      phone: "", 
      address: "Retailer Store Address", // Should come from retailer profile
    };

    const items = [{
      productId: productId,
      qty: Number(qty),
      sizeLabel: size
    }];

    // 5. Create Order using Service
    // Pass retailerId as the 4th arg so the service knows WHO bought it
    const order = await OrderService.createOrder(customerData, items, sellerId, retailerId);

    return res.status(201).json({ 
      message: "Order placed successfully with Wholesaler", 
      orderId: order._id 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Failed to place order" });
  }
}