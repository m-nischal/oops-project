// src/domain/catalog.js

/**
 * @file DomainProduct
 * @brief DB-agnostic domain representation for products with helper methods.
 *
 * This class intentionally does not perform persistence. Use it to validate,
 * manipulate and serialize product data in business logic layers.
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
 * @typedef Size
 * @property {string} label
 * @property {number} stock
 */

/**
 * @typedef Rating
 * @property {number} avg
 * @property {number} count
 */

/**
 * @class DomainProduct
 */
export class DomainProduct {
  /**
   * @param {Object} params
   * @param {string|any} [params._id]
   * @param {string} params.name
   * @param {number|string} params.price
   * @param {number|string} [params.originalPrice=0]
   * @param {string} [params.description=""]
   * @param {string[]} [params.materials=[]]
   * @param {string[]} [params.images=[]]
   * @param {Size[]} [params.sizes=[]]
   * @param {Rating} [params.rating={avg:0,count:0}]
   * @param {string} [params.category="General"]
   * @param {string|Date} [params.createdAt]
   * @param {string|Date} [params.updatedAt]
   */
  constructor({
    _id = undefined,
    name,
    price,
    originalPrice = 0,
    description = "",
    materials = [],
    images = [],
    sizes = [],
    rating = { avg: 0, count: 0 },
    category = "General",
    createdAt = undefined,
    updatedAt = undefined,
  } = {}) {
    if (!name) throw new Error("Product requires a name");
    const parsedPrice = toNumberSafe(price, NaN);
    if (Number.isNaN(parsedPrice)) throw new Error("Product price must be a number");

    this._id = _id;
    this.name = String(name);
    this.price = parsedPrice;
    this.originalPrice = toNumberSafe(originalPrice, 0);
    this.description = String(description || "");
    this.materials = Array.isArray(materials) ? materials.map(String) : [];
    this.images = Array.isArray(images) ? images.map(String) : [];
    this.sizes = Array.isArray(sizes)
      ? sizes.map(s => ({ label: String(s.label), stock: toNumberSafe(s.stock, 0) }))
      : [];
    this.rating = {
      avg: (rating && typeof rating.avg === "number") ? rating.avg : toNumberSafe(rating?.avg, 0),
      count: (rating && typeof rating.count === "number") ? rating.count : toNumberSafe(rating?.count, 0),
    };
    this.category = String(category || "General");
    this.createdAt = toDateSafe(createdAt);
    this.updatedAt = toDateSafe(updatedAt);
  }

  /**
   * Create a DomainProduct from a Mongoose document or raw object.
   * @param {Object} doc
   * @returns {DomainProduct}
   */
  static fromDocument(doc = {}) {
    const d = doc && typeof doc.toObject === "function" ? doc.toObject() : doc || {};
    return new DomainProduct({
      _id: d._id,
      name: d.name,
      price: d.price,
      originalPrice: d.originalPrice,
      description: d.description,
      materials: d.materials,
      images: d.images,
      sizes: d.sizes,
      rating: d.rating,
      category: d.category,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    });
  }

  /**
   * Validate a plain payload (useful before saving).
   * Throws an Error on invalid input, returns true on success.
   * @param {Object} payload
   * @returns {boolean}
   */
  static validate(payload = {}) {
    if (!payload) throw new Error("Payload is required");
    if (!payload.name || String(payload.name).trim() === "") throw new Error("Product name is required");
    const price = toNumberSafe(payload.price, NaN);
    if (Number.isNaN(price)) throw new Error("Product price must be a number");
    if (payload.sizes && !Array.isArray(payload.sizes)) throw new Error("sizes must be an array");
    return true;
  }

  /**
   * Merge updates into this domain object safely.
   * Does not perform full validation.
   * @param {Object} updates
   */
  updateFrom(updates = {}) {
    if (!updates || typeof updates !== "object") return;
    if (updates.name !== undefined) this.name = String(updates.name);
    if (updates.price !== undefined) this.price = toNumberSafe(updates.price, this.price);
    if (updates.originalPrice !== undefined) this.originalPrice = toNumberSafe(updates.originalPrice, this.originalPrice);
    if (updates.description !== undefined) this.description = String(updates.description);
    if (updates.materials !== undefined) this.materials = Array.isArray(updates.materials) ? updates.materials.map(String) : this.materials;
    if (updates.images !== undefined) this.images = Array.isArray(updates.images) ? updates.images.map(String) : this.images;
    if (updates.sizes !== undefined && Array.isArray(updates.sizes)) {
      this.sizes = updates.sizes.map(s => ({ label: String(s.label), stock: toNumberSafe(s.stock, 0) }));
    }
    if (updates.rating !== undefined) {
      this.rating = {
        avg: toNumberSafe(updates.rating.avg, this.rating.avg),
        count: toNumberSafe(updates.rating.count, this.rating.count)
      };
    }
    if (updates.category !== undefined) this.category = String(updates.category);
    if (updates.updatedAt !== undefined) this.updatedAt = toDateSafe(updates.updatedAt);
  }

