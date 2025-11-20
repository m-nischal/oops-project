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
"[project]/src/models/orderModel.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// models/orderModel.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const { Schema } = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"];
/**
 * Minimal snapshot item schema used inside Order documents.
 */ const orderItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    sizeLabel: {
        type: String,
        required: true
    },
    qty: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    estimatedDelivery: {
        type: Date
    }
}, {
    _id: false
});
/**
 * Status history entries
 */ const statusHistorySchema = new Schema({
    status: {
        type: String,
        required: true
    },
    at: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String
    }
}, {
    _id: false
});
const orderSchema = new Schema({
    // --- NEW FIELD ---
    // Tracks which User (Retailer or Wholesaler) is the seller
    // responsible for fulfilling this order.
    sellerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    /* --- Existing Fields --- */ customer: {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String
        },
        phone: {
            type: String
        },
        address: {
            type: String
        },
        customerLocation: {
            type: Schema.Types.Mixed
        }
    },
    items: {
        type: [
            orderItemSchema
        ],
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    shipping: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: [
            "created",
            "ordered",
            "pending",
            "paid",
            "processing",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "refunded"
        ],
        default: "created"
    },
    statusHistory: {
        type: [
            statusHistorySchema
        ],
        default: []
    },
    estimatedDelivery: {
        type: Date
    },
    payment: {
        provider: {
            type: String
        },
        paymentId: {
            type: String
        },
        method: {
            type: String
        },
        paidAt: {
            type: Date
        },
        refundedAt: {
            type: Date
        },
        refundInfo: {
            type: Schema.Types.Mixed
        }
    },
    fulfillment: {
        trackingNumber: String,
        carrier: String,
        shippedAt: Date,
        outForDeliveryAt: Date,
        deliveredAt: Date
    },
    shippedAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    meta: {
        type: Schema.Types.Mixed
    },
    archived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Useful indexes
orderSchema.index({
    userId: 1,
    createdAt: -1
});
orderSchema.index({
    "customer.email": 1
});
orderSchema.index({
    status: 1,
    createdAt: -1
});
// --- NEW INDEX ---
// This will make dashboard queries for orders much faster.
orderSchema.index({
    sellerId: 1,
    status: 1,
    createdAt: -1
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Order || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Order", orderSchema);
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
/* --- (all your existing sub-schemas) --- */ const ReviewSchema = new Schema({
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
const SizeVariantSchema = new Schema({
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
const SizeChartSchema = new Schema({
    chartName: {
        type: String
    },
    data: {
        type: Schema.Types.Mixed
    },
    image: {
        type: String
    }
}, {
    _id: false
});
const WarehouseSchema = new Schema({
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
    leadTimeDays: {
        type: Number,
        default: 2
    },
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
const ProductDetailsSchema = new Schema({
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
    extras: {
        type: Schema.Types.Mixed
    }
}, {
    _id: false
});
/* --- Main Product Schema --- */ const ProductSchema = new Schema({
    // --- NEW FIELD ---
    // Tracks who owns this product document (Retailer or Wholesaler).
    // This will point to your 'User' model.
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // --- NEW FIELD ---
    // If this is a Retail Listing (ownerId is a Retailer),
    // this field links back to the Wholesaler's original "Base Product".
    wholesaleSourceId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        default: null,
        index: true
    },
    /* --- Existing Fields --- */ name: {
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
    images: [
        {
            type: String
        }
    ],
    sizes: [
        SizeVariantSchema
    ],
    sizeChart: SizeChartSchema,
    productDetails: ProductDetailsSchema,
    reviews: [
        ReviewSchema
    ],
    warehouses: [
        WarehouseSchema
    ],
    totalStock: {
        type: Number,
        default: 0
    },
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
/* --- Existing Methods & Statics --- */ /**
 * helper to recalc totalStock (instance method)
 */ ProductSchema.methods.recalculateStock = function() {
    const sizeStock = (this.sizes || []).reduce((acc, s)=>acc + (s.stock || 0), 0);
    this.totalStock = sizeStock;
    return this.totalStock;
};
/**
 * get best delivery estimate
 */ ProductSchema.methods.estimateDeliveryTo = function(customerLocation = {}) {
    // ... (your existing method logic) ...
    const whs = this.warehouses || [];
    if (!whs.length) return {
        estimatedDays: null,
        reason: "no warehouses configured"
    };
    const byPincode = whs.find((w)=>w.pincode && customerLocation.pincode && w.pincode === customerLocation.pincode);
    if (byPincode) {
        return {
            estimatedDays: byPincode.leadTimeDays,
            warehouse: byPincode,
            method: "pincode-match"
        };
    }
    // ... (rest of your logic) ...
    const byCity = whs.find((w)=>w.city && customerLocation.city && w.city.toLowerCase() === customerLocation.city.toLowerCase());
    if (byCity) {
        return {
            estimatedDays: byCity.leadTimeDays + 1,
            warehouse: byCity,
            method: "city-match"
        };
    }
    const byState = whs.find((w)=>w.state && customerLocation.state && w.state.toLowerCase() === customerLocation.state.toLowerCase());
    if (byState) {
        return {
            estimatedDays: byState.leadTimeDays + 2,
            warehouse: byState,
            method: "state-match"
        };
    }
    const minWh = whs.reduce((min, w)=>!min || w.leadTimeDays < min.leadTimeDays ? w : min, null);
    return {
        estimatedDays: minWh ? minWh.leadTimeDays + 4 : null,
        warehouse: minWh,
        method: "fallback"
    };
};
/**
 * STATIC HELPER: computeTotalStockForPlainObject
 */ ProductSchema.statics.computeTotalStockForPlainObject = function(productPlain = {}) {
    // ... (your existing static logic) ...
    if (!productPlain) return 0;
    if (typeof productPlain.totalStock === "number" && Array.isArray(productPlain.sizes) === false) {
        return productPlain.totalStock;
    }
    if (Array.isArray(productPlain.sizes)) {
        return productPlain.sizes.reduce((acc, s)=>{
            const n = s && (typeof s.stock === "number" ? s.stock : Number(s?.qty ?? 0));
            return acc + (Number.isFinite(n) ? n : 0);
        }, 0);
    }
    if (typeof productPlain.stock === "number") return productPlain.stock;
    return 0;
};
/**
 * OPTIONAL STATIC HELPER: recalculateAndPersist
 */ ProductSchema.statics.recalculateAndPersist = async function(productId) {
    // ... (your existing static logic) ...
    if (!productId) throw new Error("productId required");
    const Product = this;
    const doc = await Product.findById(productId);
    if (!doc) throw new Error("product not found");
    doc.recalculateStock();
    await doc.save();
    return doc.totalStock;
};
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Product || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Product", ProductSchema);
}),
"[project]/src/services/inventory.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/services/inventory.js
__turbopack_context__.s([
    "InsufficientStockError",
    ()=>InsufficientStockError,
    "InvalidParamsError",
    ()=>InvalidParamsError,
    "InventoryError",
    ()=>InventoryError,
    "default",
    ()=>InventoryService
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.js [api] (ecmascript)");
;
;
/**
 * InventoryService
 *
 * - All operations accept an optional mongoose session for transactional safety.
 * - decreaseStockForItems attempts to decrement each product-size atomically and
 *   throws InsufficientStockError if any item cannot be satisfied.
 *
 * Note: callers (OrderService.createOrder, refund flows) should start a session
 * and transaction when they want the whole operation to be atomic.
 */ /** Base error for inventory operations */ class InventoryError extends Error {
}
/** Thrown when requested qty cannot be satisfied */ class InsufficientStockError extends InventoryError {
}
/** Thrown when input params are invalid */ class InvalidParamsError extends InventoryError {
}
class InventoryService {
    /**
   * Normalize size label defensively.
   * @private
   * @param {any} sizeLabel
   * @returns {string}
   */ static _normalizeLabel(sizeLabel) {
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
   */ static _validateParams(productId, sizeLabel, qty) {
        if (!productId) throw new InvalidParamsError("productId is required");
        const label = this._normalizeLabel(sizeLabel);
        if (!label) throw new InvalidParamsError("sizeLabel is required");
        const q = Number(qty);
        if (!Number.isFinite(q) || q <= 0) throw new InvalidParamsError("qty must be a positive number");
        return {
            productId,
            sizeLabel: label,
            qty: Math.floor(q)
        };
    }
    /**
   * Decrease stock for a specific product size by qty.
   * If a mongoose session is provided, the update participates in the transaction.
   * Uses positional $ operator to decrement correct array element.
   * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @param {Number} qty
   * @param {mongoose.ClientSession} [session]
   * @returns {Promise<boolean>} true if modified, throws InsufficientStockError otherwise
   * @throws {InvalidParamsError|InsufficientStockError}
   */ static async decreaseStock(productId, sizeLabel, qty, session = null) {
        const params = this._validateParams(productId, sizeLabel, qty);
        // Filter ensures size exists and has enough stock
        const filter = {
            _id: params.productId,
            "sizes.size": params.sizeLabel,
            "sizes.stock": {
                $gte: params.qty
            }
        };
        const update = {
            $inc: {
                "sizes.$.stock": -params.qty
            }
        };
        const options = {};
        if (session) options.session = session;
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne(filter, update, options);
        const modified = (res.modifiedCount ?? res.nModified ?? 0) > 0;
        if (!modified) {
            // fetch current available stock for better error message
            const current = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                _id: params.productId,
                "sizes.size": params.sizeLabel
            }, {
                "sizes.$": 1
            }).session(session).lean();
            const available = current && current.sizes && current.sizes[0] ? Number(current.sizes[0].stock || 0) : 0;
            throw new InsufficientStockError(`Insufficient stock for product ${params.productId} size ${params.sizeLabel}. Requested ${params.qty}, available ${available}`);
        }
        // defensive post-check: ensure new stock is not negative
        const post = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
            _id: params.productId,
            "sizes.size": params.sizeLabel
        }, {
            "sizes.$": 1
        }).session(session).lean();
        const newStock = post && post.sizes && post.sizes[0] ? Number(post.sizes[0].stock || 0) : 0;
        if (newStock < 0) {
            throw new InsufficientStockError(`Post-update stock negative (${newStock}) for product ${params.productId} size ${params.sizeLabel}`);
        }
        return true;
    }
    /**
   * Increase stock for a specific product size by qty (restock/cancel).
   * Returns true if an existing size was updated, false if not found (size missing).
   * Use addOrCreateSize to add a missing size.
   * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @param {Number} qty
   * @param {mongoose.ClientSession} [session]
   * @returns {Promise<boolean>}
   */ static async increaseStock(productId, sizeLabel, qty, session = null) {
        const params = this._validateParams(productId, sizeLabel, qty);
        const filter = {
            _id: params.productId,
            "sizes.size": params.sizeLabel
        };
        const update = {
            $inc: {
                "sizes.$.stock": params.qty
            }
        };
        const options = {};
        if (session) options.session = session;
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne(filter, update, options);
        const modified = (res.modifiedCount ?? res.nModified ?? 0) > 0;
        if (modified) {
            // post-check to ensure validators didn't allow a bad state
            const post = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                _id: params.productId,
                "sizes.size": params.sizeLabel
            }, {
                "sizes.$": 1
            }).session(session).lean();
            const newStock = post && post.sizes && post.sizes[0] ? Number(post.sizes[0].stock || 0) : 0;
            if (newStock < 0) {
                throw new InventoryError(`Post-increase stock negative (${newStock}) for product ${params.productId} size ${params.sizeLabel}`);
            }
            return true;
        }
        // size missing -> return false to let callers add/create
        return false;
    }
    /**
   * Add a new size entry if it doesn't exist, or set the stock if it does.
   * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @param {Number} qty
   * @param {mongoose.ClientSession} [session]
   * @returns {Promise<void>}
   * @throws {InvalidParamsError}
   */ static async addOrCreateSize(productId, sizeLabel, qty = 0, session = null) {
        if (!productId) throw new InvalidParamsError("productId is required");
        const label = this._normalizeLabel(sizeLabel);
        if (!label) throw new InvalidParamsError("sizeLabel is required");
        const q = Math.max(0, Math.floor(Number(qty) || 0));
        // Try to update existing size's stock (set to q)
        const setRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
            _id: productId,
            "sizes.size": label
        }, {
            $set: {
                "sizes.$.stock": q
            }
        }, session ? {
            session
        } : {});
        const modified = (setRes.modifiedCount ?? setRes.nModified ?? 0) > 0;
        if (modified) return;
        // If not modified, push a new size
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
            _id: productId
        }, {
            $push: {
                sizes: {
                    size: label,
                    stock: q
                }
            }
        }, session ? {
            session
        } : {});
    }
    /**
   * Get stock for a specific size. Returns 0 if product or size not found.
   * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @returns {Promise<number>}
   */ static async getStock(productId, sizeLabel) {
        if (!productId) throw new InvalidParamsError("productId is required");
        const label = this._normalizeLabel(sizeLabel);
        if (!label) throw new InvalidParamsError("sizeLabel is required");
        const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(productId, {
            sizes: 1
        }).lean();
        if (!doc || !Array.isArray(doc.sizes)) return 0;
        const s = doc.sizes.find((x)=>String(x.size).trim() === label);
        return s ? Number(s.stock || 0) : 0;
    }
    /**
   * Returns total stock across all sizes for the product (integer).
   * @param {String|ObjectId} productId
   * @returns {Promise<number>}
   */ static async totalStock(productId) {
        if (!productId) throw new InvalidParamsError("productId is required");
        const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(productId, {
            sizes: 1
        }).lean();
        if (!doc || !Array.isArray(doc.sizes)) return 0;
        return doc.sizes.reduce((sum, s)=>sum + Math.max(0, Number(s.stock || 0)), 0);
    }
    /**
   * Decrease stock for multiple items inside a session/transaction.
   * This method expects a mongoose session that has had startTransaction called.
   * It will throw InsufficientStockError if any individual decrement cannot be applied.
   *
   * @param {Array<{productId: string, sizeLabel: string, qty: number}>} items
   * @param {mongoose.ClientSession} session - required
   * @returns {Promise<void>}
   * @throws {InvalidParamsError|InsufficientStockError}
   */ static async decreaseStockForItems(items = [], session) {
        if (!Array.isArray(items) || items.length === 0) return;
        if (!session) throw new InvalidParamsError("A mongoose session is required for multi-item decrease");
        // Validate items and normalize labels
        for (const it of items){
            it.sizeLabel = this._normalizeLabel(it.sizeLabel);
            this._validateParams(it.productId, it.sizeLabel, it.qty);
        }
        // Attempt each update; on failure fetch available and throw InsufficientStockError
        for (const it of items){
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                _id: it.productId,
                "sizes.size": it.sizeLabel,
                "sizes.stock": {
                    $gte: it.qty
                }
            }, {
                $inc: {
                    "sizes.$.stock": -it.qty
                }
            }, {
                session,
                runValidators: true
            });
            const modified = (updated.modifiedCount ?? updated.nModified ?? 0) > 0;
            if (!modified) {
                const current = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                    _id: it.productId,
                    "sizes.size": it.sizeLabel
                }, {
                    "sizes.$": 1
                }).session(session).lean();
                const available = current && current.sizes && current.sizes[0] ? Number(current.sizes[0].stock || 0) : 0;
                throw new InsufficientStockError(`Insufficient stock for product ${it.productId} size ${it.sizeLabel}. Requested ${it.qty}, available ${available}`);
            }
            // post-check
            const post = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                _id: it.productId,
                "sizes.size": it.sizeLabel
            }, {
                "sizes.$": 1
            }).session(session).lean();
            const newStock = post && post.sizes && post.sizes[0] ? Number(post.sizes[0].stock || 0) : 0;
            if (newStock < 0) {
                throw new InsufficientStockError(`Post-update stock negative (${newStock}) for product ${it.productId} size ${it.sizeLabel}`);
            }
        }
    // all decrements succeeded (still inside caller's transaction)
    }
}
;
}),
"[project]/src/services/orderService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/services/orderService.js
__turbopack_context__.s([
    "InsufficientStockError",
    ()=>InsufficientStockError,
    "InvalidOrderParamsError",
    ()=>InvalidOrderParamsError,
    "OrderError",
    ()=>OrderError,
    "default",
    ()=>OrderService
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/orderModel.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/inventory.js [api] (ecmascript)");
;
;
;
;
/**
 * @file OrderService
 * @brief Order creation and lifecycle helpers (get, list, status updates, refunds).
 *
 * This service coordinates with InventoryService for stock changes and uses
 * mongoose transactions to ensure atomic operations when modifying inventory
 * and orders together.
 */ /** Base order error */ class OrderError extends Error {
}
/** Thrown when stock cannot be satisfied during create/update */ class InsufficientStockError extends OrderError {
}
/** Thrown when invalid input supplied */ class InvalidOrderParamsError extends OrderError {
}
class OrderService {
    /**
   * Create an order atomically: validates items, decrements stock, and saves order doc.
   *
   * On success the saved Mongoose Order document is returned.
   *
   * @param {Object} customer - { name, email, phone, address, customerLocation? }
   * @param {Array<{productId, sizeLabel, qty}>} items
   * @returns {Promise<Object>} saved Mongoose Order document
   * @throws {OrderError|InsufficientStockError|Error}
   */ static async createOrder(customer = {}, items = [], sellerId = null) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new OrderError("Order must contain at least one item");
        }
        const session = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].startSession();
        try {
            session.startTransaction();
            // 1) Load product docs for all requested items (inside session) as model instances (no .lean())
            const productIds = [
                ...new Set(items.map((i)=>String(i.productId)))
            ];
            const products = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find({
                _id: {
                    $in: productIds
                }
            }).session(session);
            const productMap = new Map(products.map((p)=>[
                    String(p._id),
                    p
                ]));
            // 2) Build order items with snapshots and validation
            const orderItems = [];
            for (const it of items){
                const pid = String(it.productId);
                const doc = productMap.get(pid);
                if (!doc) {
                    throw new OrderError(`Product not found: ${pid}`);
                }
                const qty = Math.max(0, Math.floor(Number(it.qty || 0)));
                if (qty <= 0) throw new OrderError(`Invalid quantity for product ${pid}`);
                const size = Array.isArray(doc.sizes) ? doc.sizes.find((s)=>s.size === it.sizeLabel || s.size === it.size) : null;
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
            // 3) Attempt multi-item atomic stock decrement using InventoryService (throws on insufficient)
            const inventoryItems = items.map((i)=>({
                    productId: i.productId,
                    sizeLabel: i.sizeLabel,
                    qty: i.qty
                }));
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].decreaseStockForItems(inventoryItems, session);
            // 4) Calculate totals
            const subtotal = orderItems.reduce((s, it)=>s + (it.subtotal || 0), 0);
            const shipping = 0;
            const tax = 0;
            const discount = 0;
            const total = subtotal + shipping + tax - discount;
            // ----------------------------
            // Compute estimated delivery
            // ----------------------------
            // Use the Product instance method estimateDeliveryTo(customerLocation) if available.
            const customerLocation = customer && (customer.customerLocation || customer.location) || {};
            const perItemEstimates = [];
            for(let idx = 0; idx < orderItems.length; idx++){
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
                estimatedDelivery = new Date(Math.max(...perItemEstimates.map((d)=>d.getTime())));
            } else {
                // fallback default (5 days)
                estimatedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
            }
            // 5) Create order doc (inside same transaction) with statusHistory and ETA
            const now = new Date();
            const initialStatus = "ordered"; // set to 'ordered' to reflect placed order
            const orderDoc = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"]({
                sellerId: sellerId,
                customer,
                items: orderItems,
                subtotal,
                shipping,
                tax,
                discount,
                total,
                status: initialStatus,
                statusHistory: [
                    {
                        status: initialStatus,
                        at: now,
                        note: "Order placed"
                    }
                ],
                estimatedDelivery
            });
            const saved = await orderDoc.save({
                session
            });
            await session.commitTransaction();
            session.endSession();
            return saved;
        } catch (err) {
            try {
                await session.abortTransaction();
            } catch (_) {}
            session.endSession();
            // Map inventory error to domain-level InsufficientStockError
            if (err && (err.name === "InsufficientStockError" || err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["InsufficientStockError"])) {
                throw new InsufficientStockError(err.message);
            }
            throw err;
        }
    }
    /**
   * List orders with optional userId filter and pagination.
   * @param {Object} opts
   * @param {String} [opts.userId]
   * @param {number} [opts.page=1]
   * @param {number} [opts.limit=20]
   * @returns {Promise<{items:Object[], total:number, page:number, limit:number}>}
   */ static async listOrders({ userId, page = 1, limit = 20 } = {}) {
        const filter = {};
        if (userId) filter.userId = userId;
        const skip = Math.max(0, (Number(page) - 1) * Number(limit));
        const items = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).sort({
            createdAt: -1
        }).skip(skip).limit(Number(limit)).lean();
        const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].countDocuments(filter);
        return {
            items,
            total,
            page: Number(page),
            limit: Number(limit)
        };
    }
    /**
   * Get a single order by id.
   * @param {String} id - Order ObjectId/string
   * @returns {Promise<Object|null>}
   */ static async getById(id) {
        if (!id) throw new InvalidOrderParamsError("Order id is required");
        const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(id).lean();
        return doc || null;
    }
    /**
   * Internal helper: restore stock for an order's items inside a session.
   * If a product size doesn't exist, it will be created with the restored qty.
   *
   * @private
   * @param {Object[]} items - order items array (having productId, sizeLabel, qty)
   * @param {mongoose.ClientSession} session
   */ static async _restoreStockForItems(items = [], session) {
        if (!Array.isArray(items) || items.length === 0) return;
        if (!session) throw new InvalidOrderParamsError("A mongoose session is required for restore");
        // For each item: attempt increaseStock; if increaseStock returns false (size missing) use addOrCreateSize then increaseStock
        for (const it of items){
            const productId = it.productId;
            const sizeLabel = it.sizeLabel;
            const qty = it.qty;
            // attempt to increase (if size exists)
            const increased = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].increaseStock(productId, sizeLabel, qty, session);
            if (!increased) {
                // ensure size exists and set stock (preserve existing behavior)
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].addOrCreateSize(productId, sizeLabel, qty, session);
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
   */ static async updateStatus(id, newStatus, { restoreStock = false } = {}) {
        if (!id) throw new InvalidOrderParamsError("Order id is required");
        if (!newStatus || typeof newStatus !== "string") throw new InvalidOrderParamsError("newStatus is required");
        const VALID_STATUSES = [
            "created",
            "ordered",
            "pending",
            "paid",
            "processing",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "refunded"
        ];
        if (!VALID_STATUSES.includes(newStatus)) {
            throw new InvalidOrderParamsError(`Invalid status: ${newStatus}`);
        }
        const session = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].startSession();
        try {
            session.startTransaction();
            const order = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(id).session(session);
            if (!order) throw new OrderError("Order not found");
            const prevStatus = order.status;
            // restore stock if requested and moving to cancelled/refunded
            const shouldRestore = restoreStock && (newStatus === "cancelled" || newStatus === "refunded");
            if (shouldRestore) {
                await OrderService._restoreStockForItems(order.items, session);
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
                order.meta.refund = Object.assign({}, order.meta.refund || {}, {
                    at: now
                });
            }
            const saved = await order.save({
                session
            });
            await session.commitTransaction();
            session.endSession();
            return saved;
        } catch (err) {
            try {
                await session.abortTransaction();
            } catch (_) {}
            session.endSession();
            if (err && (err.name === "InsufficientStockError" || err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["InsufficientStockError"])) {
                throw new InsufficientStockError(err.message);
            }
            throw err;
        }
    }
    /**
   * Process a refund for an order id.
   *
   * Behavior:
   *  - marks order.status = 'refunded'
   *  - optionally restores stock (default true)
   *  - records refund metadata in payment.refundInfo and meta.refund
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
   */ static async refundOrder(id, { restoreStock = true, refundInfo = {} } = {}) {
        if (!id) throw new InvalidOrderParamsError("Order id is required");
        const session = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].startSession();
        try {
            session.startTransaction();
            const order = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(id).session(session);
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
            order.meta.refund = Object.assign({}, order.meta.refund || {}, {
                at: now,
                info: refundInfo
            });
            const saved = await order.save({
                session
            });
            await session.commitTransaction();
            session.endSession();
            return saved;
        } catch (err) {
            try {
                await session.abortTransaction();
            } catch (_) {}
            session.endSession();
            if (err && (err.name === "InsufficientStockError" || err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["InsufficientStockError"])) {
                throw new InsufficientStockError(err.message);
            }
            throw err;
        }
    }
}
;
}),
"[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("jsonwebtoken", () => require("jsonwebtoken"));

