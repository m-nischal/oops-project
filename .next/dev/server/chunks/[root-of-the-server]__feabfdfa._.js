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
"[project]/src/pages/api/products/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/products/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/dotenv [external] (dotenv, cjs)");
(()=>{
    const e = new Error("Cannot find module '../../../../models/productModel.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
(()=>{
    const e = new Error("Cannot find module '../../../../models/categoryModel.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
;
__TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__["default"].config();
async function getDescendantCategoryIds(categoryId) {
    const cat = await Category.findById(categoryId);
    if (!cat) return [];
    const regex = new RegExp(`^${cat.path}(/|$)`);
    const desc = await Category.find({
        path: {
            $regex: regex
        }
    }, {
        _id: 1
    });
    return desc.map((c)=>c._id);
}
async function handler(req, res) {
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.readyState) await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(process.env.MONGO_URI);
    if (req.method === "GET") {
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
        const docs = await Product.find(filter).skip(skip).limit(Number(limit)).lean();
        const total = await Product.countDocuments(filter);
        return res.status(200).json({
            items: docs,
            total
        });
    }
    res.status(405).json({
        message: "Method not allowed"
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__feabfdfa._.js.map