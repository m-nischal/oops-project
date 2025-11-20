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
"[externals]/dotenv [external] (dotenv, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("dotenv", () => require("dotenv"));

module.exports = mod;
}),
"[project]/src/models/productModel.js [api] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/models/categoryModel.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// models/categoryModel.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const CategorySchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    parent: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    path: {
        type: String,
        required: true,
        index: true
    },
    domain: {
        type: String,
        enum: [
            "clothing",
            "tech",
            "grocery",
            "other"
        ],
        default: "clothing"
    },
    storefronts: {
        type: [
            String
        ],
        default: [
            "livemart"
        ]
    },
    meta: {
        description: String,
        image: String,
        sortOrder: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});
CategorySchema.index({
    slug: 1,
    parent: 1
}, {
    unique: true
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Category || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Category", CategorySchema);
}),
"[project]/src/pages/api/products/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/products/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/dotenv [external] (dotenv, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$categoryModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/categoryModel.js [api] (ecmascript)");
;
;
;
;
__TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__["default"].config();
async function getDescendantCategoryIds(categoryId) {
    const cat = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$categoryModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(categoryId).lean();
    if (!cat) return [];
    const regex = new RegExp(`^${cat.path}(/|$)`);
    const desc = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$categoryModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find({
        path: {
            $regex: regex
        }
    }, {
        _id: 1
    }).lean();
    const ids = desc.map((c)=>c._id.toString());
    // include the category itself
    if (!ids.includes(String(categoryId))) ids.push(String(categoryId));
    return ids;
}
async function handler(req, res) {
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.readyState) await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(process.env.MONGO_URI);
    if (req.method === "GET") {
        try {
            const { categoryId, limit = 20, page = 1, q = "", inStockOnly, storefront } = req.query;
            const filter = {};
            if (categoryId) {
                const ids = await getDescendantCategoryIds(categoryId);
                filter.categories = {
                    $in: ids
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
            const docs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).skip(skip).limit(Number(limit)).lean();
            const total = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].countDocuments(filter);
            return res.status(200).json({
                items: docs,
                total
            });
        } catch (err) {
            console.error(err);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__9449c3f6._.js.map