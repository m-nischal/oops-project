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
    },
    isPublished: {
        type: Boolean,
        default: false,
        index: true
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
"[project]/src/pages/api/retailer/products/[id].js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/retailer/products/[id].js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
;
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    const { id: productId } = req.query;
    // 1. Authentication
    let payload;
    try {
        payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$js__$5b$api$5d$__$28$ecmascript$29$__["verifyToken"])(req);
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
    switch(req.method){
        case 'GET':
            try {
                const product = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                    _id: productId,
                    ownerId: sellerId
                }).lean();
                if (!product) return res.status(404).json({
                    error: "Product not found."
                });
                return res.status(200).json({
                    product
                });
            } catch (err) {
                return res.status(500).json({
                    error: "Failed to fetch product."
                });
            }
        // --- THIS IS THE UPDATED LOGIC ---
        case 'PUT':
            try {
                const productData = req.body;
                // 1. Find the document first
                const product = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
                    _id: productId,
                    ownerId: sellerId
                });
                if (!product) {
                    return res.status(404).json({
                        error: "Product not found."
                    });
                }
                // 2. Update fields manually
                // We use Object.assign to update fields, but we be careful not to overwrite _id or ownerId
                delete productData._id;
                delete productData.ownerId;
                Object.assign(product, productData);
                // 3. Recalculate Stock
                if (product.recalculateStock) {
                    product.recalculateStock(); // This sums up the sizes to set totalStock
                }
                // 4. Save (This triggers validation and middleware)
                await product.save();
                return res.status(200).json({
                    product
                });
            } catch (err) {
                console.error(err);
                return res.status(400).json({
                    error: err.message || "Failed to update product."
                });
            }
        // --------------------------------
        case 'DELETE':
            try {
                const deletedProduct = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOneAndDelete({
                    _id: productId,
                    ownerId: sellerId
                });
                if (!deletedProduct) return res.status(404).json({
                    error: "Product not found."
                });
                return res.status(200).json({
                    message: "Product deleted successfully."
                });
            } catch (err) {
                return res.status(500).json({
                    error: "Failed to delete product."
                });
            }
        default:
            res.setHeader('Allow', [
                'GET',
                'PUT',
                'DELETE'
            ]);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a57ef9cc._.js.map