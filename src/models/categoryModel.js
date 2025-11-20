// models/categoryModel.js
import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  path: { type: String, required: true, index: true }, // e.g. "/clothing/men/shirts"
  domain: { type: String, enum: ["clothing","tech","grocery","other"], default: "clothing" },
  storefronts: { type: [String], default: ["livemart"] },
  meta: {
    description: String,
    image: String,
    sortOrder: { type: Number, default: 0 }
  }
}, { timestamps: true });

CategorySchema.index({ slug: 1, parent: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);
