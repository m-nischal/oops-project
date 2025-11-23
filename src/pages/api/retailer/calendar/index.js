import dbConnect from "../../../../lib/dbConnect";
import Reminder from "../../../../models/Reminder";
import Order from "../../../../models/orderModel";
import { verifyToken } from "../../../../lib/auth";
import mongoose from "mongoose";

export default async function handler(req, res) {
  await dbConnect();
  
  // 1. Auth Check
  let payload;
  try {
    payload = verifyToken(req);
    if (!payload || payload.role !== "RETAILER") {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const retailerId = new mongoose.Types.ObjectId(payload.id);

  // --- GET: Fetch Schedule (Orders + Reminders) ---
  if (req.method === "GET") {
    try {
      const { start, end } = req.query;
      
      // Date Range Filter
      const dateFilter = {};
      if (start && end) {
          dateFilter.$gte = new Date(start);
          dateFilter.$lte = new Date(end);
      } else {
          // Default: Next 30 days
          dateFilter.$gte = new Date();
          dateFilter.$lte = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      // A. Fetch Custom Reminders
      const reminders = await Reminder.find({ 
          ownerId: retailerId,
          date: dateFilter
      }).lean();

      // B. Fetch Incoming Orders (Sales) - Use estimatedDelivery or createdAt
      const incomingOrders = await Order.find({
          sellerId: retailerId,
          createdAt: dateFilter // Simplified: Using creation date as the "event" for now
      }).select("customer total status createdAt").lean();

      // C. Combine & Format
      const events = [
          ...reminders.map(r => ({
              id: r._id,
              title: r.title,
              date: r.date,
              type: 'reminder',
              meta: { description: r.description, isCompleted: r.isCompleted }
          })),
          ...incomingOrders.map(o => ({
              id: o._id,
              title: `Order #${o._id.toString().slice(-4)} (${o.customer?.name || 'Cust'})`,
              date: o.createdAt,
              type: 'order',
              meta: { status: o.status, total: o.total }
          }))
      ];

      // Sort by Date
      events.sort((a, b) => new Date(a.date) - new Date(b.date));

      return res.status(200).json({ events });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to load calendar" });
    }
  }

  // --- POST: Add New Reminder ---
  if (req.method === "POST") {
      try {
          const { title, date, description } = req.body;
          if (!title || !date) return res.status(400).json({ error: "Title and Date required" });

          const newReminder = await Reminder.create({
              ownerId: retailerId,
              title,
              date: new Date(date),
              description,
              type: "CUSTOM"
          });

          return res.status(201).json({ success: true, reminder: newReminder });
      } catch (err) {
          return res.status(500).json({ error: err.message });
      }
  }

  // --- DELETE: Remove Reminder ---
  if (req.method === "DELETE") {
      const { id } = req.query;
      await Reminder.findOneAndDelete({ _id: id, ownerId: retailerId });
      return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}