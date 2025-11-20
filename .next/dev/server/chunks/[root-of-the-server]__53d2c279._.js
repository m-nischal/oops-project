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
"[project]/src/pages/api/orders/index.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/orders/index.js
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
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                    _id: productId,
                    sizes: {
                        $elemMatch: {
                            label: sizeLabel,
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
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                    _id: productId,
                    stock: {
                        $gte: qty
                    }
                }, {
                    $inc: {
                        stock: -qty
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
                    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                        _id: productId,
                        sizes: {
                            $elemMatch: {
                                label: sizeLabel,
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
                    const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                        _id: productId,
                        stock: {
                            $gte: qty
                        }
                    }, {
                        $inc: {
                            stock: -qty
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
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                            _id: d.productId,
                            sizes: {
                                $elemMatch: {
                                    label: d.size
                                }
                            }
                        }, {
                            $inc: {
                                "sizes.$.stock": d.qty
                            }
                        });
                    } else {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$productModel$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].updateOne({
                            _id: d.productId
                        }, {
                            $inc: {
                                stock: d.qty
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

//# sourceMappingURL=%5Broot-of-the-server%5D__53d2c279._.js.map