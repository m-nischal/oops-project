module.exports = [
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
];

//# sourceMappingURL=src_models_Product_74c1815e.js.map