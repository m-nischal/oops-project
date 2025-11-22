import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/Product.js";
import User from "../models/User.js"; 
import Delivery from "../models/deliveryModel.js"; 
import InventoryService, { InsufficientStockError as InvInsufficientStockError } from "./inventory.js";
import { sendEmail } from "../lib/mailer.js"; // <--- NEW IMPORT

/** Base order error */
class OrderError extends Error {}
/** Thrown when stock cannot be satisfied during create/update */
class InsufficientStockError extends OrderError {}
/** Thrown when invalid input supplied */
class InvalidOrderParamsError extends OrderError {}

export default class OrderService {
  /**
   * Create an order atomically: validates items, decrements stock, and saves order doc.
   */
  static async createOrder(customer = {}, items = [], sellerId = null, userId = null)  {
    if (!Array.isArray(items) || items.length === 0) {
      throw new OrderError("Order must contain at least one item");
    }

    const session = await mongoose.startSession();
    let savedOrder = null;

    try {
      session.startTransaction();

      // 1) Load product docs
      const productIds = [...new Set(items.map(i => String(i.productId)))];
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map(p => [String(p._id), p]));

      // 2) Build order items
      const orderItems = [];
      for (const it of items) {
        const pid = String(it.productId);
        const doc = productMap.get(pid);
        if (!doc) {
          throw new OrderError(`Product not found: ${pid}`);
        }

        const qty = Math.max(0, Math.floor(Number(it.qty || 0)));
        if (qty <= 0) throw new OrderError(`Invalid quantity for product ${pid}`);

        const size = Array.isArray(doc.sizes) ? doc.sizes.find(s => s.size === it.sizeLabel || s.size === it.size) : null;
        if (!size) throw new OrderError(`Size '${it.sizeLabel}' not found for product ${pid}`);

        const unitPrice = Number(size?.price ?? doc.price ?? 0);
        const subtotal = unitPrice * qty;

        orderItems.push({
          productId: doc._id,
          name: doc.name,
          sizeLabel: it.sizeLabel,
          qty,
          unitPrice,
          subtotal
        });
      }

      // 3) Attempt multi-item atomic stock decrement
      const inventoryItems = items.map(i => ({ productId: i.productId, sizeLabel: i.sizeLabel, qty: i.qty }));
      await InventoryService.decreaseStockForItems(inventoryItems, session);

      // 4) Calculate totals
      const subtotal = orderItems.reduce((s, it) => s + (it.subtotal || 0), 0);
      const shipping = 0;
      const tax = 0;
      const discount = 0;
      const total = subtotal + shipping + tax - discount;

      // Compute estimated delivery
      const customerLocation = (customer && (customer.customerLocation || customer.location)) || {};
      const perItemEstimates = [];

      for (let idx = 0; idx < orderItems.length; idx++) {
        const it = orderItems[idx];
        const prod = productMap.get(String(it.productId));
        if (!prod) continue;

        try {
          const raw = await prod.estimateDeliveryTo(customerLocation || {});
          if (raw) {
            const date = raw instanceof Date ? raw : new Date(raw);
            if (!isNaN(date.getTime())) {
              perItemEstimates.push(date);
              it.estimatedDelivery = date;
            }
          }
        } catch (e) {
          console.warn(`estimateDeliveryTo failed for product ${prod._id}:`, e && e.message);
        }
      }

      let estimatedDelivery = null;
      if (perItemEstimates.length > 0) {
        estimatedDelivery = new Date(Math.max(...perItemEstimates.map(d => d.getTime())));
      } else {
        estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      }

      // 5) Create order doc
      const now = new Date();
      const initialStatus = "ordered"; 
      const orderDoc = new Order({
        sellerId: sellerId,
        userId: userId, 
        customer,
        items: orderItems,
        subtotal,
        shipping,
        tax,
        discount,
        total,
        status: initialStatus,
        statusHistory: [{ status: initialStatus, at: now, note: "Order placed" }],
        estimatedDelivery
      });

      savedOrder = await orderDoc.save({ session });

      await session.commitTransaction();
      session.endSession();

    } catch (err) {
      try {
        await session.abortTransaction();
      } catch (_) {}
      session.endSession();

      if (err && (err.name === "InsufficientStockError" || err instanceof InvInsufficientStockError)) {
        throw new InsufficientStockError(err.message);
      }
      throw err;
    }

