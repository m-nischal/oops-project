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
"[project]/src/pages/api/wholesaler/analytics.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/wholesaler/analytics.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/orderModel.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
;
;
;
async function handler(req, res) {
    // 1. Connect to DB
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    } catch (error) {
        console.error("Database connection failed:", error);
        return res.status(500).json({
            error: "Database connection failed"
        });
    }
    if (req.method !== "GET") {
        res.setHeader("Allow", [
            "GET"
        ]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    let sellerId;
    // 2. Authentication (Wholesaler Only)
    try {
        const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__["verifyToken"])(req);
        if (!payload || payload.role !== "WHOLESALER") {
            return res.status(401).json({
                error: "Unauthorized. You must be a Wholesaler."
            });
        }
        sellerId = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Types.ObjectId(payload.id);
    } catch (err) {
        console.error("Auth failed:", err.message);
        return res.status(401).json({
            error: "Unauthorized. Invalid token."
        });
    }
    // 3. Fetch Analytics
    try {
        // Fetch all orders for this wholesaler
        const allOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find({
            sellerId: sellerId
        }).lean();
        // Initialize counters
        let totalSales = 0;
        let activeOrders = 0;
        let completedOrders = 0;
        let cancelledOrders = 0; // New metric
        // Calculate stats
        for (const order of allOrders){
            if (order.status === 'delivered') {
                completedOrders++;
                totalSales += order.total || 0;
            } else if (order.status === 'cancelled' || order.status === 'refunded') {
                cancelledOrders++;
            } else {
                // All other statuses (pending, shipped, etc.) are "Active"
                activeOrders++;
            }
        }
        // Calculate Sales Graph (Last 12 months)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const salesData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$orderModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].aggregate([
            {
                $match: {
                    sellerId: sellerId,
                    status: 'delivered',
                    createdAt: {
                        $gte: oneYearAgo
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: {
                            $year: "$createdAt"
                        },
                        month: {
                            $month: "$createdAt"
                        }
                    },
                    totalRevenue: {
                        $sum: "$total"
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);
        const formattedSalesGraph = salesData.map((item)=>({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                sales: item.totalRevenue
            }));
        // Return complete data
        return res.status(200).json({
            stats: {
                totalSales,
                totalOrders: allOrders.length,
                activeOrders,
                completedOrders,
                cancelledOrders
            },
            saleGraph: formattedSalesGraph
        });
    } catch (err) {
        console.error("CRITICAL ANALYTICS ERROR:", err);
        return res.status(500).json({
            error: "Server error: " + err.message
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d01450df._.js.map