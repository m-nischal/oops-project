// src/models/Product.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/* --- Sub-Schemas --- */

// Updated ReviewSchema to link to a User (Retailer or Customer)
const ReviewSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" }, // Tracks who left the review
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  author: { type: String }, // Snapshot of the user's name at the time of review
  createdAt: { type: Date, default: Date.now },
});

const SizeVariantSchema = new Schema({
  size: { type: String, required: true },
  sku: { type: String },
  stock: { type: Number, default: 0 },
  price: { type: Number },
});

const SizeChartSchema = new Schema(
  {
    chartName: { type: String },
    data: { type: Schema.Types.Mixed },
    image: { type: String },
  },
  { _id: false }
);

const WarehouseSchema = new Schema(
  {
    name: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
    leadTimeDays: { type: Number, default: 2 },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { _id: false }
);

const ManufacturedAtSchema = new Schema(
  {
    name: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pincode: { type: String },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { _id: false }
);

const ProductDetailsSchema = new Schema(
  {
    materialComposition: { type: String },
    sleeveType: { type: String },
    materialType: { type: String },
    fitType: { type: String },
    length: { type: String },
    neckStyle: { type: String },
    countryOfOrigin: { type: String },
    extras: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

/* --- Main Product Schema --- */
const ProductSchema = new Schema(
  {
    // Tracks who owns this product document (Retailer or Wholesaler).
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // If this is a Retail Listing (ownerId is a Retailer),
    // this field links back to the Wholesaler's original "Base Product".
    wholesaleSourceId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },

    // Manufactured At Location
    manufacturedAt: {
      type: ManufacturedAtSchema,
      default: null,
    },

    /* --- Existing Fields --- */
    name: { type: String, required: true, index: true },
    slug: { type: String, index: true },
    description: { type: String },
    brand: { type: String },
    retailer: { type: String }, // Redundant but kept for backward compatibility
    category: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    images: [{ type: String }],
    sizes: [SizeVariantSchema],
    sizeChart: SizeChartSchema,
    productDetails: ProductDetailsSchema,
    reviews: [ReviewSchema], // Embeds the updated ReviewSchema
    warehouses: [WarehouseSchema],
    totalStock: { type: Number, default: 0 },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: false, index: true },
    minOrderQuantity: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

/* --- Methods & Statics --- */

/**
 * helper to recalc totalStock (instance method)
 */
ProductSchema.methods.recalculateStock = function () {
  const sizeStock = (this.sizes || []).reduce(
    (acc, s) => acc + (s.stock || 0),
    0
  );
  this.totalStock = sizeStock;
  return this.totalStock;
};

/**
 * get best delivery estimate
 */
ProductSchema.methods.estimateDeliveryTo = function (customerLocation = {}) {
  const whs = this.warehouses || [];
  if (!whs.length)
    return { estimatedDays: null, reason: "no warehouses configured" };

  const byPincode = whs.find(
    (w) =>
      w.pincode &&
      customerLocation.pincode &&
      w.pincode === customerLocation.pincode
  );
  if (byPincode) {
    return {
      estimatedDays: byPincode.leadTimeDays,
      warehouse: byPincode,
      method: "pincode-match",
    };
  }

  const byCity = whs.find(
    (w) =>
      w.city &&
      customerLocation.city &&
      w.city.toLowerCase() === customerLocation.city.toLowerCase()
  );
  if (byCity) {
    return {
      estimatedDays: byCity.leadTimeDays + 1,
      warehouse: byCity,
      method: "city-match",
    };
  }

  const byState = whs.find(
    (w) =>
      w.state &&
      customerLocation.state &&
      w.state.toLowerCase() === customerLocation.state.toLowerCase()
  );
  if (byState) {
    return {
      estimatedDays: byState.leadTimeDays + 2,
      warehouse: byState,
      method: "state-match",
    };
  }

  const minWh = whs.reduce(
    (min, w) => (!min || w.leadTimeDays < min.leadTimeDays ? w : min),
    null
  );
  return {
    estimatedDays: minWh ? minWh.leadTimeDays + 4 : null,
    warehouse: minWh,
    method: "fallback",
  };
};

/**
 * STATIC HELPER: computeTotalStockForPlainObject
 */
ProductSchema.statics.computeTotalStockForPlainObject = function (
  productPlain = {}
) {
  if (!productPlain) return 0;
  if (
    typeof productPlain.totalStock === "number" &&
    Array.isArray(productPlain.sizes) === false
  ) {
    return productPlain.totalStock;
  }
  if (Array.isArray(productPlain.sizes)) {
    return productPlain.sizes.reduce((acc, s) => {
      const n =
        s && (typeof s.stock === "number" ? s.stock : Number(s?.qty ?? 0));
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }
  if (typeof productPlain.stock === "number") return productPlain.stock;
  return 0;
};

/**
 * OPTIONAL STATIC HELPER: recalculateAndPersist
 */
ProductSchema.statics.recalculateAndPersist = async function (productId) {
  if (!productId) throw new Error("productId required");
  const Product = this;
  const doc = await Product.findById(productId);
  if (!doc) throw new Error("product not found");
  doc.recalculateStock();
  await doc.save();
  return doc.totalStock;
};

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);