// src/domain/orders.js

/**
 * @file DomainOrder
 * @brief DB-agnostic Domain class representing an Order with lifecycle helpers.
 *
 * Extends the original DomainOrder with status transition helpers (markAsShipped, markAsCancelled, markAsRefunded, etc.)
 * These methods modify the in-memory domain object; persistence should be done by service layers.
 */

function toNumberSafe(value, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDateSafe(value) {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * @typedef OrderItem
 * @property {string|any} productId - product ObjectId or string
 * @property {string} name - product name (snapshot)
 * @property {string} sizeLabel
 * @property {number} qty
 * @property {number} unitPrice - integer currency
 * @property {number} subtotal - unitPrice * qty
 */

/**
 * @class DomainOrder
 * @brief Domain representation of an order with helpers & validation.
 */
export class DomainOrder {
  /**
   * Valid order statuses (mirrors orderModel.js enum).
   * @returns {string[]}
   */
  static get VALID_STATUSES() {
    return ["created","pending","paid","processing","shipped","delivered","cancelled","refunded"];
  }

  /**
   * Allowed transitions map (current -> [allowed next statuses])
   * This is conservative but covers common flows. Services can override/allow others.
   * @returns {Object}
   */
  static get TRANSITIONS() {
    return {
      created: ["pending", "paid", "processing", "cancelled"],
      pending: ["paid", "processing", "cancelled"],
      paid: ["processing", "cancelled", "refunded"],
      processing: ["shipped", "cancelled", "refunded"],
      shipped: ["delivered", "refunded"],
      delivered: [], // final
      cancelled: [], // final
      refunded: [] // final
    };
  }

  /**
   * @param {Object} params
   * @param {Object} params.customer - { name, email?, phone?, address? }
   * @param {OrderItem[]} [params.items=[]]
   * @param {number} [params.subtotal=0]
   * @param {number} [params.shipping=0]
   * @param {number} [params.tax=0]
   * @param {number} [params.discount=0]
   * @param {number} [params.total=0]
   * @param {string} [params.status="created"]
   * @param {string|Date} [params.createdAt]
   * @param {string|Date} [params.updatedAt]
   * @param {string|any} [params._id]
   */
  constructor({
    _id = undefined,
    customer = {},
    items = [],
    subtotal = 0,
    shipping = 0,
    tax = 0,
    discount = 0,
    total = 0,
    status = "created",
    createdAt = undefined,
    updatedAt = undefined,
    userId = undefined,
    meta = undefined,
    archived = false,
    payment = undefined,
    fulfillment = undefined
  } = {}) {
    // Basic validation
    if (!customer || !String(customer.name || "").trim()) {
      throw new Error("customer.name is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
      // allow creation of an order object with empty items only if explicitly desired,
      // but by default require at least one item for a valid order.
      throw new Error("Order must contain at least one item");
    }

    // Normalize items
    this.items = items.map(it => DomainOrder._normalizeItem(it));

    // Validate items (throws if invalid)
    for (const it of this.items) {
      DomainOrder._validateItem(it);
    }

    this._id = _id;
    this.customer = {
      name: String(customer.name),
      email: customer.email ? String(customer.email) : undefined,
      phone: customer.phone ? String(customer.phone) : undefined,
      address: customer.address ? String(customer.address) : undefined,
    };

    this.subtotal = toNumberSafe(subtotal, 0);
    this.shipping = toNumberSafe(shipping, 0);
    this.tax = toNumberSafe(tax, 0);
    this.discount = toNumberSafe(discount, 0);
    this.total = toNumberSafe(total, 0);

    // Ensure status is valid
    this.status = DomainOrder.VALID_STATUSES.includes(String(status)) ? String(status) : "created";

    this.createdAt = toDateSafe(createdAt);
    this.updatedAt = toDateSafe(updatedAt);
    this.userId = userId;
    this.meta = meta || {};
    this.archived = Boolean(archived);

    // Optional nested objects
    this.payment = payment || {};
    this.fulfillment = fulfillment || {};
  }

  /**
   * Normalize an incoming item to the expected shape.
   * Does not fully validate (see _validateItem).
   * @private
   * @param {Object} it
   * @returns {OrderItem}
   */
  static _normalizeItem(it = {}) {
    return {
      productId: it.productId,
      name: it.name ? String(it.name) : "",
      sizeLabel: it.sizeLabel ? String(it.sizeLabel) : "",
      qty: Math.max(0, Math.floor(toNumberSafe(it.qty, 0))),
      unitPrice: toNumberSafe(it.unitPrice, 0),
      subtotal: toNumberSafe(it.subtotal, 0),
    };
  }

  /**
   * Validate a normalized item and ensure subtotal is consistent.
   * Throws Error on invalid item.
   * @private
   * @param {OrderItem} it
   */
  static _validateItem(it) {
    if (!it.productId) throw new Error("item.productId is required");
    if (!it.name || String(it.name).trim() === "") throw new Error("item.name is required");
    if (!it.sizeLabel || String(it.sizeLabel).trim() === "") throw new Error("item.sizeLabel is required");
    if (!Number.isFinite(it.qty) || it.qty <= 0) throw new Error("item.qty must be a positive integer");
    if (!Number.isFinite(it.unitPrice) || it.unitPrice < 0) throw new Error("item.unitPrice must be a number >= 0");

    const expected = Math.floor(it.unitPrice * it.qty);
    // Ensure subtotal consistent; if not provided, set it.
    if (!Number.isFinite(it.subtotal) || it.subtotal !== expected) {
      it.subtotal = expected;
    }
  }

  /**
   * Create a DomainOrder from a Mongoose document or plain object.
   * @param {Object} doc
   * @returns {DomainOrder}
   */
  static fromDocument(doc = {}) {
    const d = doc && typeof doc.toObject === "function" ? doc.toObject() : doc || {};
    return new DomainOrder({
      _id: d._id,
      customer: d.customer || {},
      items: (d.items || []).map(i => ({
        productId: i.productId,
        name: i.name,
        sizeLabel: i.sizeLabel,
        qty: toNumberSafe(i.qty, 0),
        unitPrice: toNumberSafe(i.unitPrice, 0),
        subtotal: toNumberSafe(i.subtotal, 0),
      })),
      subtotal: toNumberSafe(d.subtotal, 0),
      shipping: toNumberSafe(d.shipping, 0),
      tax: toNumberSafe(d.tax, 0),
      discount: toNumberSafe(d.discount, 0),
      total: toNumberSafe(d.total, 0),
      status: d.status || "created",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      userId: d.userId,
      meta: d.meta,
      archived: d.archived || false,
      payment: d.payment,
      fulfillment: d.fulfillment
    });
  }

  /**
   * Validate a plain payload before constructing or saving.
   * Throws Error on invalid payload. Returns true on success.
   * @param {Object} payload
   * @returns {boolean}
   */
  static validate(payload = {}) {
    if (!payload) throw new Error("Payload is required");
    if (!payload.customer || !String(payload.customer.name || "").trim()) throw new Error("customer.name is required");
    if (!Array.isArray(payload.items) || payload.items.length === 0) throw new Error("items must be a non-empty array");

    for (const it of payload.items) {
      const n = DomainOrder._normalizeItem(it);
      DomainOrder._validateItem(n);
    }
    return true;
  }

  /**
   * Recalculate subtotal and total based on items and adjustments.
   * Sets this.subtotal and this.total.
   * @param {Object} [opts]
   * @param {boolean} [opts.recalculateItemSubtotals=true] - recalc each item.subtotal from unitPrice * qty
   */
  calculateTotals({ recalculateItemSubtotals = true } = {}) {
    if (!Array.isArray(this.items)) this.items = [];
    let subtotal = 0;
    for (const it of this.items) {
      if (recalculateItemSubtotals) {
        it.subtotal = Math.floor(toNumberSafe(it.unitPrice, 0) * toNumberSafe(it.qty, 0));
      }
      subtotal += toNumberSafe(it.subtotal, 0);
    }
    this.subtotal = Math.floor(subtotal);
    // basic total calculation; consumers can set shipping/tax/discount before/after calling this
    this.total = Math.max(0, this.subtotal + toNumberSafe(this.shipping, 0) + toNumberSafe(this.tax, 0) - toNumberSafe(this.discount, 0));
    return { subtotal: this.subtotal, total: this.total };
  }

  /**
   * Add an item to the order (merges with existing item with same productId+sizeLabel).
   * Recalculates totals.
   * @param {OrderItem} item
   */
  addItem(item = {}) {
    const it = DomainOrder._normalizeItem(item);
    DomainOrder._validateItem(it);

    const idx = this.items.findIndex(x => String(x.productId) === String(it.productId) && String(x.sizeLabel) === String(it.sizeLabel));
    if (idx === -1) {
      this.items.push(it);
    } else {
      // merge qty and recompute subtotal
      this.items[idx].qty = Math.floor(toNumberSafe(this.items[idx].qty, 0) + it.qty);
      this.items[idx].unitPrice = toNumberSafe(it.unitPrice, this.items[idx].unitPrice);
      this.items[idx].subtotal = Math.floor(this.items[idx].unitPrice * this.items[idx].qty);
    }
    this.calculateTotals();
  }

  /**
   * Remove an item by productId and sizeLabel.
   * @param {string|any} productId
   * @param {string} sizeLabel
   * @returns {boolean} true if removed
   */
  removeItem(productId, sizeLabel) {
    const prevLen = this.items.length;
    this.items = this.items.filter(x => !(String(x.productId) === String(productId) && String(x.sizeLabel) === String(sizeLabel)));
    const removed = this.items.length < prevLen;
    if (removed) this.calculateTotals();
    return removed;
  }

  /**
   * Update quantity for an existing item.
   * @param {string|any} productId
   * @param {string} sizeLabel
   * @param {number} qty
   * @returns {boolean} true if updated
   */
  updateItemQty(productId, sizeLabel, qty) {
    const idx = this.items.findIndex(x => String(x.productId) === String(productId) && String(x.sizeLabel) === String(sizeLabel));
    if (idx === -1) return false;
    const q = Math.floor(toNumberSafe(qty, 0));
    if (q <= 0) return false;
    this.items[idx].qty = q;
    this.items[idx].subtotal = Math.floor(this.items[idx].unitPrice * q);
    this.calculateTotals();
    return true;
  }

  /**
   * Determine if a transition from current status to newStatus is allowed.
   * @param {string} newStatus
   * @returns {boolean}
   */
  canTransitionTo(newStatus) {
    if (!newStatus) return false;
    const cur = String(this.status || "").trim();
    if (!DomainOrder.VALID_STATUSES.includes(newStatus)) return false;
    const allowed = DomainOrder.TRANSITIONS[cur] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Returns true if the order is in a final/terminal status.
   * @returns {boolean}
   */
  isFinal() {
    return ["delivered", "cancelled", "refunded"].includes(this.status);
  }

  /**
   * Ensure fulfillment object exists.
   * @private
   */
  ensureFulfillment() {
    if (!this.fulfillment || typeof this.fulfillment !== "object") this.fulfillment = {};
  }

  /**
   * Ensure payment object exists.
   * @private
   */
  ensurePayment() {
    if (!this.payment || typeof this.payment !== "object") this.payment = {};
  }

  /**
   * Mark order as processing if allowed.
   * @returns {boolean} true if applied
   */
  markAsProcessing() {
    if (!this.canTransitionTo("processing")) return false;
    this.status = "processing";
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Mark order as shipped. Accepts optional fulfillment data.
   * Does not persist — caller must save.
   *
   * @param {Object} opts
   * @param {string} [opts.carrier]
   * @param {string} [opts.trackingNumber]
   * @param {string|Date} [opts.shippedAt]
   * @returns {boolean} true if applied
   */
  markAsShipped({ carrier, trackingNumber, shippedAt } = {}) {
    if (!this.canTransitionTo("shipped")) return false;
    this.status = "shipped";
    this.ensureFulfillment();
    if (carrier !== undefined) this.fulfillment.carrier = String(carrier);
    if (trackingNumber !== undefined) this.fulfillment.trackingNumber = String(trackingNumber);
    this.fulfillment.shippedAt = toDateSafe(shippedAt) || new Date();
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Mark order as delivered. Optionally set deliveredAt.
   * @param {Object} opts
   * @param {string|Date} [opts.deliveredAt]
   * @returns {boolean}
   */
  markAsDelivered({ deliveredAt } = {}) {
    if (!this.canTransitionTo("delivered")) return false;
    this.status = "delivered";
    this.ensureFulfillment();
    this.fulfillment.deliveredAt = toDateSafe(deliveredAt) || new Date();
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Mark order as cancelled. Records cancel reason in meta.
   * Note: Domain doesn't automatically restore stock or refund — services should orchestrate those.
   * @param {Object} opts
   * @param {string} [opts.reason]
   * @returns {boolean}
   */
  markAsCancelled({ reason } = {}) {
    if (!this.canTransitionTo("cancelled")) return false;
    this.status = "cancelled";
    this.meta = this.meta || {};
    this.meta.cancel = Object.assign({}, this.meta.cancel || {}, {
      at: new Date(),
      reason: reason ? String(reason) : undefined
    });
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Mark order as refunded and attach refund metadata to payment and meta.
   * Services should call payment-provider refund before or alongside this.
   * @param {Object} opts
   * @param {Object} [opts.refundInfo] - provider refund metadata
   * @returns {boolean}
   */
  markAsRefunded({ refundInfo = {} } = {}) {
    if (!this.canTransitionTo("refunded")) return false;
    this.status = "refunded";
    this.ensurePayment();
    this.payment.refundInfo = Object.assign({}, this.payment.refundInfo || {}, refundInfo);
    this.payment.refundedAt = this.payment.refundedAt || new Date();
    this.meta = this.meta || {};
    this.meta.refund = { at: new Date(), info: refundInfo };
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Set or update tracking number.
   * @param {string} trackingNumber
   */
  setTrackingNumber(trackingNumber) {
    if (!trackingNumber) return;
    this.ensureFulfillment();
    this.fulfillment.trackingNumber = String(trackingNumber);
    this.updatedAt = new Date();
  }

  /**
   * Add arbitrary meta at top-level or nested path (simple dot path supported).
   * Example: addMeta('customerNotes', 'left at door') or addMeta('shipping.attempts', 1)
   *
   * @param {string} pathOrKey
   * @param {*} value
   */
  addMeta(pathOrKey, value) {
    if (!pathOrKey) return;
    const parts = String(pathOrKey).split(".").map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return;
    this.meta = this.meta || {};
    let cur = this.meta;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
    this.updatedAt = new Date();
  }

  /**
   * Convert the domain object into a plain object suitable for Mongoose saving.
   * @param {Object} [opts]
   * @param {boolean} [opts.omitId=false]
   * @returns {Object}
   */
  toObject({ omitId = false } = {}) {
    const obj = {
      customer: {
        name: this.customer.name,
        email: this.customer.email,
        phone: this.customer.phone,
        address: this.customer.address,
      },
      items: Array.isArray(this.items) ? this.items.map(it => ({
        productId: it.productId,
        name: it.name,
        sizeLabel: it.sizeLabel,
        qty: Math.floor(toNumberSafe(it.qty, 0)),
        unitPrice: Math.floor(toNumberSafe(it.unitPrice, 0)),
        subtotal: Math.floor(toNumberSafe(it.subtotal, 0)),
      })) : [],
      subtotal: Math.floor(toNumberSafe(this.subtotal, 0)),
      shipping: Math.floor(toNumberSafe(this.shipping, 0)),
      tax: Math.floor(toNumberSafe(this.tax, 0)),
      discount: Math.floor(toNumberSafe(this.discount, 0)),
      total: Math.floor(toNumberSafe(this.total, 0)),
      status: this.status || "created",
      userId: this.userId,
      meta: this.meta,
      archived: Boolean(this.archived),
      payment: this.payment,
      fulfillment: this.fulfillment
    };

    if (!omitId && this._id !== undefined) obj._id = this._id;
    if (this.createdAt) obj.createdAt = this.createdAt;
    if (this.updatedAt) obj.updatedAt = this.updatedAt;
    return obj;
  }

  /**
   * toJSON for safe serialization (JSON.stringify).
   * Adds `id` field as string for convenience.
   * @returns {Object}
   */
  toJSON() {
    const o = this.toObject({ omitId: false });
    if (o._id !== undefined && (typeof o._id === "object" || typeof o._id === "string")) {
      o.id = String(o._id);
    }
    return o;
  }

  /**
   * Create a deep clone.
   * @returns {DomainOrder}
   */
  clone() {
    return DomainOrder.fromDocument(JSON.parse(JSON.stringify(this.toObject())));
  }
}

export default DomainOrder;
