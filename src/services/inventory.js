// src/services/inventory.js
import mongoose from "mongoose";
import Product from "../models/Product.js";

/** Base error for inventory operations */
class InventoryError extends Error {}
/** Thrown when requested qty cannot be satisfied */
class InsufficientStockError extends InventoryError {}
/** Thrown when input params are invalid */
class InvalidParamsError extends InventoryError {}

export default class InventoryService {
  /**
   * Normalize size label defensively.
   * @private
   * @param {any} sizeLabel
   * @returns {string}
   */
  static _normalizeLabel(sizeLabel) {
    return sizeLabel === undefined || sizeLabel === null ? "" : String(sizeLabel).trim();
  }

  /**
   * Validate and normalize params for single-item operations.
   * Throws InvalidParamsError on invalid input.
   * @private
   * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @param {Number} qty
   * @returns {{productId:*, sizeLabel:string, qty:number}}
   */
  static _validateParams(productId, sizeLabel, qty) {
    if (!productId) throw new InvalidParamsError("productId is required");
    const label = this._normalizeLabel(sizeLabel);
    if (!label) throw new InvalidParamsError("sizeLabel is required");
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) throw new InvalidParamsError("qty must be a positive number");
    return { productId, sizeLabel: label, qty: Math.floor(q) };
  }

  /**
   * Decrease stock for a specific product size by qty.
   * - Tries strict decrement first (stock >= qty).
   * - If strict fails, checks if product is a Proxy (linked to Wholesaler).
   * - If Proxy, allows decrement into negative stock (Backorder).
   * * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @param {Number} qty
   * @param {mongoose.ClientSession} [session]
   * @returns {Promise<boolean>} true if modified
   * @throws {InvalidParamsError|InsufficientStockError}
   */
  static async decreaseStock(productId, sizeLabel, qty, session = null) {
    const params = this._validateParams(productId, sizeLabel, qty);
    const update = { $inc: { "sizes.$.stock": -params.qty } };
    const options = session ? { session } : {};

    // 1. Try STRICT decrement (Standard behavior: Must have enough stock)
    const strictFilter = {
      _id: params.productId,
      "sizes.size": params.sizeLabel,
      "sizes.stock": { $gte: params.qty }
    };

    const res = await Product.updateOne(strictFilter, update, options);
    
    // If strict update succeeded, we are done.
    if ((res.modifiedCount ?? res.nModified ?? 0) > 0) return true;

    // 2. If failed, check if it's a PROXY PRODUCT (Linked to Wholesaler)
    // We need to fetch the doc to check 'wholesaleSourceId'
    const product = await Product.findById(params.productId).session(session).select("wholesaleSourceId name").lean();
    
    if (product && product.wholesaleSourceId) {
        // It is a proxy item! Allow "Backorder" (Stock becomes negative).
        // Remove the $gte check from the filter.
        const forceFilter = { 
            _id: params.productId, 
            "sizes.size": params.sizeLabel 
        };
        
        const forceRes = await Product.updateOne(forceFilter, update, options);
        
        if ((forceRes.modifiedCount ?? forceRes.nModified ?? 0) > 0) return true;
    }

    // 3. Real Failure (Not enough stock AND not a proxy item, or size doesn't exist)
    // Fetch current stock for a better error message
    const current = await Product.findOne(
      { _id: params.productId, "sizes.size": params.sizeLabel },
      { "sizes.$": 1 }
    ).session(session).lean();

    const available = current && current.sizes && current.sizes[0] ? Number(current.sizes[0].stock || 0) : 0;
    throw new InsufficientStockError(`Insufficient stock for product ${params.productId} size ${params.sizeLabel}. Requested ${params.qty}, available ${available}`);
  }

  /**
   * Increase stock for a specific product size by qty (restock/cancel).
   * Returns true if an existing size was updated, false if not found (size missing).
   * Use addOrCreateSize to add a missing size.
   */
  static async increaseStock(productId, sizeLabel, qty, session = null) {
    const params = this._validateParams(productId, sizeLabel, qty);

    const filter = { _id: params.productId, "sizes.size": params.sizeLabel };
    const update = { $inc: { "sizes.$.stock": params.qty } };
    const options = session ? { session } : {};

    const res = await Product.updateOne(filter, update, options);
    const modified = (res.modifiedCount ?? res.nModified ?? 0) > 0;

    if (modified) {
      // We don't check for negative stock here because increasing stock is always safe 
      // (even if it goes from -5 to -4, that's valid logic).
      return true;
    }

    // size missing -> return false to let callers add/create
    return false;
  }

  /**
   * Add a new size entry if it doesn't exist, or set the stock if it does.
   */
  static async addOrCreateSize(productId, sizeLabel, qty = 0, session = null) {
    if (!productId) throw new InvalidParamsError("productId is required");
    const label = this._normalizeLabel(sizeLabel);
    if (!label) throw new InvalidParamsError("sizeLabel is required");
    const q = Math.max(0, Math.floor(Number(qty) || 0));

    // Try to update existing size's stock (set to q)
    const setRes = await Product.updateOne(
      { _id: productId, "sizes.size": label },
      { $set: { "sizes.$.stock": q } },
      session ? { session } : {}
    );

    const modified = (setRes.modifiedCount ?? setRes.nModified ?? 0) > 0;
    if (modified) return;

    // If not modified, push a new size
    await Product.updateOne(
      { _id: productId },
      { $push: { sizes: { size: label, stock: q } } },
      session ? { session } : {}
    );
  }

  /**
   * Get stock for a specific size. Returns 0 if product or size not found.
   */
  static async getStock(productId, sizeLabel) {
    if (!productId) throw new InvalidParamsError("productId is required");
    const label = this._normalizeLabel(sizeLabel);
    if (!label) throw new InvalidParamsError("sizeLabel is required");

    const doc = await Product.findById(productId, { sizes: 1 }).lean();
    if (!doc || !Array.isArray(doc.sizes)) return 0;
    const s = doc.sizes.find(x => String(x.size).trim() === label);
    return s ? Number(s.stock || 0) : 0;
  }

  /**
   * Returns total stock across all sizes for the product (integer).
   */
  static async totalStock(productId) {
    if (!productId) throw new InvalidParamsError("productId is required");
    const doc = await Product.findById(productId, { sizes: 1 }).lean();
    if (!doc || !Array.isArray(doc.sizes)) return 0;
    return doc.sizes.reduce((sum, s) => sum + Math.max(0, Number(s.stock || 0)), 0);
  }

  /**
   * Decrease stock for multiple items inside a session/transaction.
   * Used by OrderService.createOrder.
   * Implements the "Strict -> Backorder (Proxy)" fallback logic.
   * * @param {Array<{productId: string, sizeLabel: string, qty: number}>} items
   * @param {mongoose.ClientSession} session - required
   * @returns {Promise<void>}
   * @throws {InvalidParamsError|InsufficientStockError}
   */
  static async decreaseStockForItems(items = [], session) {
    if (!Array.isArray(items) || items.length === 0) return;
    if (!session) throw new InvalidParamsError("A mongoose session is required for multi-item decrease");

    // Validate items and normalize labels
    for (const it of items) {
      it.sizeLabel = this._normalizeLabel(it.sizeLabel);
      this._validateParams(it.productId, it.sizeLabel, it.qty);
    }

    // Process each item
    for (const it of items) {
      const update = { $inc: { "sizes.$.stock": -it.qty } };
      
      // 1. Strict Check: Ensure stock >= qty
      const strictFilter = {
        _id: it.productId,
        "sizes.size": it.sizeLabel,
        "sizes.stock": { $gte: it.qty }
      };
      
      const strictRes = await Product.updateOne(strictFilter, update, { session });
      const modified = (strictRes.modifiedCount ?? strictRes.nModified ?? 0) > 0;

      if (!modified) {
         // 2. Check for Proxy/Backorder capability
         // We fetch the product to see if it has a wholesaleSourceId
         const product = await Product.findById(it.productId).session(session).select("wholesaleSourceId name").lean();
         
         if (product && product.wholesaleSourceId) {
             // It IS a proxy item. Allow negative stock.
             const forceFilter = { 
                 _id: it.productId, 
                 "sizes.size": it.sizeLabel 
             };

             const forceRes = await Product.updateOne(forceFilter, update, { session });
             
             // If force update failed, it means the size label doesn't exist or product missing
             if ((forceRes.modifiedCount ?? forceRes.nModified ?? 0) === 0) {
                 throw new InsufficientStockError(`Size '${it.sizeLabel}' not found for product ${product.name || it.productId}`);
             }
         } else {
             // 3. Hard Fail: Not a proxy item, and stock was insufficient
             throw new InsufficientStockError(`Insufficient stock for ${product?.name || it.productId}`);
         }
      }
    }
    // All items processed successfully (either via strict decrement or proxy backorder)
  }
}

// Export error classes for callers that want to check error types.
export { InventoryError, InsufficientStockError, InvalidParamsError };