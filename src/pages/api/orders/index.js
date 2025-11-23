// src/pages/api/orders/index.js
import dbConnect from "../../../lib/dbConnect.js";
import OrderService from "../../../services/orderService.js";
import { OrderError, InsufficientStockError } from "../../../services/orderService.js";
import Product from "../../../models/Product.js";
import { getSessionFromReq } from "../../../lib/authHelpers.js";

export default async function handler(req, res) {
  await dbConnect();

  const session = await getSessionFromReq(req);
  const userId = session?.user?._id || null;

  // --- GET: LIST USER ORDERS ---
  if (req.method === "GET") {
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await OrderService.listOrders({ 
        userId: userId, 
        page, 
        limit 
      });
      return res.json(result);
    } catch (e) {
      console.error("Error fetching orders:", e);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }
  }

  // --- POST: CREATE ORDER ---
  if (req.method === "POST") {
    // 1. SECURITY CHECK: Enforce Login
    // This prevents "userId: null" (orphan) orders.
    if (!userId) {
        return res.status(401).json({ 
            error: "Authentication required.", 
            message: "You must be logged in to place an order." 
        });
    }

    const payload = req.body;
    if (!payload || !payload.customer || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: "Invalid order payload: customer and items are required." });
    }

    try {
      const productIds = payload.items.map(i => i.productId);
      const products = await Product.find({ _id: { $in: productIds } }).select("ownerId name").lean();
      
      const productMap = {};
      products.forEach(p => { productMap[String(p._id)] = p; });

      const ordersBySeller = {};

      for (const item of payload.items) {
          const product = productMap[String(item.productId)];
          if (!product) {
              throw new OrderError(`Product not found: ${item.name}`);
          }
          
          const sellerId = String(product.ownerId);
          
          if (!ordersBySeller[sellerId]) {
              ordersBySeller[sellerId] = [];
          }
          ordersBySeller[sellerId].push(item);
      }

      const createdOrders = [];
      
      for (const [sellerId, items] of Object.entries(ordersBySeller)) {
          const orderDoc = await OrderService.createOrder(
              payload.customer,
              items,
              sellerId,
              userId // Now guaranteed to be present
          );
          createdOrders.push(orderDoc);
      }

      return res.status(201).json({ 
          ok: true, 
          orders: createdOrders,
          message: `Successfully created ${createdOrders.length} order(s).`
      });

    } catch (err) {
      console.error("Failed to create order:", err);

      if (err instanceof InsufficientStockError) {
        return res.status(409).json({ error: "Insufficient stock", message: err.message });
      }
      if (err instanceof OrderError) {
        return res.status(400).json({ error: "Invalid order", message: err.message });
      }
      
      return res.status(500).json({ error: "Failed to place order", message: err.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: "Method not allowed" });
}