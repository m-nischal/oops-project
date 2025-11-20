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
"[project]/src/pages/api/inventory/adjust.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/inventory/adjust.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/inventory.js [api] (ecmascript)");
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
    if (req.method !== "POST") {
        res.setHeader("Allow", [
            "POST"
        ]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    try {
        const { productId, sizeLabel, qty, operation = "increase" } = req.body || {};
        if (!productId || !sizeLabel) return res.status(400).json({
            error: "productId and sizeLabel are required"
        });
        const nQty = Number(qty || 0);
        if (!Number.isFinite(nQty)) return res.status(400).json({
            error: "qty must be a number"
        });
        // Choose operation
        if (operation === "increase") {
            const ok = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].increaseStock(productId, sizeLabel, nQty);
            if (!ok) {
                // size missing — create
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].addOrCreateSize(productId, sizeLabel, nQty);
            }
            return res.status(200).json({
                success: true
            });
        }
        if (operation === "decrease") {
            const ok = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].decreaseStock(productId, sizeLabel, nQty);
            if (!ok) return res.status(409).json({
                error: "Insufficient stock or size not found"
            });
            return res.status(200).json({
                success: true
            });
        }
        if (operation === "set") {
            // set exact stock value for size (create if missing)
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$inventory$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].addOrCreateSize(productId, sizeLabel, nQty);
            return res.status(200).json({
                success: true
            });
        }
        return res.status(400).json({
            error: "invalid operation"
        });
    } catch (err) {
        console.error("POST /api/inventory/adjust error:", err);
        return res.status(500).json({
            error: err.message || "Inventory adjust failed"
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__34ace9c2._.js.map