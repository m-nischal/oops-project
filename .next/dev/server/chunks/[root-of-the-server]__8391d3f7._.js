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
/* --- (all your existing sub-schemas and ProductSchema here) --- */ /* I'm copying your existing content exactly and then adding two static helpers
   below. Replace the entire file content with this version. */ const ReviewSchema = new Schema({
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
    }
}, {
    timestamps: true
});
/**
 * helper to recalc totalStock (instance method) — **KEPT AS-IS**
 */ ProductSchema.methods.recalculateStock = function() {
    const sizeStock = (this.sizes || []).reduce((acc, s)=>acc + (s.stock || 0), 0);
    this.totalStock = sizeStock;
    return this.totalStock;
};
/**
 * STATIC HELPER:
 * computeTotalStockForPlainObject(productPlain)
 * - Accepts a plain product object (e.g. from .lean() or from JSON)
 * - Returns computed totalStock (Number) without mutating DB or the object.
 *
 * Use this on server-side responses to ensure returned items have fresh totalStock.
 */ ProductSchema.statics.computeTotalStockForPlainObject = function(productPlain = {}) {
    if (!productPlain) return 0;
    // Priority: explicit totalStock field if intentionally kept up-to-date
    if (typeof productPlain.totalStock === "number" && Array.isArray(productPlain.sizes) === false) {
        // If sizes not present, but totalStock exists, trust it
        return productPlain.totalStock;
    }
    // If sizes array exists, sum up size.stock
    if (Array.isArray(productPlain.sizes)) {
        return productPlain.sizes.reduce((acc, s)=>{
            const n = s && (typeof s.stock === "number" ? s.stock : Number(s?.qty ?? 0));
            return acc + (Number.isFinite(n) ? n : 0);
        }, 0);
    }
    // Fallback: if only legacy fields exist, try them
    if (typeof productPlain.stock === "number") return productPlain.stock;
    return 0;
};
/**
 * OPTIONAL STATIC HELPER:
 * recalculateAndPersist(productId)
 * - loads product by id, recalculates using instance method, and persists the totalStock.
 * - Use this when you want to permanently sync the stored totalStock (not required for UI).
 */ ProductSchema.statics.recalculateAndPersist = async function(productId) {
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
"[project]/src/pages/api/orders/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/orders/index.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/dotenv [external] (dotenv, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Product.js [api] (ecmascript)");
;
;
;
__TURBOPACK__imported__module__$5b$externals$5d2f$dotenv__$5b$external$5d$__$28$dotenv$2c$__cjs$29$__["default"].config();
/**
 * Orders API:
 * - tries to use transactions (if supported)
 * - falls back to conditional updates + rollback if transactions unavailable
 */ async function createOrderDoc(data, session = null) {
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Order) {
        const OrderSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
            customer: {
                name: String,
                phone: String,
                address: String
            },
            items: [
                {
                    productId: __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema.Types.ObjectId,
                    name: String,
                    qty: Number,
                    price: Number,
                    size: String
                }
            ],
            total: Number,
            status: {
                type: String,
                default: "Pending"
            }
        }, {
            timestamps: true
        });
        __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Order", OrderSchema);
    }
    const Order = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("Order");
    if (session) {
        const docs = await Order.create([
            data
        ], {
            session
        });
        return docs[0];
    } else {
        return await Order.create(data);
    }
}
async function handler(req, res) {
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connection.readyState) await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(process.env.MONGO_URI);
    if (req.method !== "POST") return res.status(405).json({
        message: "Method not allowed"
    });
    const payload = req.body;
    if (!payload || !payload.customer || !Array.isArray(payload.items) || payload.items.length === 0) {
        return res.status(400).json({
            message: "Invalid order payload"
        });
    }
    // Try transaction first
    let session = null;
    try {
        session = await __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].startSession();
        session.startTransaction();
        const insufficient = [];
        for (const item of payload.items){
            const productId = item.productId;
            const qty = Number(item.qty) || 0;
            const sizeLabel = item.size || null;
            if (!productId || qty <= 0) {
                insufficient.push({
                    productId,
                    reason: "invalid-qty"
                });
                break;
            }
            if (sizeLabel) {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                    _id: productId,
                    sizes: {
                        $elemMatch: {
                            size: sizeLabel,
                            stock: {
                                $gte: qty
                            }
                        }
                    }
                }, {
                    $inc: {
                        "sizes.$.stock": -qty
                    }
                }, {
                    session
                });
                if (!result.modifiedCount) {
                    insufficient.push({
                        productId,
                        size: sizeLabel,
                        requested: qty
                    });
                    break;
                }
            } else if (typeof item._usesTopLevelStock !== "undefined" && item._usesTopLevelStock) {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                    _id: productId,
                    totalStock: {
                        $gte: qty
                    }
                }, {
                    $inc: {
                        totalStock: -qty
                    }
                }, {
                    session
                });
                if (!result.modifiedCount) {
                    insufficient.push({
                        productId,
                        requested: qty
                    });
                    break;
                }
            } else {
            // if no stock tracking for this product, skip decrement
            }
        }
        if (insufficient.length) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                message: "Insufficient stock",
                details: insufficient
            });
        }
        // create order doc
        const order = await createOrderDoc({
            customer: payload.customer,
            items: payload.items.map((i)=>({
                    productId: i.productId,
                    name: i.name || "",
                    qty: Number(i.qty) || 1,
                    price: Number(i.price) || 0,
                    size: i.size || null
                })),
            total: Number(payload.total) || 0,
            status: "Pending"
        }, session);
        await session.commitTransaction();
        session.endSession();
        return res.status(201).json({
            message: "Order placed",
            orderId: order._id
        });
    } catch (errTransaction) {
        console.warn("Transaction failed or not supported, attempting fallback. Error:", errTransaction && errTransaction.message);
        // Attempt fallback: conditional updates without session, with simple rollback if necessary
        try {
            // we'll record successful decrements to rollback if needed
            const decremented = []; // { productId, size, qty }
            const insufficient = [];
            for (const item of payload.items){
                const productId = item.productId;
                const qty = Number(item.qty) || 0;
                const sizeLabel = item.size || null;
                if (sizeLabel) {
                    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                        _id: productId,
                        sizes: {
                            $elemMatch: {
                                size: sizeLabel,
                                stock: {
                                    $gte: qty
                                }
                            }
                        }
                    }, {
                        $inc: {
                            "sizes.$.stock": -qty
                        }
                    });
                    if (!result.modifiedCount) {
                        insufficient.push({
                            productId,
                            size: sizeLabel,
                            requested: qty
                        });
                        break;
                    } else {
                        decremented.push({
                            productId,
                            size: sizeLabel,
                            qty
                        });
                    }
                } else if (typeof item._usesTopLevelStock !== "undefined" && item._usesTopLevelStock) {
                    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                        _id: productId,
                        totalStock: {
                            $gte: qty
                        }
                    }, {
                        $inc: {
                            totalStock: -qty
                        }
                    });
                    if (!result.modifiedCount) {
                        insufficient.push({
                            productId,
                            requested: qty
                        });
                        break;
                    } else {
                        decremented.push({
                            productId,
                            qty
                        });
                    }
                } else {
                // skip
                }
            }
            if (insufficient.length) {
                // rollback decrements
                for (const d of decremented){
                    if (d.size) {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                            _id: d.productId,
                            sizes: {
                                $elemMatch: {
                                    size: d.size
                                }
                            }
                        }, {
                            $inc: {
                                "sizes.$.stock": d.qty
                            }
                        });
                    } else {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Product$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                            _id: d.productId
                        }, {
                            $inc: {
                                totalStock: d.qty
                            }
                        });
                    }
                }
                return res.status(400).json({
                    message: "Insufficient stock",
                    details: insufficient
                });
            }
            // all good — create order doc (no session)
            const order = await createOrderDoc({
                customer: payload.customer,
                items: payload.items.map((i)=>({
                        productId: i.productId,
                        name: i.name || "",
                        qty: Number(i.qty) || 1,
                        price: Number(i.price) || 0,
                        size: i.size || null
                    })),
                total: Number(payload.total) || 0,
                status: "Pending"
            }, null);
            return res.status(201).json({
                message: "Order placed",
                orderId: order._id
            });
        } catch (errFallback) {
            console.error("Fallback order creation failed:", errFallback);
            return res.status(500).json({
                message: "Failed to place order"
            });
        }
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8391d3f7._.js.map