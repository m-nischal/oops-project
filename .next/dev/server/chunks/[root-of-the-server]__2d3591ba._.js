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
const orderItemSchema = new Schema({
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
    // monetary totals (store in smallest currency unit or as integer rupees/paisa)
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
    } // soft-archive
}, {
    timestamps: true
});
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
const productSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
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
// ✅ Add this line **RIGHT BELOW** the schema definition, before creating the model:
productSchema.index({
    name: "text",
    description: "text"
});
// Prevent model overwrite in dev/hot-reload environments (Next.js etc.)
const Product = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Product || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Product", productSchema);
const __TURBOPACK__default__export__ = Product;
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
(()=>{
    const e = new Error("Cannot find module './inventory.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
;
;
class OrderError extends Error {
}
class InsufficientStockError extends OrderError {
}
class OrderService {
    /**
   * Create an order atomically: validates items, decrements stock, and saves order doc.
   * @param {Object} customer - { name, email, phone, address }
   * @param {Array<{productId, sizeLabel, qty}>} items
   * @returns {Promise<OrderDocument>}
   */ static async createOrder(customer = {}, items = []) {
        if (!Array.isArray(items) || items.length === 0) {
            throw new OrderError("Order must contain at least one item");
        }
        const session = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].startSession();
        try {
            session.startTransaction();
            // 1) Load product docs for all requested items (inside session)
            //    Build a lookup map: productId => doc
            const productIds = [
                ...new Set(items.map((i)=>i.productId))
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
            // 2) Build order items with snapshots and basic validation
            const orderItems = [];
            for (const it of items){
                const pid = String(it.productId);
                const doc = productMap.get(pid);
                if (!doc) {
                    throw new OrderError(`Product not found: ${it.productId}`);
                }
                const qty = Math.max(0, Math.floor(Number(it.qty || 0)));
                if (qty <= 0) throw new OrderError(`Invalid quantity for product ${pid}`);
                // find size to check existence (we don't assume stock yet)
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
            // items for InventoryService: [{ productId, sizeLabel, qty }]
            const inventoryItems = items.map((i)=>({
                    productId: i.productId,
                    sizeLabel: i.sizeLabel,
                    qty: i.qty
                }));
            await InventoryService.decreaseStockForItems(inventoryItems, session);
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
            // return the saved order (Mongoose doc)
            return saved;
        } catch (err) {
            // If InventoryService threw InsufficientStockError, rethrow it for caller to map to 409
            await session.abortTransaction().catch(()=>{});
            session.endSession();
            // wrap unknown errors
            if (err && err.name === "InsufficientStockError") {
                throw new InsufficientStockError(err.message);
            }
            throw err;
        }
    }
    /**
   * List orders (simple admin/user listing).
   * Options: { userId, page, limit }
   */ static async listOrders({ userId, page = 1, limit = 20 } = {}) {
        const filter = {};
        if (userId) filter.userId = userId;
        const skip = (page - 1) * limit;
        const items = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).sort({
            createdAt: -1
        }).skip(skip).limit(limit).lean();
        const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].countDocuments(filter);
        return {
            items,
            total,
            page,
            limit
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
            // Basic validation
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

//# sourceMappingURL=%5Broot-of-the-server%5D__2d3591ba._.js.map