  /**
   * Get discount percentage (rounded).
   * @returns {number}
   */
  getDiscountPercent() {
    const op = toNumberSafe(this.originalPrice, 0);
    const p = toNumberSafe(this.price, 0);
    if (!op || op <= 0 || p >= op) return 0;
    const percent = ((op - p) / op) * 100;
    return Math.round(percent);
  }

  /**
   * Returns true if any size has stock > 0.
   * @returns {boolean}
   */
  isInStock() {
    if (!Array.isArray(this.sizes) || this.sizes.length === 0) return false;
    return this.sizes.some(s => toNumberSafe(s.stock, 0) > 0);
  }

  /**
   * Returns total available stock across all sizes (integer).
   * @returns {number}
   */
  totalStock() {
    if (!Array.isArray(this.sizes) || this.sizes.length === 0) return 0;
    return this.sizes.reduce((sum, s) => sum + Math.max(0, toNumberSafe(s.stock, 0)), 0);
  }

  /**
   * Add a new size or update an existing size's stock.
   * @param {String} label
   * @param {Number} stock
   */
  addOrUpdateSize(label, stock) {
    if (!label) throw new Error("Size label is required");
    const sIndex = this.sizes.findIndex(s => s.label === label);
    const normalizedStock = Math.max(0, toNumberSafe(stock, 0));
    if (sIndex === -1) {
      this.sizes.push({ label: String(label), stock: normalizedStock });
    } else {
      this.sizes[sIndex].stock = normalizedStock;
    }
  }

  /**
   * Decrease stock for a size by qty (domain-only, not persisted).
   * @param {String} label
   * @param {Number} qty
   * @returns {boolean} success
   */
  decreaseStock(label, qty = 1) {
    if (!label) throw new Error("Size label required");
    const index = this.sizes.findIndex(s => s.label === label);
    if (index === -1) return false;
    const available = toNumberSafe(this.sizes[index].stock, 0);
    const useQty = Math.max(0, Math.floor(toNumberSafe(qty, 0)));
    if (useQty <= 0) return false;
    if (available < useQty) return false;
    this.sizes[index].stock = available - useQty;
    return true;
  }

  /**
   * Increase stock for a size by qty (domain-only).
   * If size doesn't exist, it will be added.
   * @param {String} label
   * @param {Number} qty
   */
  increaseStock(label, qty = 1) {
    if (!label) throw new Error("Size label required");
    const index = this.sizes.findIndex(s => s.label === label);
    const addQty = Math.max(0, Math.floor(toNumberSafe(qty, 0)));
    if (addQty === 0) return;
    if (index === -1) {
      this.sizes.push({ label: String(label), stock: addQty });
    } else {
      this.sizes[index].stock = toNumberSafe(this.sizes[index].stock, 0) + addQty;
    }
  }

  /**
   * Convert domain object to a plain object suitable for saving with Mongoose.
   * @param {Object} [opts]
   * @param {Boolean} [opts.omitId=false]
   * @returns {Object}
   */
  toObject(opts = {}) {
    const obj = {
      name: this.name,
      price: this.price,
      originalPrice: this.originalPrice,
      description: this.description,
      materials: Array.isArray(this.materials) ? this.materials : [],
      images: Array.isArray(this.images) ? this.images : [],
      sizes: Array.isArray(this.sizes) ? this.sizes.map(s => ({ label: s.label, stock: toNumberSafe(s.stock, 0) })) : [],
      rating: {
        avg: toNumberSafe(this.rating && this.rating.avg ? this.rating.avg : 0),
        count: toNumberSafe(this.rating && this.rating.count ? this.rating.count : 0),
      },
      category: this.category || "General",
    };

    if (!opts.omitId && this._id) obj._id = this._id;
    if (this.createdAt) obj.createdAt = this.createdAt;
    if (this.updatedAt) obj.updatedAt = this.updatedAt;
    return obj;
  }

  /**
   * toJSON for safe serialization (JSON.stringify)
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
   * Create a deep clone of this object.
   * @returns {DomainProduct}
   */
  clone() {
    return DomainProduct.fromDocument(JSON.parse(JSON.stringify(this.toObject())));
  }
}

export default DomainProduct;
