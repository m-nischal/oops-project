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
// --- NEW SCHEMA: ManufacturedAtSchema ---
// Uses the same structure as a warehouse location, but without leadTimeDays
const ManufacturedAtSchema = new Schema({
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
// ----------------------------------------
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
    // --- NEW FIELD: Manufactured At Location ---
    manufacturedAt: {
        type: ManufacturedAtSchema,
        default: null
    },
    // -------------------------------------------
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
    // ... (existing logic) ...
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
    // ... (existing logic) ...
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
    // ... (existing logic) ...
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
"[project]/src/services/catalogService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/services/catalogService.js
// Use your project's preferred import style. This file exports getProducts used by /api/products.
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.js [api] (ecmascript)");
;
/**
 * getProducts(filter, options)
 * - filter: mongo filter object
 * - options: { lean, limit, skip, sort }
 *
 * Returns an array of product plain objects (lean) or documents (if lean:false).
 * If lean:true, we compute a fresh totalStock for each plain product object using
 * Product.computeTotalStockForPlainObject to ensure availability is accurate.
 */ async function getProducts(filter = {}, options = {}) {
    const lean = options.lean === true;
    const limit = typeof options.limit === "number" ? options.limit : options.limit ? Number(options.limit) : 20;
    const skip = typeof options.skip === "number" ? options.skip : options.skip ? Number(options.skip) : 0;
    const sort = options.sort || {
        createdAt: -1
    };
    // Build the query
    let query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).sort(sort).skip(skip).limit(limit);
    if (lean) {
        query = query.lean();
    }
    const results = await query.exec();
    // If lean, results are plain objects — compute totalStock for each
    if (lean && Array.isArray(results)) {
        const computed = results.map((p)=>{
            try {
                const ts = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].computeTotalStockForPlainObject(p);
                // ensure the plain object has a totalStock numeric property for client
                return Object.assign({}, p, {
                    totalStock: ts
                });
            } catch (e) {
                // If something fails, leave original object as-is (defensive)
                return Object.assign({}, p, {
                    totalStock: p && typeof p.totalStock === "number" ? p.totalStock : 0
                });
            }
        });
        return computed;
    }
    // If not lean, attempt to ensure each mongoose document has totalStock up-to-date via instance recalc
    if (!lean && Array.isArray(results)) {
        for (const doc of results){
            if (typeof doc.recalculateStock === "function") {
                try {
                    doc.recalculateStock(); // updates doc.totalStock in memory
                } catch (e) {
                // ignore errors — not critical
                }
            }
        }
    }
    return results;
}
const __TURBOPACK__default__export__ = {
    getProducts
};
}),
"[project]/src/pages/api/products/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/products/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/catalogService.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.js [api] (ecmascript)"); // used to compute count
;
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method === "GET") {
        try {
            const { categoryId, limit = 20, page = 1, q = "", inStockOnly, storefront } = req.query;
            const filter = {};
            if (categoryId) {
                // keep behaviour simple here; if you have getDescendantCategoryIds helper, call it.
                // NOTE: your previous code used filter.categories; keep same semantics if your model differs.
                filter.categories = {
                    $in: [
                        categoryId
                    ]
                };
            }
            if (storefront) filter.storefronts = storefront;
            if (inStockOnly === "true") {
                // ensure product has at least one size with stock > 0
                filter["sizes.stock"] = {
                    $gt: 0
                };
            }
            if (q) {
                // text search - only apply if you have text index
                filter.$text = {
                    $search: q
                };
            }
            const skip = (Number(page) - 1) * Number(limit);
            // Ask CatalogService to return lean results (plain objects) and compute totalStock for each
            const products = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].getProducts(filter, {
                lean: true,
                limit: Number(limit),
                skip,
                sort: {
                    createdAt: -1
                }
            });
            // compute total count using Product model (preserve previous behaviour)
            const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].countDocuments(filter);
            return res.status(200).json({
                items: products,
                total
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

//# sourceMappingURL=%5Broot-of-the-server%5D__b4cf798a._.js.map