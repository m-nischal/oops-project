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
    stock: {
        type: Number,
        default: 0
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
   * @param {String|ObjectId} productId
   * @param {String} sizeLabel
   * @param {Number} qty
   * @param {mongoose.ClientSession} [session]
   * @returns {Promise<boolean>} true if modified, false otherwise
   * @throws {InvalidParamsError}
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
        const options = {
            arrayFilters: [
                {
                    "el.label": params.sizeLabel
                }
            ]
        };
        if (session) options.session = session;
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne(filter, update, options);
        return (res.modifiedCount ?? res.nModified ?? 0) > 0;
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
            ]
        };
        if (session) options.session = session;
        const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne(filter, update, options);
        return (res.modifiedCount ?? res.nModified ?? 0) > 0;
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
            ]
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
                session
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
    "default",
    ()=>OrderService
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/orderModel.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/inventory.js [api] (ecmascript)");
;
;
;
;
/**
 * @class OrderService
 * @brief Handles order creation and listing; coordinates inventory changes transactionally.
 *
 * createOrder runs inside a mongoose transaction to atomically:
 *  - validate items and snapshot product data
 *  - decrement inventory via InventoryService (which uses the same session)
 *  - create the order document and commit
 *
 * Errors:
 *  - OrderError for general validation
 *  - InsufficientStockError for stock failures (mapped to 409 by the API layer)
 */ class OrderError extends Error {
}
class InsufficientStockError extends OrderError {
}
class OrderService {
    /**
   * Create an order atomically: validates items, decrements stock, and saves order doc.
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
            // abort and map inventory-specific error to domain InsufficientStockError
            try {
                await session.abortTransaction();
            } catch (_) {}
            session.endSession();
            // InventoryService throws InsufficientStockError (same name) - rethrow as Order-level InsufficientStockError
            if (err && (err.name === "InsufficientStockError" || err instanceof Error && err.constructor?.name === "InsufficientStockError")) {
                throw new InsufficientStockError(err.message);
            }
            // propagate other errors
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
}
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

//# sourceMappingURL=%5Broot-of-the-server%5D__ffad8d0d._.js.map