module.exports = mod;
}),
"[project]/src/lib/auth.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)");
;
function verifyToken(req) {
    const auth = req.headers.authorization;
    if (!auth) throw new Error("No token");
    const token = auth.split(" ")[1];
    return __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__["default"].verify(token, process.env.JWT_SECRET);
}
}),
"[project]/src/pages/api/retailer/orders/[id].js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/retailer/orders/[id].js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/orderModel.js [api] (ecmascript)"); //
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orderService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/orderService.js [api] (ecmascript)"); //
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.js [api] (ecmascript)"); //
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
;
;
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    const { id: orderId } = req.query; // Get the order ID from the URL
    // --- 1. Authentication ---
    let payload;
    try {
        payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__["verifyToken"])(req); //
        if (!payload || payload.role !== "RETAILER" && payload.role !== "WHOLESALER") {
            return res.status(401).json({
                error: "Unauthorized."
            });
        }
    } catch (err) {
        return res.status(401).json({
            error: "Unauthorized. Invalid token."
        });
    }
    const sellerId = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Types.ObjectId(payload.id);
    // --- 2. Handle PATCH Request for Status Update ---
    if (req.method === 'PATCH') {
        try {
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({
                    error: "New 'status' is required."
                });
            }
            // --- Security Check ---
            // Find the order first to ensure it belongs to this seller
            const order = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(orderId);
            if (!order) {
                return res.status(404).json({
                    error: "Order not found."
                });
            }
            if (order.sellerId.toString() !== sellerId.toString()) {
                return res.status(403).json({
                    error: "Forbidden. You do not own this order."
                });
            }
            // --- Call the OrderService to update the status ---
            //
            const updatedOrder = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orderService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateStatus(orderId, status, {
                restoreStock: status === 'cancelled'
            });
            return res.status(200).json({
                order: updatedOrder
            });
        } catch (err) {
            console.error(err);
            return res.status(400).json({
                error: err.message || "Failed to update order status."
            });
        }
    }
    // Handle other methods
    res.setHeader('Allow', [
        'PATCH'
    ]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5a051718._.js.map