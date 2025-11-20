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

// models/productModel.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
/**
 * Product model
 * - sizes: array with {label, stock}
 * - categories: ObjectId refs to Category
 */ const SizeSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    label: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    _id: false
});
const ProductSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        text: true
    },
    description: {
        type: String,
        trim: true,
        default: "",
        text: true
    },
    sku: {
        type: String,
        trim: true,
        index: true,
        sparse: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    currency: {
        type: String,
        default: "INR"
    },
    images: {
        type: [
            String
        ],
        default: []
    },
    sizes: {
        type: [
            SizeSchema
        ],
        default: []
    },
    // normalized categories
    categories: [
        {
            type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
            ref: "Category"
        }
    ],
    primaryCategory: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "Category",
        default: null
    },
    storefronts: {
        type: [
            String
        ],
        default: [
            "livemart"
        ]
    },
    productType: {
        type: String,
        enum: [
            "clothing",
            "tech",
            "grocery",
            "other"
        ],
        default: "other"
    },
    // optional top-level stock (if you want)
    stock: {
        type: Number,
        default: undefined
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
        ref: "User",
        required: false
    }
}, {
    timestamps: true
});
ProductSchema.index({
    name: "text",
    description: "text"
});
ProductSchema.index({
    categories: 1
});
ProductSchema.index({
    primaryCategory: 1
});
ProductSchema.index({
    storefronts: 1
});
ProductSchema.index({
    productType: 1
});
ProductSchema.pre("save", function(next) {
    if (!this.storefronts || !Array.isArray(this.storefronts)) this.storefronts = [
        "livemart"
    ];
    this.storefronts = this.storefronts.map((s)=>String(s).trim().toLowerCase()).filter(Boolean);
    if (!this.categories) this.categories = [];
    this.categories = this.categories.filter((c)=>!(typeof c === "string" && c.trim() === ""));
    if (this.name) this.name = String(this.name).trim();
    if (this.description) this.description = String(this.description).trim();
    next();
});
ProductSchema.methods.totalStock = function() {
    if (Array.isArray(this.sizes) && this.sizes.length) return this.sizes.reduce((s, x)=>s + (Number(x.stock) || 0), 0);
    if (typeof this.stock === "number") return this.stock;
    return 0;
};
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Product || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Product", ProductSchema);
}),
"[project]/src/pages/api/products/[id].js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/products/[id].js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/dotenv [external] (dotenv, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
;
;
;
__TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__["default"].config();
async function handler(req, res) {
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.readyState) await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(process.env.MONGO_URI);
    const { id } = req.query;
    if (req.method === "GET") {
        try {
            const prod = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findById(id).lean();
            if (!prod) return res.status(404).json({
                message: "Not found"
            });
            return res.status(200).json(prod);
        } catch (err) {
            console.error(err);
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }
    }
    res.status(405).json({
        message: "Method not allowed"
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__cfce9368._.js.map