    // --- NEW LOGIC: Check for Proxy Orders (Negative Stock) & Notify Retailer ---
    // We run this AFTER the transaction commits so we don't block the user or fail the order if email fails.
    try {
      const backorderedItems = [];
      
      // Re-check the stock of items we just sold
      for (const item of items) {
         const freshProd = await Product.findById(item.productId);
         if (freshProd) {
            const sizeObj = freshProd.sizes.find(s => s.size === item.sizeLabel);
            // If stock is negative, it means we sold via Proxy Availability
            if (sizeObj && sizeObj.stock < 0) {
               backorderedItems.push({
                 name: freshProd.name,
                 size: item.sizeLabel,
                 soldQty: item.qty,
                 currentStock: sizeObj.stock
               });
            }
         }
      }

      if (backorderedItems.length > 0 && sellerId) {
          const retailer = await User.findById(sellerId);
          
          if (retailer && retailer.email) {
              console.log(`[Proxy Alert] Sending email to retailer: ${retailer.email}`);
              
              const itemsHtml = backorderedItems.map(i => 
                `<li style="margin-bottom: 8px;">
                   <strong>${i.name}</strong> (Size: ${i.size})<br/>
                   Sold: ${i.soldQty} | Current Stock: <span style="color:red">${i.currentStock}</span>
                 </li>`
              ).join("");

              await sendEmail({
                  to: retailer.email,
                  subject: `⚠️ Action Required: Proxy Order Received #${savedOrder._id.toString().slice(-6)}`,
                  text: `You have received an order for items that are currently out of stock. Please purchase stock from the Wholesaler immediately.`,
                  html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;">
                      <h2 style="color: #d32f2f;">Proxy Order Alert</h2>
                      <p>Hello <strong>${retailer.name}</strong>,</p>
                      <p>You have received a new customer order <strong>#${savedOrder._id}</strong> containing items that are out of stock in your local inventory.</p>
                      
                      <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <strong>Action Required:</strong> Please log in to your dashboard and purchase stock from the Wholesaler immediately to fulfill this order.
                      </div>

                      <h3>Items Requiring Restock:</h3>
                      <ul>${itemsHtml}</ul>
                      
                      <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        This is an automated notification from LiveMart.
                      </p>
                    </div>
                  `
              });
          }
      }
    } catch (notifyErr) {
       console.error("Failed to send proxy notification email (Order valid, email failed):", notifyErr);
    }
    // -------------------------------------------------------------------------

    return savedOrder;
  }

  /**
   * Internal helper: Transfers stock to the Retailer's inventory when their B2B order is delivered.
   */
  static async _transferStockToRetailer(order, session) {
    if (!order.userId) return; 
    const buyer = await User.findById(order.userId).session(session);
    if (!buyer || buyer.role !== "RETAILER") return; 

    for (const item of order.items) {
      let retailerProduct = await Product.findOne({
        ownerId: buyer._id,
        wholesaleSourceId: item.productId
      }).session(session);

      if (retailerProduct) {
        const sizeIndex = retailerProduct.sizes.findIndex(s => s.size === item.sizeLabel);
        if (sizeIndex > -1) {
          await Product.updateOne(
            { _id: retailerProduct._id, "sizes.size": item.sizeLabel },
            { $inc: { "sizes.$.stock": item.qty } },
            { session }
          );
        } else {
          await Product.updateOne(
            { _id: retailerProduct._id },
            { $push: { sizes: { size: item.sizeLabel, stock: item.qty, sku: `${retailerProduct.slug}-${item.sizeLabel}` } } },
            { session }
          );
        }
      } else {
        const wholesaleProduct = await Product.findById(item.productId).session(session);
        if (!wholesaleProduct) continue; 

        // --- FIX: Clean source object ---
        const sourceObj = wholesaleProduct.toObject();
        delete sourceObj._id;
        delete sourceObj.id;
        delete sourceObj.ownerId;
        delete sourceObj.wholesaleSourceId; 
        delete sourceObj.createdAt;
        delete sourceObj.updatedAt;
        delete sourceObj.__v;

        const newProductData = {
          ...sourceObj,
          _id: new mongoose.Types.ObjectId(),
          ownerId: buyer._id,
          wholesaleSourceId: wholesaleProduct._id, 
          isPublished: false,
          sizes: [{ 
            size: item.sizeLabel, 
            stock: item.qty, 
            sku: `${wholesaleProduct.slug}-${item.sizeLabel}` 
          }],
          totalStock: item.qty,
          price: wholesaleProduct.price * 1.2, 
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        };
        
        await Product.create([newProductData], { session });
      }
    }
  }

  static async listOrders({ userId, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (userId) filter.userId = userId;
    const skip = Math.max(0, (Number(page) - 1) * Number(limit));
    const items = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Order.countDocuments(filter);
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  static async getById(id) {
    if (!id) throw new InvalidOrderParamsError("Order id is required");
    const doc = await Order.findById(id).lean();
    return doc || null;
  }

  static async _restoreStockForItems(items = [], session) {
    if (!Array.isArray(items) || items.length === 0) return;
    if (!session) throw new InvalidOrderParamsError("A mongoose session is required for restore");

    for (const it of items) {
      const increased = await InventoryService.increaseStock(it.productId, it.sizeLabel, it.qty, session);
      if (!increased) {
        await InventoryService.addOrCreateSize(it.productId, it.sizeLabel, it.qty, session);
      }
    }
  }

  static async updateStatus(id, newStatus, { restoreStock = false } = {}) {
    if (!id) throw new InvalidOrderParamsError("Order id is required");
    if (!newStatus || typeof newStatus !== "string") throw new InvalidOrderParamsError("newStatus is required");

    const VALID_STATUSES = ["created","ordered","pending","paid","processing","shipped","out_for_delivery","delivered","cancelled","refunded"];
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new InvalidOrderParamsError(`Invalid status: ${newStatus}`);
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const order = await Order.findById(id).session(session);
      if (!order) throw new OrderError("Order not found");

      const prevStatus = order.status;
      const now = new Date();

      // Restore stock if cancelled
      if (restoreStock && (newStatus === "cancelled" || newStatus === "refunded")) {
        await OrderService._restoreStockForItems(order.items, session);
      }

      // --- Trigger Stock Transfer on Delivery (for B2B) ---
      if (newStatus === "delivered" && prevStatus !== "delivered") {
         await OrderService._transferStockToRetailer(order, session);
      }

      // Update status
      order.status = newStatus;
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: newStatus,
        at: now,
        note: `Status changed from ${prevStatus} to ${newStatus}`
      });

      // --- AUTO-CREATE DELIVERY LOGIC ---
      if (newStatus === "shipped") {
        order.shippedAt = now;
        order.fulfillment = order.fulfillment || {};
        order.fulfillment.shippedAt = now;
        
        const isB2B = !!order.userId; 
        const fromType = isB2B ? "WHOLESALER" : "RETAILER";
        const toType = isB2B ? "RETAILER" : "CUSTOMER";
        
        const existingDelivery = await Delivery.findOne({ orderRef: order._id }).session(session);
        
        if (!existingDelivery) {
            await Delivery.create([{
                orderRef: order._id,
                externalOrderId: order._id.toString(),
                fromType: fromType, 
                toType: toType,     
                pickup: { 
                    address: "Seller Warehouse", 
                    name: "Seller Store"
                },
                dropoff: {
                    name: order.customer.name,
                    phone: order.customer.phone,
                    email: order.customer.email,
                    address: order.customer.address
                },
                status: "PENDING", 
                notes: "Auto-generated from Order Shipped status",
                deliveryFee: (order.total || 0) * 0.05,
                total: order.total || 0,
                items: order.items.map(i => i.name)
            }], { session });
        }
      }

      if (newStatus === "out_for_delivery") {
        order.outForDeliveryAt = now;
        order.fulfillment = order.fulfillment || {};
        order.fulfillment.outForDeliveryAt = now;
      } 
      else if (newStatus === "delivered") {
        order.deliveredAt = now;
        order.fulfillment = order.fulfillment || {};
        order.fulfillment.deliveredAt = now;
      } 
      else if (newStatus === "refunded") {
        order.payment = order.payment || {};
        order.payment.refundedAt = now;
        order.meta = order.meta || {};
        order.meta.refund = Object.assign({}, order.meta.refund || {}, { at: now });
      }

      const saved = await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return saved;
    } catch (err) {
      try {
        await session.abortTransaction();
      } catch (_) {}
      session.endSession();

      if (err && (err.name === "InsufficientStockError" || err instanceof InvInsufficientStockError)) {
        throw new InsufficientStockError(err.message);
      }
      throw err;
    }
  }

  static async refundOrder(id, { restoreStock = true, refundInfo = {} } = {}) {
    if (!id) throw new InvalidOrderParamsError("Order id is required");

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const order = await Order.findById(id).session(session);
      if (!order) throw new OrderError("Order not found");

      if (order.status === "refunded") {
        await session.commitTransaction();
        session.endSession();
        return order;
      }

      if (restoreStock) {
        await OrderService._restoreStockForItems(order.items, session);
      }

      const now = new Date();
      order.status = "refunded";
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: "refunded",
        at: now,
        note: "Order refunded"
      });

      order.payment = order.payment || {};
      order.payment.refundInfo = Object.assign({}, order.payment.refundInfo || {}, refundInfo);
      order.payment.refundedAt = now;

      order.meta = order.meta || {};
      order.meta.refund = Object.assign({}, order.meta.refund || {}, { at: now, info: refundInfo });

      const saved = await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return saved;
    } catch (err) {
      try {
        await session.abortTransaction();
      } catch (_) {}
      session.endSession();

      if (err && (err.name === "InsufficientStockError" || err instanceof InvInsufficientStockError)) {
        throw new InsufficientStockError(err.message);
      }
      throw err;
    }
  }
}

export { OrderError, InsufficientStockError, InvalidOrderParamsError };