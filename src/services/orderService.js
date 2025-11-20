// src/services/orderService.js
import mongoose from "mongoose";
import Order from "models/orderModel.js";
import Product from "models/Product.js";
import User from "models/User.js"; // Required to check buyer role
import InventoryService, { InsufficientStockError as InvInsufficientStockError } from "./inventory.js";

/**
 * @file OrderService
 * @brief Order creation and lifecycle helpers (get, list, status updates, refunds).
 *
 * This service coordinates with InventoryService for stock changes and uses
 * mongoose transactions to ensure atomic operations when modifying inventory
 * and orders together.
 */

/** Base order error */
class OrderError extends Error {}
/** Thrown when stock cannot be satisfied during create/update */
class InsufficientStockError extends OrderError {}
/** Thrown when invalid input supplied */
class InvalidOrderParamsError extends OrderError {}

export default class OrderService {
  /**
   * Create an order atomically: validates items, decrements stock, and saves order doc.
   *
   * On success the saved Mongoose Order document is returned.
   *
   * @param {Object} customer - { name, email, phone, address, customerLocation? }
   * @param {Array<{productId, sizeLabel, qty}>} items
   * @param {String} sellerId - The ID of the seller (Retailer or Wholesaler)
   * @param {String} userId - The ID of the buyer (if they are a registered Retailer)
   * @returns {Promise<Object>} saved Mongoose Order document
   * @throws {OrderError|InsufficientStockError|Error}
   */
  static async createOrder(customer = {}, items = [], sellerId = null, userId = null)  {
    if (!Array.isArray(items) || items.length === 0) {
      throw new OrderError("Order must contain at least one item");
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 1) Load product docs for all requested items (inside session) as model instances (no .lean())
      const productIds = [...new Set(items.map(i => String(i.productId)))];
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map(p => [String(p._id), p]));

