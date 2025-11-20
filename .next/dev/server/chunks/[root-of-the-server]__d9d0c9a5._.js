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
"[project]/src/domain/catalog.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/domain/catalog.js
/**
 * Domain representation of a Product.
 * Renamed to DomainProduct to avoid confusion with Mongoose model.
 */ __turbopack_context__.s([
    "DomainProduct",
    ()=>DomainProduct,
    "default",
    ()=>__TURBOPACK__default__export__
]);
class DomainProduct {
    constructor({ _id = undefined, name, price, originalPrice = 0, description = "", materials = [], images = [], sizes = [], rating = {
        avg: 0,
        count: 0
    }, category = "General", createdAt = undefined, updatedAt = undefined } = {}){
        if (!name) throw new Error("Product requires a name");
        if (typeof price !== "number") throw new Error("Product price must be a number");
        this._id = _id;
        this.name = name;
        this.price = price;
        this.originalPrice = originalPrice;
        this.description = description;
        this.materials = Array.isArray(materials) ? materials : [];
        this.images = Array.isArray(images) ? images : [];
        this.sizes = Array.isArray(sizes) ? sizes.map((s)=>({
                label: s.label,
                stock: Number(s.stock || 0)
            })) : [];
        this.rating = {
            avg: rating && typeof rating.avg === "number" ? rating.avg : 0,
            count: rating && typeof rating.count === "number" ? rating.count : 0
        };
        this.category = category || "General";
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static fromDocument(doc = {}) {
        // if doc is a mongoose document, convert to plain object safely
        const d = doc.toObject ? doc.toObject() : doc;
        return new DomainProduct({
            _id: d._id,
            name: d.name,
            price: d.price,
            originalPrice: d.originalPrice,
            description: d.description,
            materials: d.materials,
            images: d.images,
            sizes: d.sizes,
            rating: d.rating,
            category: d.category,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
        });
    }
    getDiscountPercent() {
        const op = Number(this.originalPrice || 0);
        const p = Number(this.price || 0);
        if (!op || op <= 0 || p >= op) return 0;
        const percent = (op - p) / op * 100;
        return Math.round(percent);
    }
    isInStock() {
        if (!Array.isArray(this.sizes) || this.sizes.length === 0) return false;
        return this.sizes.some((s)=>Number(s.stock || 0) > 0);
    }
    totalStock() {
        if (!Array.isArray(this.sizes) || this.sizes.length === 0) return 0;
        return this.sizes.reduce((sum, s)=>sum + Math.max(0, Number(s.stock || 0)), 0);
    }
    addOrUpdateSize(label, stock) {
        if (!label) throw new Error("Size label is required");
        const sIndex = this.sizes.findIndex((s)=>s.label === label);
        const normalizedStock = Math.max(0, Number(stock || 0));
        if (sIndex === -1) {
            this.sizes.push({
                label,
                stock: normalizedStock
            });
        } else {
            this.sizes[sIndex].stock = normalizedStock;
        }
    }
    decreaseStock(label, qty = 1) {
        if (!label) throw new Error("Size label required");
        const index = this.sizes.findIndex((s)=>s.label === label);
        if (index === -1) return false;
        const available = Number(this.sizes[index].stock || 0);
        const useQty = Math.max(0, Math.floor(Number(qty || 0)));
        if (useQty <= 0) return false;
        if (available < useQty) return false;
        this.sizes[index].stock = available - useQty;
        return true;
    }
    increaseStock(label, qty = 1) {
        if (!label) throw new Error("Size label required");
        const index = this.sizes.findIndex((s)=>s.label === label);
        const addQty = Math.max(0, Math.floor(Number(qty || 0)));
        if (addQty === 0) return;
        if (index === -1) {
            this.sizes.push({
                label,
                stock: addQty
            });
        } else {
            this.sizes[index].stock = Number(this.sizes[index].stock || 0) + addQty;
        }
    }
    toObject(opts = {}) {
        const obj = {
            name: this.name,
            price: this.price,
            originalPrice: this.originalPrice,
            description: this.description,
            materials: Array.isArray(this.materials) ? this.materials : [],
            images: Array.isArray(this.images) ? this.images : [],
            sizes: Array.isArray(this.sizes) ? this.sizes.map((s)=>({
                    label: s.label,
                    stock: Number(s.stock || 0)
                })) : [],
            rating: {
                avg: Number(this.rating && this.rating.avg ? this.rating.avg : 0),
                count: Number(this.rating && this.rating.count ? this.rating.count : 0)
            },
            category: this.category || "General"
        };
        if (!opts.omitId && this._id) obj._id = this._id;
        return obj;
    }
}
const __TURBOPACK__default__export__ = DomainProduct;
}),
"[project]/src/services/catalogService.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/services/catalogService.js
__turbopack_context__.s([
    "default",
    ()=>CatalogService
]);
(()=>{
    const e = new Error("Cannot find module '../../models/productModel.js'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/domain/catalog.js [api] (ecmascript)");
;
;
class CatalogService {
    static async createProduct(data) {
        const model = new ProductModel(data);
        const saved = await model.save();
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(saved);
    }
    static async updateProduct(id, updates) {
        const updated = await ProductModel.findByIdAndUpdate(id, updates, {
            new: true
        });
        return updated ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(updated) : null;
    }
    static async getProductById(id) {
        const doc = await ProductModel.findById(id).lean();
        return doc ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(doc) : null;
    }
    static async searchProducts({ q = "", page = 1, limit = 20, inStockOnly = false } = {}) {
        const filter = {};
        if (q) filter.$text = {
            $search: q
        }; // requires text index
        if (inStockOnly) filter["sizes.stock"] = {
            $gt: 0
        };
        const skip = (page - 1) * limit;
        const docs = await ProductModel.find(filter).skip(skip).limit(limit).lean();
        const total = await ProductModel.countDocuments(filter);
        const items = docs.map((d)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$domain$2f$catalog$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].fromDocument(d));
        return {
            items,
            total,
            page,
            limit
        };
    }
}
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/catalogService.js [api] (ecmascript)");
;
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method === "GET") {
        const { q, page = 1, limit = 20 } = req.query;
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].searchProducts({
            q,
            page: Number(page),
            limit: Number(limit)
        });
        return res.status(200).json(result);
    }
    if (req.method === "POST") {
        try {
            const created = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$catalogService$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].createProduct(req.body);
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

//# sourceMappingURL=%5Broot-of-the-server%5D__d9d0c9a5._.js.map