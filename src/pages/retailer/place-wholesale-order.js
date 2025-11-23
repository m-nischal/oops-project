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
    payload = verifyToken(req);
    if (!payload || payload.role !== "RETAILER") {
      return res.status(401).json({ error: "Unauthorized. Retailers only." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const retailerId = payload.id;
  const retailerEmail = payload.email || "retailer@example.com"; 

  // 2. Parse Body (NOW INCLUDES PAYMENT)
  const { productId, qty, size, payment } = req.body;
  
  if (!productId || !qty || !size) {
    return res.status(400).json({ error: "Product, Quantity, and Size are required." });
  }

  try {
    // 3. Find the Product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const minQty = product.minOrderQuantity || 1;
    if (Number(qty) < minQty) {
        return res.status(400).json({ 
            error: `Order quantity ${qty} is below the minimum of ${minQty} for this product.` 
        });
    }

    const sellerId = product.ownerId;

    // 4. Construct Order Data
    const customerData = {
      name: "Retailer Order",
      email: retailerEmail,
      phone: "", 
      address: "Retailer Store Address", 
    };

    const items = [{
      productId: productId,
      qty: Number(qty),
      sizeLabel: size
    }];

    // 5. Create Order (using Service)
    const order = await OrderService.createOrder(customerData, items, sellerId, retailerId);
    
    // 6. Update Order as PAID if payment details exist
    if (order && payment) {
        order.status = "paid"; // Or directly 'processing' if you prefer
        order.statusHistory.push({
            status: "paid",
            at: new Date(),
            note: `Payment successful (${payment.method})`
        });
        
        order.payment = {
            paymentId: payment.paymentId,
            method: payment.method,
            paidAt: payment.paidAt || new Date(),
            provider: "MOCK_GATEWAY"
        };
        
        await order.save();
    }

    return res.status(201).json({ 
      message: "Order placed successfully", 
      orderId: order._id 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Failed to place order" });
  }
}