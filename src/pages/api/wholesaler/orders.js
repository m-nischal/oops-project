// src/pages/api/wholesaler/orders.js
import dbConnect from "../../../lib/dbConnect";
import Order from "../../../models/orderModel";
import { verifyToken } from "../../../lib/auth"; //
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // --- 1. Real Authentication ---
  let payload;
  try {
    payload = verifyToken(req); //
    
    // --- THIS IS THE ONLY CHANGE ---
    // We now check for the 'WHOLESALER' role
    if (!payload || (payload.role !== "WHOLESALER")) {
      return res.status(401).json({ error: "Unauthorized. You must be a Wholesaler." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  const sellerId = new mongoose.Types.ObjectId(payload.id); // Get the logged-in seller's ID

  // --- 2. Fetch Paginated Orders (Logic is identical) ---
  try {
    // Get pagination and filtering params from the query
    const { 
      page = 1, 
      limit = 10, 
      status = "", 
      sort = "createdAt:desc" 
    } = req.query;

    const filter = {
      sellerId: sellerId, // This is the key! Only find orders for this seller
    };

    if (status) {
      filter.status = status;
    }
    
    const sortOptions = {};
    const [sortField, sortOrder] = sort.split(':');
    sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch the orders
    const orders = await Order.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();
      
    // Get the total count for pagination
    const total = await Order.countDocuments(filter);

    return res.status(200).json({
      items: orders,
      total,
      page: Number(page),
      limit: Number(limit),
    });

  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}