      // 2) Build order items with snapshots and validation
      const orderItems = [];
      for (const it of items) {
        const pid = String(it.productId);
        const doc = productMap.get(pid);
        if (!doc) {
          throw new OrderError(`Product not found: ${pid}`);
        }

        const qty = Math.max(0, Math.floor(Number(it.qty || 0)));
        if (qty <= 0) throw new OrderError(`Invalid quantity for product ${pid}`);

        // For B2B (Retailer buying from Wholesaler), we might skip size checks if the wholesaler just sells "boxes"
        // But for now, let's assume strict sizing.
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
          // per-item estimatedDelivery will be added later if available
        });
      }

      // 3) Attempt multi-item atomic stock decrement using InventoryService (throws on insufficient)
      const inventoryItems = items.map(i => ({ productId: i.productId, sizeLabel: i.sizeLabel, qty: i.qty }));
      await InventoryService.decreaseStockForItems(inventoryItems, session);

      // 4) Calculate totals
      const subtotal = orderItems.reduce((s, it) => s + (it.subtotal || 0), 0);
      const shipping = 0;
      const tax = 0;
      const discount = 0;
      const total = subtotal + shipping + tax - discount;

      // ----------------------------
      // Compute estimated delivery
      // ----------------------------
      // Use the Product instance method estimateDeliveryTo(customerLocation) if available.
      const customerLocation = (customer && (customer.customerLocation || customer.location)) || {};
      const perItemEstimates = [];

      for (let idx = 0; idx < orderItems.length; idx++) {
        const it = orderItems[idx];
        const prod = productMap.get(String(it.productId));
        if (!prod) continue;

        try {
          // product.estimateDeliveryTo may be sync or async; await works for either
          const raw = await prod.estimateDeliveryTo(customerLocation || {});
          if (raw) {
            const date = raw instanceof Date ? raw : new Date(raw);
            if (!isNaN(date.getTime())) {
              perItemEstimates.push(date);
              // store per-item ETA on the snapshot (optional but useful)
              it.estimatedDelivery = date;
            }
          }
        } catch (e) {
          // ignore individual product estimator errors — preserve order creation
          console.warn(`estimateDeliveryTo failed for product ${prod._id}:`, e && e.message);
        }
      }

      // Aggregate: choose latest date so order ETA covers all items.
      let estimatedDelivery = null;
      if (perItemEstimates.length > 0) {
        estimatedDelivery = new Date(Math.max(...perItemEstimates.map(d => d.getTime())));
      } else {
        // fallback default (5 days)
        estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      }

      // 5) Create order doc (inside same transaction) with statusHistory and ETA
      const now = new Date();
      const initialStatus = "ordered"; // set to 'ordered' to reflect placed order
      const orderDoc = new Order({
        sellerId: sellerId,
        userId: userId, // IMPORTANT: Link the order to the Retailer (buyer)
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

      const saved = await orderDoc.save({ session });

      await session.commitTransaction();
      session.endSession();

      return saved;
    } catch (err) {
      try {
        await session.abortTransaction();
      } catch (_) {}
      session.endSession();

      // Map inventory error to domain-level InsufficientStockError
      if (err && (err.name === "InsufficientStockError" || err instanceof InvInsufficientStockError)) {
        throw new InsufficientStockError(err.message);
      }
      throw err;
    }
  }

  /**
   * Internal helper: Transfers stock to the Retailer's inventory when their B2B order is delivered.
   * * @private
   * @param {Object} order - The order document
   * @param {mongoose.ClientSession} session
   */
  static async _transferStockToRetailer(order, session) {
    // 1. Check if the buyer (userId) is actually a Retailer
    if (!order.userId) return; // Normal customer order, no stock transfer needed
    const buyer = await User.findById(order.userId).session(session);
    if (!buyer || buyer.role !== "RETAILER") return; // Only transfer stock for Retailers

    // 2. For each item in the order, add it to the Retailer's inventory
    for (const item of order.items) {
      // Check if Retailer already has a listing for this wholesale product
      let retailerProduct = await Product.findOne({
        ownerId: buyer._id,
        wholesaleSourceId: item.productId
      }).session(session);

      if (retailerProduct) {
        // A. Product exists -> Increase stock for that size
        const sizeIndex = retailerProduct.sizes.findIndex(s => s.size === item.sizeLabel);
        
        if (sizeIndex > -1) {
          // Size exists, increment stock
          await Product.updateOne(
            { _id: retailerProduct._id, "sizes.size": item.sizeLabel },
            { $inc: { "sizes.$.stock": item.qty } },
            { session }
          );
        } else {
          // Size doesn't exist, push new size to array
          await Product.updateOne(
            { _id: retailerProduct._id },
            { $push: { sizes: { size: item.sizeLabel, stock: item.qty, sku: `${retailerProduct.slug}-${item.sizeLabel}` } } },
            { session }
          );
        }
      } else {
        // B. Product doesn't exist -> Create it (Copy from Wholesaler)
        const wholesaleProduct = await Product.findById(item.productId).session(session);
        if (!wholesaleProduct) continue; 

        const newProductData = {
          ...wholesaleProduct.toObject(),
          _id: new mongoose.Types.ObjectId(), // New ID
          ownerId: buyer._id,
          wholesaleSourceId: wholesaleProduct._id,
          isPublished: false,
          // Set initial stock only for the ordered size
          sizes: [{ 
            size: item.sizeLabel, 
            stock: item.qty, 
            sku: `${wholesaleProduct.slug}-${item.sizeLabel}` 
          }],
          totalStock: item.qty,
          price: wholesaleProduct.price * 1.2, // Default markup 20% (Retailer can change later)
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        };
        
        // Create the product inside the session
        await Product.create([newProductData], { session });
      }
    }
  }

  /**
   * List orders with optional userId filter and pagination.
   * @param {Object} opts
   * @param {String} [opts.userId]
   * @param {number} [opts.page=1]
   * @param {number} [opts.limit=20]
   * @returns {Promise<{items:Object[], total:number, page:number, limit:number}>}
   */
  static async listOrders({ userId, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (userId) filter.userId = userId;
    const skip = Math.max(0, (Number(page) - 1) * Number(limit));
    const items = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
    const total = await Order.countDocuments(filter);
    return { items, total, page: Number(page), limit: Number(limit) };
  }

  /**
   * Get a single order by id.
   * @param {String} id - Order ObjectId/string
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    if (!id) throw new InvalidOrderParamsError("Order id is required");
    const doc = await Order.findById(id).lean();
    return doc || null;
  }

  /**
   * Internal helper: restore stock for an order's items inside a session.
   * If a product size doesn't exist, it will be created with the restored qty.
   *
   * @private
   * @param {Object[]} items - order items array (having productId, sizeLabel, qty)
   * @param {mongoose.ClientSession} session
   */
  static async _restoreStockForItems(items = [], session) {
    if (!Array.isArray(items) || items.length === 0) return;
    if (!session) throw new InvalidOrderParamsError("A mongoose session is required for restore");

    // For each item: attempt increaseStock; if increaseStock returns false (size missing) use addOrCreateSize then increaseStock
    for (const it of items) {
      const productId = it.productId;
      const sizeLabel = it.sizeLabel;
      const qty = it.qty;

      // attempt to increase (if size exists)
      const increased = await InventoryService.increaseStock(productId, sizeLabel, qty, session);
      if (!increased) {
        // ensure size exists and set stock (preserve existing behavior)
        await InventoryService.addOrCreateSize(productId, sizeLabel, qty, session);
      }
    }
  }

  /**
   * Update the status of an order. Optionally restore stock when transitioning to cancelled/refunded.
   *
   * This method now appends a statusHistory entry automatically for every transition.
   *
   * @param {String} id - order id
   * @param {String} newStatus - one of orderSchema enum statuses
   * @param {Object} [opts]
   * @param {Boolean} [opts.restoreStock=false] - when true and transitioning to cancelled/refunded, restores stock
   * @returns {Promise<Object>} updated order document
   * @throws {OrderError|InsufficientStockError|Error}
   */
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

      // restore stock if requested and moving to cancelled/refunded
      const shouldRestore = restoreStock && (newStatus === "cancelled" || newStatus === "refunded");
      if (shouldRestore) {
        await OrderService._restoreStockForItems(order.items, session);
      }

      // --- NEW: Trigger Stock Transfer on Delivery (for B2B) ---
      if (newStatus === "delivered" && prevStatus !== "delivered") {
         await OrderService._transferStockToRetailer(order, session);
      }

      // set status and append to statusHistory
      const now = new Date();
      order.status = newStatus;
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        status: newStatus,
        at: now,
        note: `Status changed from ${prevStatus} to ${newStatus}`
      });

      // Set fulfillment/top-level timestamps where relevant
      if (newStatus === "shipped") {
        order.fulfillment = order.fulfillment || {};
        order.fulfillment.shippedAt = order.fulfillment.shippedAt || now;
        order.shippedAt = order.shippedAt || now;
      } else if (newStatus === "out_for_delivery") {
        order.fulfillment = order.fulfillment || {};
        order.fulfillment.outForDeliveryAt = order.fulfillment.outForDeliveryAt || now;
        order.outForDeliveryAt = order.outForDeliveryAt || now;
      } else if (newStatus === "delivered") {
        order.fulfillment = order.fulfillment || {};
        order.fulfillment.deliveredAt = order.fulfillment.deliveredAt || now;
        order.deliveredAt = order.deliveredAt || now;
      } else if (newStatus === "refunded") {
        order.payment = order.payment || {};
        order.payment.refundedAt = order.payment.refundedAt || now;
        order.payment.refundInfo = order.payment.refundInfo || {};
        // keep meta/refund trace as well
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

  /**
   * Process a refund for an order id.
   *
   * Behavior:
   * - marks order.status = 'refunded'
   * - optionally restores stock (default true)
   * - records refund metadata in payment.refundInfo and meta.refund
   *
   * NOTE: actual payment-provider refund must be orchestrated outside or before calling this,
   * this method only reflects refund in DB and inventory.
   *
   * @param {String} id - order id
   * @param {Object} [opts]
   * @param {Boolean} [opts.restoreStock=true]
   * @param {Object} [opts.refundInfo] - arbitrary refund metadata (provider, refundId, amount, note)
   * @returns {Promise<Object>} updated order document
   * @throws {OrderError|InsufficientStockError|Error}
   */
  static async refundOrder(id, { restoreStock = true, refundInfo = {} } = {}) {
    if (!id) throw new InvalidOrderParamsError("Order id is required");

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const order = await Order.findById(id).session(session);
      if (!order) throw new OrderError("Order not found");

      if (order.status === "refunded") {
        // already refunded; nothing to do
        await session.commitTransaction();
        session.endSession();
        return order;
      }

      // Restore stock before marking refunded
      if (restoreStock) {
        await OrderService._restoreStockForItems(order.items, session);
      }

      // Mark payment/refund metadata and status
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
      order.payment.refundedAt = order.payment.refundedAt || now;

      // also keep refund trace in meta
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