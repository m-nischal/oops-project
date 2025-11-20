module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/mongoose [external] (mongoose, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}),
"[project]/src/lib/dbConnect.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/dbConnect.js
__turbopack_context__.s([
    "default",
    ()=>dbConnect
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
/**
 * @file dbConnect
 * @brief Reusable MongoDB connection util for Next.js API routes.
 *
 * Throws if MONGO_URI missing. Caches connection in global to avoid multiple
 * connections during hot-reload/development.
 */ const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI not set");
let cached = /*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose || {
    conn: null,
    promise: null
};
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose) /*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose = cached;
async function dbConnect() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        // Use the connection string directly; options are managed by mongoose v8 defaults.
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGO_URI).then((m)=>m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
}),
"[project]/src/models/productModel.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// models/productModel.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
/**
 * Product model for LiveMart
 * - categories: normalized ObjectId refs to Category
 * - primaryCategory: the most specific category for the product
 * - storefronts: which storefronts to show this product in (e.g., ["livemart","freshmart"])
 * - productType: optional shortcut to domain (clothing|tech|grocery)
 */ const SizeSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    label: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    _id: false
});
const ProductSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        text: true
    },
    description: {
        type: String,
        trim: true,
        default: "",
        text: true
    },
    sku: {
        type: String,
        trim: true,
        index: true,
        sparse: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    currency: {
        type: String,
        default: "INR"
    },
    images: {
        type: [
            String
        ],
        default: []
    },
    // inventory / sizes
    sizes: {
        type: [
            SizeSchema
        ],
        default: []
    },
    // normalized categories (references)
    categories: [
        {
            type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
            ref: "Category"
        }
    ],
    primaryCategory: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    // storefront control (e.g., ["livemart","freshmart"])
    storefronts: {
        type: [
            String
        ],
        default: [
            "livemart"
        ]
    },
    // lightweight product domain for quick filters
    productType: {
        type: String,
        enum: [
            "clothing",
            "tech",
            "grocery",
            "other"
        ],
        default: "other"
    },
    // misc flags
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
}, {
    timestamps: true
});
/* Indexes */ ProductSchema.index({
    name: "text",
    description: "text"
}); // text search
ProductSchema.index({
    categories: 1
});
ProductSchema.index({
    primaryCategory: 1
});
ProductSchema.index({
    storefronts: 1
});
ProductSchema.index({
    productType: 1
});
/* Pre-save normalization */ // - trim and lowercase storefronts
// - ensure categories are array (helps when migrating)
ProductSchema.pre("save", function(next) {
    if (!this.storefronts || !Array.isArray(this.storefronts)) this.storefronts = [
        "livemart"
    ];
    this.storefronts = this.storefronts.map((s)=>String(s).trim().toLowerCase()).filter(Boolean);
    if (!this.categories) this.categories = [];
    // if categories contain strings (leftover from old schema), leave to migration script;
    // but convert empty strings to removal
    this.categories = this.categories.filter((c)=>!(typeof c === "string" && c.trim() === ""));
    if (this.name) this.name = String(this.name).trim();
    if (this.description) this.description = String(this.description).trim();
    next();
});
/* Instance helpers (optional) */ ProductSchema.methods.totalStock = function() {
    if (!Array.isArray(this.sizes) || !this.sizes.length) return 0;
    return this.sizes.reduce((sum, s)=>sum + (Number(s.stock) || 0), 0);
};
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Product || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Product", ProductSchema);
}),
"[project]/src/domain/catalog.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/domain/catalog.js
/**
 * @file DomainProduct
 * @brief DB-agnostic domain representation for products with helper methods.
 *
 * This class intentionally does not perform persistence. Use it to validate,
 * manipulate and serialize product data in business logic layers.
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
   * @returns {boolean}
   */ static validate(payload = {}) {
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
   */ updateFrom(updates = {}) {
        if (!updates || typeof updates !== "object") return;
        if (updates.name !== undefined) this.name = String(updates.name);
        if (updates.price !== undefined) this.price = toNumberSafe(updates.price, this.price);
        if (updates.originalPrice !== undefined) this.originalPrice = toNumberSafe(updates.originalPrice, this.originalPrice);
        if (updates.description !== undefined) this.description = String(updates.description);
        if (updates.materials !== undefined) this.materials = Array.isArray(updates.materials) ? updates.materials.map(String) : this.materials;
        if (updates.images !== undefined) this.images = Array.isArray(updates.images) ? updates.images.map(String) : this.images;
        if (updates.sizes !== undefined && Array.isArray(updates.sizes)) {
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
   * Get discount percentage (rounded).
   * @returns {number}
   */ getDiscountPercent() {
        const op = toNumberSafe(this.originalPrice, 0);
        const p = toNumberSafe(this.price, 0);
        if (!op || op <= 0 || p >= op) return 0;
        const percent = (op - p) / op * 100;
        return Math.round(percent);
    }
    /**
   * Returns true if any size has stock > 0.
   * @returns {boolean}
   */ isInStock() {
        if (!Array.isArray(this.sizes) || this.sizes.length === 0) return false;
        return this.sizes.some((s)=>toNumberSafe(s.stock, 0) > 0);
    }
    /**
   * Returns total available stock across all sizes (integer).
   * @returns {number}
   */ totalStock() {
        if (!Array.isArray(this.sizes) || this.sizes.length === 0) return 0;
        return this.sizes.reduce((sum, s)=>sum + Math.max(0, toNumberSafe(s.stock, 0)), 0);
    }
    /**
   * Add a new size or update an existing size's stock.
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
   * Decrease stock for a size by qty (domain-only, not persisted).
   * @param {String} label
   * @param {Number} qty
   * @returns {boolean} success
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
   * Increase stock for a size by qty (domain-only).
   * If size doesn't exist, it will be added.
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
   * @param {Object} [opts]
   * @param {Boolean} [opts.omitId=false]
   * @returns {Object}
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
   * @returns {Object}
   */ toJSON() {
        const o = this.toObject({
            omitId: false
        });
        if (o._id !== undefined && (typeof o._id === "object" || typeof o._id === "string")) {
            o.id = String(o._id);
        }
        return o;
    }
    /**
   * Create a deep clone of this object.
   * @returns {DomainProduct}
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/domain/catalog.js [api] (ecmascript)");
;
;
class CatalogService {
    /**
   * Create a new product document and return a DomainProduct instance.
   * @param {Object} data - product payload compatible with productModel / DomainProduct
   * @returns {Promise<DomainProduct>} created product (domain)
   */ static async createProduct(data) {
        // Note: Domain validation could be performed here if desired:
        // DomainProduct.validate(data);
        const model = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"](data);
        const saved = await model.save();
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(saved);
    }
    /**
   * Update a product by id and return DomainProduct or null if not found.
   * @param {String} id - product ObjectId or string
   * @param {Object} updates - partial product fields to update
   * @returns {Promise<DomainProduct|null>}
   */ static async updateProduct(id, updates) {
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(id, updates, {
            new: true
        }).lean();
        return updated ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(updated) : null;
    }
    /**
   * Get a single product by id and map to DomainProduct.
   * @param {String} id
   * @returns {Promise<DomainProduct|null>}
   */ static async getProductById(id) {
        const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(id).lean();
        return doc ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(doc) : null;
    }
    /**
   * Search products with optional text query, pagination and inStock filter.
   *
   * When using the text query `q`, the productModel has a text index on
   * name & description so results are matched. Consider sorting by score
   * if relevance ordering is desired.
   *
   * @param {Object} opts
   * @param {string} [opts.q] - full-text search string
   * @param {number} [opts.page=1]
   * @param {number} [opts.limit=20]
   * @param {boolean} [opts.inStockOnly=false]
   * @returns {Promise<{items: DomainProduct[], total:number, page:number, limit:number}>}
   */ static async searchProducts({ q = "", page = 1, limit = 20, inStockOnly = false } = {}) {
        const filter = {};
        if (q) {
            // $text requires a text index (added to productModel)
            filter.$text = {
                $search: q
            };
        }
        if (inStockOnly) filter["sizes.stock"] = {
            $gt: 0
        };
        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const docs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).skip(skip).limit(Number(limit)).lean();
        const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].countDocuments(filter);
        const items = docs.map((d)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(d));
        return {
            items,
            total,
            page: Number(page),
            limit: Number(limit)
        };
    }
}
}),
"[project]/src/pages/api/products/[id].js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/products/[id].js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/catalogService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
;
;
;
async function handler(req, res) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    } catch (err) {
        console.error("DB connect failed:", err);
        return res.status(500).json({
            error: "Database connection failed"
        });
    }
    const { id } = req.query;
    if (req.method === "GET") {
        try {
            const prod = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].getProductById(id);
            if (!prod) return res.status(404).json({
                error: "Product not found"
            });
            return res.status(200).json(prod);
        } catch (err) {
            console.error("GET /api/products/[id] error:", err);
            return res.status(500).json({
                error: err.message || "Failed to fetch product"
            });
        }
    }
    if (req.method === "PUT") {
        try {
            // TODO: add admin auth check
            const updates = req.body || {};
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateProduct(id, updates);
            if (!updated) return res.status(404).json({
                error: "Product not found"
            });
            return res.status(200).json(updated);
        } catch (err) {
            console.error("PUT /api/products/[id] error:", err);
            return res.status(400).json({
                error: err.message || "Failed to update product"
            });
        }
    }
    if (req.method === "DELETE") {
        try {
            // TODO: add admin auth
            // Soft-delete: set archived flag if exists, else remove
            const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(id);
            if (!doc) return res.status(404).json({
                error: "Product not found"
            });
            if (doc.archived === undefined) {
                // no archived field in schema by default — delete instead
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].deleteOne({
                    _id: id
                });
                return res.status(204).end();
            } else {
                doc.archived = true;
                await doc.save();
                return res.status(200).json({
                    success: true,
                    archived: true
                });
            }
        } catch (err) {
            console.error("DELETE /api/products/[id] error:", err);
            return res.status(500).json({
                error: err.message || "Failed to delete product"
            });
        }
    }
    res.setHeader("Allow", [
        "GET",
        "PUT",
        "DELETE"
    ]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__99c1477e._.js.map