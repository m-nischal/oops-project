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
"[project]/src/models/Product.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/models/Product.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const { Schema } = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"];
/**
 * Review subdocument
 * - rating: number (1..5)
 * - comment: string
 * - author: optional (retailer/customer id or name)
 * - createdAt
 */ const ReviewSchema = new Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ""
    },
    author: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
/**
 * Size variant schema:
 * - size (S, M, L, XL, 6M etc.)
 * - sku (optional)
 * - stock (number)
 * - price override (optional)
 */ const SizeVariantSchema = new Schema({
    size: {
        type: String,
        required: true
    },
    sku: {
        type: String
    },
    stock: {
        type: Number,
        default: 0
    },
    price: {
        type: Number
    }
});
/**
 * Size chart (generic object). Example:
 * { "S": { chest: "...", length: "..." }, ... }
 */ const SizeChartSchema = new Schema({
    chartName: {
        type: String
    },
    data: {
        type: Schema.Types.Mixed
    }
}, {
    _id: false
});
/**
 * Warehouse / storage location
 * retailers / wholesalers provide this
 */ const WarehouseSchema = new Schema({
    name: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    country: {
        type: String
    },
    pincode: {
        type: String
    },
    // approximate lead time (in days) from this warehouse to deliver locally
    leadTimeDays: {
        type: Number,
        default: 2
    },
    // optional geo coords (if you want to compute distance later)
    location: {
        type: {
            type: String,
            enum: [
                'Point'
            ],
            default: 'Point'
        },
        coordinates: {
            type: [
                Number
            ],
            default: undefined
        }
    }
}, {
    _id: false
});
/**
 * Product details object (clothing attributes)
 */ const ProductDetailsSchema = new Schema({
    materialComposition: {
        type: String
    },
    sleeveType: {
        type: String
    },
    materialType: {
        type: String
    },
    fitType: {
        type: String
    },
    length: {
        type: String
    },
    neckStyle: {
        type: String
    },
    countryOfOrigin: {
        type: String
    },
    // allow extra props
    extras: {
        type: Schema.Types.Mixed
    }
}, {
    _id: false
});
const ProductSchema = new Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    slug: {
        type: String,
        index: true
    },
    description: {
        type: String
    },
    brand: {
        type: String
    },
    retailer: {
        type: String
    },
    category: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    // multiple pictures (store URLs)
    images: [
        {
            type: String
        }
    ],
    // stock per variant (sizes)
    sizes: [
        SizeVariantSchema
    ],
    sizeChart: SizeChartSchema,
    productDetails: ProductDetailsSchema,
    // reviews
    reviews: [
        ReviewSchema
    ],
    // warehouses where the product is stored
    warehouses: [
        WarehouseSchema
    ],
    // general inventory: totalStock (derived field)
    totalStock: {
        type: Number,
        default: 0
    },
    // any tags or metadata
    tags: [
        String
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
/**
 * helper to recalc totalStock
 */ ProductSchema.methods.recalculateStock = function() {
    const sizeStock = (this.sizes || []).reduce((acc, s)=>acc + (s.stock || 0), 0);
    // Optionally we could add warehouse counts; using size stock as source of truth
    this.totalStock = sizeStock;
    return this.totalStock;
};
/**
 * get best delivery estimate for a given customer location object:
 * { city, state, country, pincode }
 *
 * Simple approach used here:
 * - If there's a warehouse in same pincode => return warehouse.leadTimeDays (fastest)
 * - else if same city => warehouse.leadTimeDays + 1
 * - else if same state => warehouse.leadTimeDays + 2
 * - else => warehouse.leadTimeDays + 4
 *
 * (This is a placeholder algorithm — you can replace with distance or courier API)
 */ ProductSchema.methods.estimateDeliveryTo = function(customerLocation = {}) {
    const whs = this.warehouses || [];
    if (!whs.length) return {
        estimatedDays: null,
        reason: "no warehouses configured"
    };
    // find exact pincode match
    const byPincode = whs.find((w)=>w.pincode && customerLocation.pincode && w.pincode === customerLocation.pincode);
    if (byPincode) {
        return {
            estimatedDays: byPincode.leadTimeDays,
            warehouse: byPincode,
            method: "pincode-match"
        };
    }
    // same city
    const byCity = whs.find((w)=>w.city && customerLocation.city && w.city.toLowerCase() === customerLocation.city.toLowerCase());
    if (byCity) {
        return {
            estimatedDays: byCity.leadTimeDays + 1,
            warehouse: byCity,
            method: "city-match"
        };
    }
    // same state
    const byState = whs.find((w)=>w.state && customerLocation.state && w.state.toLowerCase() === customerLocation.state.toLowerCase());
    if (byState) {
        return {
            estimatedDays: byState.leadTimeDays + 2,
            warehouse: byState,
            method: "state-match"
        };
    }
    // fallback: pick warehouse with smallest leadTimeDays and add generic shipping
    const minWh = whs.reduce((min, w)=>!min || w.leadTimeDays < min.leadTimeDays ? w : min, null);
    return {
        estimatedDays: minWh ? minWh.leadTimeDays + 4 : null,
        warehouse: minWh,
        method: "fallback"
    };
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/domain/catalog.js [api] (ecmascript)");
;
;
class CatalogService {
    /**
   * Create a new product document and return a DomainProduct instance.
   * @param {Object} data - product payload compatible with productModel / DomainProduct
   * @returns {Promise<DomainProduct>} created product (domain)
   */ static async createProduct(data) {
        const model = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"](data);
        const saved = await model.save();
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(saved);
    }
    /**
   * Update a product by id and return DomainProduct or null if not found.
   * @param {String} id - product ObjectId or string
   * @param {Object} updates - partial product fields to update
   * @returns {Promise<DomainProduct|null>}
   */ static async updateProduct(id, updates) {
        const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findByIdAndUpdate(id, updates, {
            new: true
        }).lean();
        return updated ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(updated) : null;
    }
    /**
   * Get a single product by id and map to DomainProduct.
   * @param {String} id
   * @returns {Promise<DomainProduct|null>}
   */ static async getProductById(id) {
        const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(id).lean();
        return doc ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(doc) : null;
    }
    /**
   * Get a list of products with optional filtering, pagination and projection.
   * Returns lean objects by default (fast for APIs showing current stock).
   *
   * @param {Object} filter - MongoDB filter
   * @param {Object} opts - { lean=true/false, limit, skip, sort }
   * @returns {Promise<Array|Object>} array of products (lean objects) or DomainProduct mapping
   */ static async getProducts(filter = {}, opts = {}) {
        const { lean = true, limit = 0, skip = 0, sort = {
            createdAt: -1
        } } = opts;
        let q = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).sort(sort).skip(Number(skip)).limit(Number(limit));
        if (lean) q = q.lean();
        const docs = await q.exec();
        if (!lean) return docs.map((d)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(d));
        return docs;
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
            filter.$text = {
                $search: q
            };
        }
        if (inStockOnly) filter["sizes.stock"] = {
            $gt: 0
        };
        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const docs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).skip(skip).limit(Number(limit)).lean();
        const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].countDocuments(filter);
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
"[project]/src/pages/api/products/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/products/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/catalogService.js [api] (ecmascript)"); // adjust path if your project resolves differently
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method === "GET") {
        try {
            const { categoryId, limit = 20, page = 1, q = "", inStockOnly, storefront } = req.query;
            const filter = {};
            // If caller passed categoryId, compute descendants if your Category model supports path
            if (categoryId) {
                // keep behaviour simple here; if you have getDescendantCategoryIds helper, call it.
                filter.categories = {
                    $in: [
                        categoryId
                    ]
                };
            }
            if (storefront) filter.storefronts = storefront;
            if (inStockOnly === "true") filter["sizes.stock"] = {
                $gt: 0
            };
            if (q) filter.$text = {
                $search: q
            };
            const skip = (Number(page) - 1) * Number(limit);
            const products = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].getProducts(filter, {
                lean: true,
                limit: Number(limit),
                skip,
                sort: {
                    createdAt: -1
                }
            });
            const total = await __turbopack_context__.A("[project]/src/models/Product.js [api] (ecmascript, async loader)").then((m)=>m.default.countDocuments(filter));
            return res.status(200).json({
                items: products,
                total: await total
            });
        } catch (err) {
            console.error("GET /api/products error:", err && (err.stack || err));
            return res.status(500).json({
                message: "Failed to fetch products"
            });
        }
    }
    res.status(405).json({
        message: "Method not allowed"
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__aa8b349e._.js.map