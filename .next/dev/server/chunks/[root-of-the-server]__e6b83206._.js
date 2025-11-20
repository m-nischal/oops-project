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
"[project]/src/pages/api/categories/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/categories/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/dotenv [external] (dotenv, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$categoryModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/categoryModel.js [api] (ecmascript)");
;
;
;
__TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__["default"].config();
async function handler(req, res) {
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.readyState) await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(process.env.MONGO_URI);
    if (req.method === "GET") {
        try {
            const { parentId, path, domain, storefront } = req.query;
            const filter = {};
            if (parentId === "null") filter.parent = null;
            else if (parentId) filter.parent = parentId;
            if (path) filter.path = path;
            if (domain) filter.domain = domain;
            if (storefront) filter.storefronts = storefront;
            const cats = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$categoryModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].find(filter).sort({
                path: 1
            }).lean();
            return res.status(200).json(cats);
        } catch (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch categories"
            });
        }
    }
    res.status(405).json({
        message: "Method not allowed"
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e6b83206._.js.map