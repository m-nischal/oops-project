// src/pages/api/orders/index.js
import dbConnect from "lib/dbConnect.js";
import OrderService from "services/orderService.js";
import { OrderError, InsufficientStockError } from "services/orderService.js";
import Product from "models/Product.js";
import mongoose from "mongoose"; // Import mongoose

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const payload = req.body;
  if (!payload || !payload.customer || !Array.isArray(payload.items) || payload.items.length === 0) {
    return res.status(400).json({ error: "Invalid order payload: customer and items are required." });
  }

  let session = null; // We'll declare session here, though OrderService handles its own
  try {
    // --- THIS IS THE NEW, CORRECTED LOGIC ---

    // 1. Find the sellerId for this order.
    // We will assume all items in a single order come from the same seller.
    const firstProductId = payload.items[0].productId;
    if (!firstProductId) {
      return res.status(400).json({ error: "Invalid cart items." });
    }

    const firstProduct = await Product.findById(firstProductId).select("ownerId").lean();
    if (!firstProduct || !firstProduct.ownerId) {
      return res.status(400).json({ error: "Could not find product owner (seller)." });
    }
    
    // The 'ownerId' of the product is the 'sellerId' for the order
    const sellerId = firstProduct.ownerId; 

    // 2. Call the powerful OrderService to create the order.
    //    It will handle the database transaction and stock decrement automatically.
    //    We pass the customer, items, and the sellerId we just found.
    const orderDoc = await OrderService.createOrder(
      payload.customer,
      payload.items,
      sellerId // This is the new required field
    );

    // 3. Success!
    //    Note: The old API returned { orderId: ... }, the new one returns the full order doc.
    //    Your frontend (checkout.js) will handle this fine.
    return res.status(201).json(orderDoc); // Return the full order object

  } catch (err) {
    console.error("Failed to create order:", err);

    // Handle specific errors from our OrderService
    if (err instanceof InsufficientStockError) {
      return res.status(409).json({ error: "Insufficient stock", message: err.message });
    }
    if (err instanceof OrderError) {
      return res.status(400).json({ error: "Invalid order", message: err.message });
    }
    
    // Handle the old transaction failure (just in case)
    if (err.message.includes("Transaction failed")) {
       return res.status(500).json({ error: "Order failed, please try again." });
    }

    // Generic fallback
    return res.status(500).json({ error: "Failed to place order", message: err.message });
  }
}