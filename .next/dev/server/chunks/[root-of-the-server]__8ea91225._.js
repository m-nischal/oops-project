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
"[project]/src/pages/api/products/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pages/api/products/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)"); // create a small helper to connect using mongoose.connect once
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/productModel.js [api] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../../../src/services/catalogService.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method === "GET") {
        const { q, page = 1, limit = 20 } = req.query;
        const result = await CatalogService.searchProducts({
            q,
            page: Number(page),
            limit: Number(limit)
        });
        return res.status(200).json(result);
    }
    if (req.method === "POST") {
        try {
            const created = await CatalogService.createProduct(req.body);
            return res.status(201).json(created.toObject ? created.toObject() : created);
        } catch (err) {
            return res.status(400).json({
                error: err.message
            });
        }
    }
    return res.status(405).end();
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8ea91225._.js.map