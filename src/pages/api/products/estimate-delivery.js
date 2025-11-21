// src/pages/api/products/estimate-delivery.js
import dbConnect from "lib/dbConnect";
import Product from "models/Product.js";
import mongoose from "mongoose";

// Helper to simulate Google Maps Distance Matrix API call
async function getDrivingDuration(originCoords, destinationCoords) {
  
  if (!originCoords || !destinationCoords) return { success: false, durationSeconds: null };

  // --- MOCK LOGIC: Simulate travel time based on distance (using a simplified great-circle distance) ---
  const [lng1, lat1] = originCoords;
  const { lat: lat2, lng: lng2 } = destinationCoords;

  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // Assume an average driving speed (e.g., 50 km/h) to get travel time in seconds
  const avgSpeedKph = 50; 
  const travelTimeHours = distanceKm / avgSpeedKph;
  const durationSeconds = Math.round(travelTimeHours * 3600); // 3600 seconds per hour
  
  // Minimal success time to avoid 0 days on local machine
  if (durationSeconds < 3600 * 2) { 
    return { success: true, durationSeconds: 3600 * 2 }; // 2 hours minimum
  }

  return { success: true, durationSeconds };
}


export default async function handler(req, res) {
  await dbConnect();
  if (req.method !== "POST") return res.status(405).end();

  const { productId, customerLocation } = req.body;
  
  if (!productId || !mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ error: "productId required" });
  }

  try {
    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ error: "product not found" });

    const warehouse = product.warehouses?.[0];
    const originCoords = warehouse?.location?.coordinates; // [lng, lat]
    const destinationCoords = { lat: customerLocation.lat, lng: customerLocation.lng }; // { lat, lng }

    if (!originCoords || !destinationCoords.lat || !destinationCoords.lng) {
        return res.status(200).json({ 
            estimation: { estimatedDays: 5, reason: "Default fallback (Warehouse or Customer coordinates missing)" } 
        });
    }

    // 1. Get Travel Duration (seconds)
    const travelData = await getDrivingDuration(originCoords, destinationCoords);

    if (!travelData.success || !travelData.durationSeconds) {
      return res.status(200).json({ 
        estimation: { estimatedDays: 7, reason: "Network/API estimation failed, using 7-day fallback" } 
      });
    }
    
    // 2. Calculate Total Days
    const bufferDays = 2; // For processing and handling delays
    const secondsInDay = 86400; // 24 * 60 * 60
    
    // Convert travel seconds to days and add buffer
    const travelDays = travelData.durationSeconds / secondsInDay;
    const estimatedDays = Math.max(1, Math.ceil(travelDays + bufferDays)); // Minimum 1 day

    return res.status(200).json({ 
        estimation: { estimatedDays, reason: "Calculated via Distance Matrix" } 
    });

  } catch (err) {
      console.error("Estimate Delivery API Error:", err);
      return res.status(500).json({ error: err.message || "Failed to calculate delivery estimate" });
  }
}