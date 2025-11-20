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
 * We intentionally store product name and unitPrice as snapshot values
 * to preserve historical pricing even if product changes later.
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
    }
}, {
    _id: false
});
const orderSchema = new Schema({
    customer: {
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
            "pending",
            "paid",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded"
        ],
        default: "created"
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
        }
    },
    fulfillment: {
        trackingNumber: String,
        carrier: String,
        shippedAt: Date,
        deliveredAt: Date
    },
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
// Useful indexes for listing and filtering orders
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
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Order || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Order", orderSchema);
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
const sizeSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    label: {
        type: String,
        required: true
    },
    // added min: 0 to prevent negative stock values when validators run
    stock: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    _id: false
});
const ratingSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    avg: {
        type: Number,
        default: 0
    },
    count: {
        type: Number,
        default: 0
    }
}, {
    _id: false
});
/**
 * Product schema - stores snapshot of product data and size-level stock.
 * Use integer currency values (e.g., rupees or paisa) consistently across the app.
 */ const productSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    materials: {
        type: [
            String
        ],
        default: []
    },
    images: {
        type: [
            String
        ],
        default: []
    },
    sizes: {
        type: [
            sizeSchema
        ],
        default: []
    },
    rating: {
        type: ratingSchema,
        default: ()=>({})
    },
    category: {
        type: String,
        default: "General"
    }
}, {
    timestamps: true
});
// Text index for full-text search on name and description
productSchema.index({
    name: "text",
    description: "text"
});
// Prevent model overwrite in dev/hot-reload environments (Next.js etc.)
const Product = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Product || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Product", productSchema);
const __TURBOPACK__default__export__ = Product;
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
;
/**
 * @file InventoryService
 * @brief Centralized product stock operations (sizes array).
 *
 * Responsibilities:
 *  - Single-item atomic updates (increaseStock, decreaseStock)
 *  - Multi-item transactional decrement (decreaseStockForItems)
 *  - Safe helpers for adding sizes, checking stock, and total stock
 *
 * Notes:
 *  - We use runValidators: true on updateOne to enforce schema constraints
 *    such as min: 0 on size.stock.
 *  - After each decrement we read back the value and throw if stock is negative
 *    so callers (inside transactions) can abort and avoid persisted negative values.
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
   * Uses runValidators to ensure schema constraints (min:0) are enforced.
   * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @param {Number} qty
   * @param {mongoose.ClientSession} [session]
   * @returns {Promise<boolean>} true if modified, throws InsufficientStockError otherwise
   * @throws {InvalidParamsError|InsufficientStockError}
   */ static async decreaseStock(productId, sizeLabel, qty, session = null) {
        const params = this._validateParams(productId, sizeLabel, qty);
        const filter = {
            _id: params.productId,
            "sizes.label": params.sizeLabel,
            "sizes.stock": {
                $gte: params.qty
            }
        };
        const update = {
            $inc: {
                "sizes.$[el].stock": -params.qty
            }
        };
        // include runValidators to enforce schema min:0
        const options = {
            arrayFilters: [
                {
                    "el.label": params.sizeLabel
                }
            ],
            runValidators: true
        };
        if (session) options.session = session;
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne(filter, update, options);
        const modified = (res.modifiedCount ?? res.nModified ?? 0) > 0;
        if (!modified) {
            // fetch current available stock for better error message
            const current = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                _id: params.productId,
                "sizes.label": params.sizeLabel
            }, {
                "sizes.$": 1
            }).session(session).lean();
            const available = current && current.sizes && current.sizes[0] ? Number(current.sizes[0].stock || 0) : 0;
            throw new InsufficientStockError(`Insufficient stock for product ${params.productId} size ${params.sizeLabel}. Requested ${params.qty}, available ${available}`);
        }
        // defensive post-check: ensure new stock is not negative
        const post = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
            _id: params.productId,
            "sizes.label": params.sizeLabel
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
            "sizes.label": params.sizeLabel
        };
        const update = {
            $inc: {
                "sizes.$[el].stock": params.qty
            }
        };
        const options = {
            arrayFilters: [
                {
                    "el.label": params.sizeLabel
                }
            ],
            runValidators: true
        };
        if (session) options.session = session;
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne(filter, update, options);
        const modified = (res.modifiedCount ?? res.nModified ?? 0) > 0;
        if (modified) {
            // post-check to ensure validators didn't allow a bad state
            const post = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                _id: params.productId,
                "sizes.label": params.sizeLabel
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
        const options = {
            arrayFilters: [
                {
                    "el.label": label
                }
            ],
            runValidators: true
        };
        if (session) options.session = session;
        // Try update first; if not matched, push a new size
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
            _id: productId,
            "sizes.label": label
        }, {
            $set: {
                "sizes.$[el].stock": q
            }
        }, options);
        if ((res.modifiedCount ?? res.nModified ?? 0) === 0) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                _id: productId
            }, {
                $push: {
                    sizes: {
                        label,
                        stock: q
                    }
                }
            }, session ? {
                session
            } : {});
        }
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
        const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(productId, {
            sizes: 1
        }).lean();
        if (!doc || !Array.isArray(doc.sizes)) return 0;
        const s = doc.sizes.find((x)=>String(x.label).trim() === label);
        return s ? Number(s.stock || 0) : 0;
    }
    /**
   * Returns total stock across all sizes for the product (integer).
   * @param {String|ObjectId} productId
   * @returns {Promise<number>}
   */ static async totalStock(productId) {
        if (!productId) throw new InvalidParamsError("productId is required");
        const doc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(productId, {
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
            const updated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                _id: it.productId,
                "sizes.label": it.sizeLabel,
                "sizes.stock": {
                    $gte: it.qty
                }
            }, {
                $inc: {
                    "sizes.$[el].stock": -it.qty
                }
            }, {
                arrayFilters: [
                    {
                        "el.label": it.sizeLabel
                    }
                ],
                session,
                runValidators: true
            });
            const modified = (updated.modifiedCount ?? updated.nModified ?? 0) > 0;
            if (!modified) {
                const current = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                    _id: it.productId,
                    "sizes.label": it.sizeLabel
                }, {
                    "sizes.$": 1
                }).session(session).lean();
                const available = current && current.sizes && current.sizes[0] ? Number(current.sizes[0].stock || 0) : 0;
                throw new InsufficientStockError(`Insufficient stock for product ${it.productId} size ${it.sizeLabel}. Requested ${it.qty}, available ${available}`);
            }
            // post-check
            const post = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                _id: it.productId,
                "sizes.label": it.sizeLabel
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
"[project]/src/domain/orders.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/domain/orders.js
/**
 * @file DomainOrder
 * @brief DB-agnostic Domain class representing an Order with lifecycle helpers.
 *
 * Extends the original DomainOrder with status transition helpers (markAsShipped, markAsCancelled, markAsRefunded, etc.)
 * These methods modify the in-memory domain object; persistence should be done by service layers.
 */ __turbopack_context__.s([
    "DomainOrder",
    ()=>DomainOrder,
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
class DomainOrder {
    /**
   * Valid order statuses (mirrors orderModel.js enum).
   * @returns {string[]}
   */ static get VALID_STATUSES() {
        return [
            "created",
            "pending",
            "paid",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded"
        ];
    }
    /**
   * Allowed transitions map (current -> [allowed next statuses])
   * This is conservative but covers common flows. Services can override/allow others.
   * @returns {Object}
   */ static get TRANSITIONS() {
        return {
            created: [
                "pending",
                "paid",
                "processing",
                "cancelled"
            ],
            pending: [
                "paid",
                "processing",
                "cancelled"
            ],
            paid: [
                "processing",
                "cancelled",
                "refunded"
            ],
            processing: [
                "shipped",
                "cancelled",
                "refunded"
            ],
            shipped: [
                "delivered",
                "refunded"
            ],
            delivered: [],
            cancelled: [],
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
   */ constructor({ _id = undefined, customer = {}, items = [], subtotal = 0, shipping = 0, tax = 0, discount = 0, total = 0, status = "created", createdAt = undefined, updatedAt = undefined, userId = undefined, meta = undefined, archived = false, payment = undefined, fulfillment = undefined } = {}){
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
        this.items = items.map((it)=>DomainOrder._normalizeItem(it));
        // Validate items (throws if invalid)
        for (const it of this.items){
            DomainOrder._validateItem(it);
        }
        this._id = _id;
        this.customer = {
            name: String(customer.name),
            email: customer.email ? String(customer.email) : undefined,
            phone: customer.phone ? String(customer.phone) : undefined,
            address: customer.address ? String(customer.address) : undefined
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
   */ static _normalizeItem(it = {}) {
        return {
            productId: it.productId,
            name: it.name ? String(it.name) : "",
            sizeLabel: it.sizeLabel ? String(it.sizeLabel) : "",
            qty: Math.max(0, Math.floor(toNumberSafe(it.qty, 0))),
            unitPrice: toNumberSafe(it.unitPrice, 0),
            subtotal: toNumberSafe(it.subtotal, 0)
        };
    }
    /**
   * Validate a normalized item and ensure subtotal is consistent.
   * Throws Error on invalid item.
   * @private
   * @param {OrderItem} it
   */ static _validateItem(it) {
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
   */ static fromDocument(doc = {}) {
        const d = doc && typeof doc.toObject === "function" ? doc.toObject() : doc || {};
        return new DomainOrder({
            _id: d._id,
            customer: d.customer || {},
            items: (d.items || []).map((i)=>({
                    productId: i.productId,
                    name: i.name,
                    sizeLabel: i.sizeLabel,
                    qty: toNumberSafe(i.qty, 0),
                    unitPrice: toNumberSafe(i.unitPrice, 0),
                    subtotal: toNumberSafe(i.subtotal, 0)
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
   */ static validate(payload = {}) {
        if (!payload) throw new Error("Payload is required");
        if (!payload.customer || !String(payload.customer.name || "").trim()) throw new Error("customer.name is required");
        if (!Array.isArray(payload.items) || payload.items.length === 0) throw new Error("items must be a non-empty array");
        for (const it of payload.items){
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
   */ calculateTotals({ recalculateItemSubtotals = true } = {}) {
        if (!Array.isArray(this.items)) this.items = [];
        let subtotal = 0;
        for (const it of this.items){
            if (recalculateItemSubtotals) {
                it.subtotal = Math.floor(toNumberSafe(it.unitPrice, 0) * toNumberSafe(it.qty, 0));
            }
            subtotal += toNumberSafe(it.subtotal, 0);
        }
        this.subtotal = Math.floor(subtotal);
        // basic total calculation; consumers can set shipping/tax/discount before/after calling this
        this.total = Math.max(0, this.subtotal + toNumberSafe(this.shipping, 0) + toNumberSafe(this.tax, 0) - toNumberSafe(this.discount, 0));
        return {
            subtotal: this.subtotal,
            total: this.total
        };
    }
    /**
   * Add an item to the order (merges with existing item with same productId+sizeLabel).
   * Recalculates totals.
   * @param {OrderItem} item
   */ addItem(item = {}) {
        const it = DomainOrder._normalizeItem(item);
        DomainOrder._validateItem(it);
        const idx = this.items.findIndex((x)=>String(x.productId) === String(it.productId) && String(x.sizeLabel) === String(it.sizeLabel));
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
   */ removeItem(productId, sizeLabel) {
        const prevLen = this.items.length;
        this.items = this.items.filter((x)=>!(String(x.productId) === String(productId) && String(x.sizeLabel) === String(sizeLabel)));
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
   */ updateItemQty(productId, sizeLabel, qty) {
        const idx = this.items.findIndex((x)=>String(x.productId) === String(productId) && String(x.sizeLabel) === String(sizeLabel));
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
   */ canTransitionTo(newStatus) {
        if (!newStatus) return false;
        const cur = String(this.status || "").trim();
        if (!DomainOrder.VALID_STATUSES.includes(newStatus)) return false;
        const allowed = DomainOrder.TRANSITIONS[cur] || [];
        return allowed.includes(newStatus);
    }
    /**
   * Returns true if the order is in a final/terminal status.
   * @returns {boolean}
   */ isFinal() {
        return [
            "delivered",
            "cancelled",
            "refunded"
        ].includes(this.status);
    }
    /**
   * Ensure fulfillment object exists.
   * @private
   */ ensureFulfillment() {
        if (!this.fulfillment || typeof this.fulfillment !== "object") this.fulfillment = {};
    }
    /**
   * Ensure payment object exists.
   * @private
   */ ensurePayment() {
        if (!this.payment || typeof this.payment !== "object") this.payment = {};
    }
    /**
   * Mark order as processing if allowed.
   * @returns {boolean} true if applied
   */ markAsProcessing() {
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
   */ markAsShipped({ carrier, trackingNumber, shippedAt } = {}) {
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
   */ markAsDelivered({ deliveredAt } = {}) {
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
   */ markAsCancelled({ reason } = {}) {
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
   */ markAsRefunded({ refundInfo = {} } = {}) {
        if (!this.canTransitionTo("refunded")) return false;
        this.status = "refunded";
        this.ensurePayment();
        this.payment.refundInfo = Object.assign({}, this.payment.refundInfo || {}, refundInfo);
        this.payment.refundedAt = this.payment.refundedAt || new Date();
        this.meta = this.meta || {};
        this.meta.refund = {
            at: new Date(),
            info: refundInfo
        };
        this.updatedAt = new Date();
        return true;
    }
    /**
   * Set or update tracking number.
   * @param {string} trackingNumber
   */ setTrackingNumber(trackingNumber) {
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
   */ addMeta(pathOrKey, value) {
        if (!pathOrKey) return;
        const parts = String(pathOrKey).split(".").map((p)=>p.trim()).filter(Boolean);
        if (parts.length === 0) return;
        this.meta = this.meta || {};
        let cur = this.meta;
        for(let i = 0; i < parts.length - 1; i++){
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
   */ toObject({ omitId = false } = {}) {
        const obj = {
            customer: {
                name: this.customer.name,
                email: this.customer.email,
                phone: this.customer.phone,
                address: this.customer.address
            },
            items: Array.isArray(this.items) ? this.items.map((it)=>({
                    productId: it.productId,
                    name: it.name,
                    sizeLabel: it.sizeLabel,
                    qty: Math.floor(toNumberSafe(it.qty, 0)),
                    unitPrice: Math.floor(toNumberSafe(it.unitPrice, 0)),
                    subtotal: Math.floor(toNumberSafe(it.subtotal, 0))
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
   * Create a deep clone.
   * @returns {DomainOrder}
   */ clone() {
        return DomainOrder.fromDocument(JSON.parse(JSON.stringify(this.toObject())));
    }
}
const __TURBOPACK__default__export__ = DomainOrder;
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/inventory.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$orders$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/domain/orders.js [api] (ecmascript)");
;
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
   * (Original behaviour preserved.)
   *
   * @param {Object} customer - { name, email, phone, address }
   * @param {Array<{productId, sizeLabel, qty}>} items
   * @returns {Promise<Object>} saved Mongoose Order document
   * @throws {OrderError|InsufficientStockError|Error}
   */ static async createOrder(customer = {}, items = []) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new OrderError("Order must contain at least one item");
        }
        const session = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].startSession();
        try {
            session.startTransaction();
            // 1) Load product docs for all requested items (inside session)
            const productIds = [
                ...new Set(items.map((i)=>String(i.productId)))
            ];
            const products = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find({
                _id: {
                    $in: productIds
                }
            }).session(session).lean();
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
                const size = Array.isArray(doc.sizes) ? doc.sizes.find((s)=>s.label === it.sizeLabel) : null;
                if (!size) throw new OrderError(`Size '${it.sizeLabel}' not found for product ${pid}`);
                const unitPrice = Number(doc.price || 0);
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
            // 5) Create order doc (inside same transaction)
            const orderDoc = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"]({
                customer,
                items: orderItems,
                subtotal,
                shipping,
                tax,
                discount,
                total,
                status: "created"
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
   * Common lifecycle transitions:
   *  - created -> processing -> shipped -> delivered
   *  - any -> cancelled (may restore stock if requested)
   *  - any -> refunded (restore stock if requested)
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
            "pending",
            "paid",
            "processing",
            "shipped",
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
            // If the caller wants to restore stock when moving to cancelled/refunded and
            // stock has previously been decremented (we assume stock was decremented on create),
            // then restore now.
            const shouldRestore = restoreStock && (newStatus === "cancelled" || newStatus === "refunded");
            if (shouldRestore) {
                // restore stock for items
                await OrderService._restoreStockForItems(order.items, session);
            }
            // set status and update fulfillment timestamps where relevant
            order.status = newStatus;
            if (newStatus === "shipped") {
                order.fulfillment = order.fulfillment || {};
                order.fulfillment.shippedAt = order.fulfillment.shippedAt || new Date();
            } else if (newStatus === "delivered") {
                order.fulfillment = order.fulfillment || {};
                order.fulfillment.deliveredAt = order.fulfillment.deliveredAt || new Date();
            } else if (newStatus === "cancelled") {
            // nothing else by default
            } else if (newStatus === "refunded") {
                order.payment = order.payment || {};
                order.payment.refundedAt = order.payment.refundedAt || new Date();
            }
            // Save
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
            // map inventory error to order-level InsufficientStockError
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
   *  - optionally records refund metadata in order.meta.refund
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
            // Restore stock before marking refunded (so consumers won't see refunded order with missing stock)
            if (restoreStock) {
                await OrderService._restoreStockForItems(order.items, session);
            }
            // Mark payment/refund metadata and status
            order.status = "refunded";
            order.payment = order.payment || {};
            order.payment.refundInfo = Object.assign({}, order.payment.refundInfo || {}, refundInfo);
            order.payment.refundedAt = order.payment.refundedAt || new Date();
            // also keep refund trace in meta
            order.meta = order.meta || {};
            order.meta.refund = {
                at: new Date(),
                info: refundInfo
            };
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
"[project]/src/pages/api/orders/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/orders/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orderService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/orderService.js [api] (ecmascript)");
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
    if (req.method === "POST") {
        try {
            const { customer, items } = req.body;
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    error: "items array is required"
                });
            }
            if (!customer || !customer.name) {
                return res.status(400).json({
                    error: "customer.name is required"
                });
            }
            const created = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orderService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].createOrder(customer, items);
            return res.status(201).json(created);
        } catch (err) {
            console.error("POST /api/orders error:", err);
            if (err.name === "InsufficientStockError") {
                return res.status(409).json({
                    error: err.message
                });
            }
            if (err.name === "OrderError") {
                return res.status(400).json({
                    error: err.message
                });
            }
            return res.status(500).json({
                error: err.message || "Failed to create order"
            });
        }
    }
    if (req.method === "GET") {
        try {
            const { page = "1", limit = "20" } = req.query;
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orderService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].listOrders({
                page: Number(page),
                limit: Number(limit)
            });
            return res.status(200).json(result);
        } catch (err) {
            console.error("GET /api/orders error:", err);
            return res.status(500).json({
                error: "Failed to list orders"
            });
        }
    }
    res.setHeader("Allow", [
        "GET",
        "POST"
    ]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3f054214._.js.map