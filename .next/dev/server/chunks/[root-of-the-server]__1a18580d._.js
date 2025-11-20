module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/domain/catalog.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/domain/catalog.js
/**
 * Domain representation of a Product.
 * Renamed to DomainProduct to avoid confusion with Mongoose model.
 *
 * This class is DB-agnostic and contains helpful business-logic methods used by services/controllers.
 * It also includes small helpers for validation and safe updates.
 */ __turbopack_context__.s([
    "DomainProduct",
    ()=>DomainProduct,
    "default",
    ()=>__TURBOPACK__default__export__
]);
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
class DomainProduct {
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
   */ constructor({ _id = undefined, name, price, originalPrice = 0, description = "", materials = [], images = [], sizes = [], rating = {
        avg: 0,
        count: 0
    }, category = "General", createdAt = undefined, updatedAt = undefined } = {}){
        // Minimal validation
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
        this.sizes = Array.isArray(sizes) ? sizes.map((s)=>({
                label: String(s.label),
                stock: toNumberSafe(s.stock, 0)
            })) : [];
        this.rating = {
            avg: rating && typeof rating.avg === "number" ? rating.avg : toNumberSafe(rating?.avg, 0),
            count: rating && typeof rating.count === "number" ? rating.count : toNumberSafe(rating?.count, 0)
        };
        this.category = String(category || "General");
        this.createdAt = toDateSafe(createdAt);
        this.updatedAt = toDateSafe(updatedAt);
    }
    /**
   * Create a DomainProduct from a Mongoose document or raw object.
   * @param {Object} doc
   * @returns {DomainProduct}
   */ static fromDocument(doc = {}) {
        // if doc is a mongoose document, convert to plain object safely
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
            updatedAt: d.updatedAt
        });
    }
    /**
   * Validate a plain payload (useful before saving).
   * Throws an Error on invalid input, returns true on success.
   * @param {Object} payload
   */ static validate(payload = {}) {
        if (!payload) throw new Error("Payload is required");
        if (!payload.name || String(payload.name).trim() === "") throw new Error("Product name is required");
        const price = toNumberSafe(payload.price, NaN);
        if (Number.isNaN(price)) throw new Error("Product price must be a number");
        // optional deeper checks: sizes array, materials type, etc.
        if (payload.sizes && !Array.isArray(payload.sizes)) throw new Error("sizes must be an array");
        return true;
    }
    /**
   * Merge updates into this domain object safely.
   * Does not validate; call DomainProduct.validate(update) before persistent operations if needed.
   * @param {Object} updates
   */ updateFrom(updates = {}) {
        if (!updates || typeof updates !== "object") return;
        if (updates.name !== undefined) this.name = String(updates.name);
        if (updates.price !== undefined) this.price = toNumberSafe(updates.price, this.price);
        if (updates.originalPrice !== undefined) this.originalPrice = toNumberSafe(updates.originalPrice, this.originalPrice);
        if (updates.description !== undefined) this.description = String(updates.description);
        if (updates.materials !== undefined) this.materials = Array.isArray(updates.materials) ? updates.materials.map(String) : this.materials;
        if (updates.images !== undefined) this.images = Array.isArray(updates.images) ? updates.images.map(String) : this.images;
        if (updates.sizes !== undefined && Array.isArray(updates.sizes)) {
            // replace sizes wholesale (you could also merge by label if you prefer)
            this.sizes = updates.sizes.map((s)=>({
                    label: String(s.label),
                    stock: toNumberSafe(s.stock, 0)
                }));
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
   * Get discount percentage (rounded to nearest integer).
   * Returns 0 if originalPrice is not set or <= price.
   */ getDiscountPercent() {
        const op = toNumberSafe(this.originalPrice, 0);
        const p = toNumberSafe(this.price, 0);
        if (!op || op <= 0 || p >= op) return 0;
        const percent = (op - p) / op * 100;
        return Math.round(percent);
    }
    /**
   * Returns true if any size has stock > 0
   */ isInStock() {
        if (!Array.isArray(this.sizes) || this.sizes.length === 0) return false;
        return this.sizes.some((s)=>toNumberSafe(s.stock, 0) > 0);
    }
    /**
   * Returns total available stock across all sizes (integer)
   */ totalStock() {
        if (!Array.isArray(this.sizes) || this.sizes.length === 0) return 0;
        return this.sizes.reduce((sum, s)=>sum + Math.max(0, toNumberSafe(s.stock, 0)), 0);
    }
    /**
   * Add a new size or update an existing size's stock.
   * If stock is negative, it sets to 0.
   * @param {String} label
   * @param {Number} stock
   */ addOrUpdateSize(label, stock) {
        if (!label) throw new Error("Size label is required");
        const sIndex = this.sizes.findIndex((s)=>s.label === label);
        const normalizedStock = Math.max(0, toNumberSafe(stock, 0));
        if (sIndex === -1) {
            this.sizes.push({
                label: String(label),
                stock: normalizedStock
            });
        } else {
            this.sizes[sIndex].stock = normalizedStock;
        }
    }
    /**
   * Decrease stock for a size by qty (atomic from domain perspective).
   * Returns true if successful, false if insufficient stock or size missing.
   * Does NOT persist to DB — the service should perform DB update + transaction.
   * @param {String} label
   * @param {Number} qty
   */ decreaseStock(label, qty = 1) {
        if (!label) throw new Error("Size label required");
        const index = this.sizes.findIndex((s)=>s.label === label);
        if (index === -1) return false;
        const available = toNumberSafe(this.sizes[index].stock, 0);
        const useQty = Math.max(0, Math.floor(toNumberSafe(qty, 0)));
        if (useQty <= 0) return false;
        if (available < useQty) return false;
        this.sizes[index].stock = available - useQty;
        return true;
    }
    /**
   * Increase stock for a size by qty. If size doesn't exist, it will be added.
   * @param {String} label
   * @param {Number} qty
   */ increaseStock(label, qty = 1) {
        if (!label) throw new Error("Size label required");
        const index = this.sizes.findIndex((s)=>s.label === label);
        const addQty = Math.max(0, Math.floor(toNumberSafe(qty, 0)));
        if (addQty === 0) return;
        if (index === -1) {
            this.sizes.push({
                label: String(label),
                stock: addQty
            });
        } else {
            this.sizes[index].stock = toNumberSafe(this.sizes[index].stock, 0) + addQty;
        }
    }
    /**
   * Convert domain object to a plain object suitable for saving with Mongoose.
   * If you want to exclude _id, pass { omitId: true }.
   * @param {Object} [opts]
   * @param {Boolean} [opts.omitId=false]
   */ toObject(opts = {}) {
        const obj = {
            name: this.name,
            price: this.price,
            originalPrice: this.originalPrice,
            description: this.description,
            materials: Array.isArray(this.materials) ? this.materials : [],
            images: Array.isArray(this.images) ? this.images : [],
            sizes: Array.isArray(this.sizes) ? this.sizes.map((s)=>({
                    label: s.label,
                    stock: toNumberSafe(s.stock, 0)
                })) : [],
            rating: {
                avg: toNumberSafe(this.rating && this.rating.avg ? this.rating.avg : 0),
                count: toNumberSafe(this.rating && this.rating.count ? this.rating.count : 0)
            },
            category: this.category || "General"
        };
        if (!opts.omitId && this._id) obj._id = this._id;
        if (this.createdAt) obj.createdAt = this.createdAt;
        if (this.updatedAt) obj.updatedAt = this.updatedAt;
        return obj;
    }
    /**
   * toJSON for safe serialization (JSON.stringify)
   */ toJSON() {
        const o = this.toObject({
            omitId: false
        });
        // convert _id to id if possible
        if (o._id !== undefined && (typeof o._id === "object" || typeof o._id === "string")) {
            o.id = String(o._id);
        // keep _id for DB operations but provide id convenience field
        }
        return o;
    }
    /**
   * Create a deep clone of this object
   */ clone() {
        return DomainProduct.fromDocument(JSON.parse(JSON.stringify(this.toObject())));
    }
}
const __TURBOPACK__default__export__ = DomainProduct;
}),
"[project]/src/services/catalogService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/services/catalogService.js
__turbopack_context__.s([
    "default",
    ()=>CatalogService
]);
(()=>{
    const e = new Error("Cannot find module '../../models/productModel.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/domain/catalog.js [api] (ecmascript)");
;
;
class CatalogService {
    static async createProduct(data) {
        const model = new ProductModel(data);
        const saved = await model.save();
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(saved);
    }
    static async updateProduct(id, updates) {
        const updated = await ProductModel.findByIdAndUpdate(id, updates, {
            new: true
        });
        return updated ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(updated) : null;
    }
    static async getProductById(id) {
        const doc = await ProductModel.findById(id).lean();
        return doc ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(doc) : null;
    }
    static async searchProducts({ q = "", page = 1, limit = 20, inStockOnly = false } = {}) {
        const filter = {};
        if (q) filter.$text = {
            $search: q
        }; // requires text index
        if (inStockOnly) filter["sizes.stock"] = {
            $gt: 0
        };
        const skip = (page - 1) * limit;
        const docs = await ProductModel.find(filter).skip(skip).limit(limit).lean();
        const total = await ProductModel.countDocuments(filter);
        const items = docs.map((d)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(d));
        return {
            items,
            total,
            page,
            limit
        };
    }
}
}),
"[externals]/mongoose [external] (mongoose, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}),
"[project]/src/lib/dbConnect.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>dbConnect
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI not set");
let cached = /*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose || {
    conn: null,
    promise: null
};
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose) /*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose = cached;
async function dbConnect() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGO_URI).then((m)=>m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
}),
"[project]/src/pages/api/products/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pages/api/products/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/catalogService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method === "GET") {
        const { q, page = 1, limit = 20 } = req.query;
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].searchProducts({
            q,
            page: Number(page),
            limit: Number(limit)
        });
        return res.status(200).json(result);
    }
    if (req.method === "POST") {
        try {
            const created = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].createProduct(req.body);
            return res.status(201).json(created.toObject ? created.toObject() : created);
        } catch (err) {
            return res.status(400).json({
                error: err.message
            });
        }
    }
    return res.status(405).end();
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1a18580d._.js.map