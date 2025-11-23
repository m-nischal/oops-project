import mongoose from "mongoose";

const ReminderSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Retailer
  title: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["CUSTOM", "OFFLINE_ORDER"], default: "CUSTOM" },
  description: { type: String },
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

// Index for quick lookup by date/owner
ReminderSchema.index({ ownerId: 1, date: 1 });

export default mongoose.models.Reminder || mongoose.model("Reminder", ReminderSchema);