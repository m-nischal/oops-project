// src/pages/api/delivery/fee.js
import dbConnect from "lib/dbConnect";
import Product from "models/Product.js";
import { getSessionFromReq } from "lib/authHelpers.js";

// --- MOCK CONSTANTS ---
// Based on approximate cost per km (e.g., ₹5/km) and fixed fees
const BASE_FEE = 30; // Base delivery charge in ₹
const FEE_PER_KM = 5;  // Additional charge per km in ₹
const AVERAGE_SPEED_KPH = 40; // Average driving speed
const PROCESSING_HOURS = 24; // Time to process and package order

// **NEW CONSTANT:** Maximum allowable delivery fee
const MAX_DELIVERY_FEE = 500; 

/**
 * Helper to simulate Haversine distance for coordinates [lng, lat].
 * @param {Array<number>} coord1 [lng, lat]
 * @param {Array<number>} coord2 [lng, lat]
 * @returns {number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
    if (!coord1 || !coord2) return null;
    const R = 6371; // Earth radius in km
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    const toRad = (x) => x * Math.PI / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * POST /api/delivery/fee
 * Calculates delivery fee and ETA for a list of cart items based on customer location.
 * Body: { customerLocation: { lat, lng }, items: [{ productId, sizeLabel, qty }] }
 */
export default async function handler(req, res) {
    await dbConnect();
    if (req.method !== "POST") {
        res.setHeader("Allow", ["POST"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const { customerLocation, items } = req.body;

    if (!customerLocation || !customerLocation.lat || !customerLocation.lng || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Invalid input. Requires customerLocation and items array." });
    }

    try {
        const customerCoords = [Number(customerLocation.lng), Number(customerLocation.lat)];
        
        // 1. Fetch products to get warehouse locations
        const productIds = items.map(i => i.productId);
        const products = await Product.find({ _id: { $in: productIds } }).lean();
        const productMap = new Map(products.map(p => [String(p._id), p]));

        let maxDeliveryDays = 0;
        let totalDistanceKm = 0;
        let totalItems = 0;

        // 2. Calculate fee, ETA, and aggregate data per product
        const detailedItems = items.map(item => {
            const product = productMap.get(String(item.productId));
            
            if (!product || !product.warehouses?.[0]?.location?.coordinates) {
                // Use a large default time/fee if product or location is missing
                const fallbackDays = 7;
                maxDeliveryDays = Math.max(maxDeliveryDays, fallbackDays);
                return { ...item, distanceKm: 0, estimatedDays: fallbackDays, deliveryFee: BASE_FEE };
            }
            
            const warehouseCoords = product.warehouses[0].location.coordinates; // [lng, lat]
            const distance = calculateDistance(warehouseCoords, customerCoords);

            // Time calculation: convert distance to hours, add processing time, convert to days
            const travelHours = distance / AVERAGE_SPEED_KPH;
            const totalHours = travelHours + PROCESSING_HOURS;
            const estimatedDays = Math.max(1, Math.ceil(totalHours / 24)); // Minimum 1 day

            // Fee calculation (simple linear model based on distance)
            const fee = BASE_FEE + Math.ceil(distance * FEE_PER_KM);
            
            totalDistanceKm += distance;
            totalItems += item.qty;
            maxDeliveryDays = Math.max(maxDeliveryDays, estimatedDays);
            
            return {
                ...item,
                distanceKm: distance,
                estimatedDays,
                deliveryFee: fee,
                warehouse: product.warehouses[0]
            };
        });

        // 3. Aggregate Total Fee (Use a simple weighted average fee for multi-item orders)
        // For simplicity, total fee is the sum of all individual item fees.
        const totalDeliveryFee = detailedItems.reduce((sum, item) => sum + item.deliveryFee, 0);

        return res.status(200).json({
            ok: true,
            // Apply ceiling (round up to nearest 10) AND cap at MAX_DELIVERY_FEE (500)
            totalDeliveryFee: Math.min(
                Math.ceil(totalDeliveryFee / 10) * 10,
                MAX_DELIVERY_FEE
            ),
            estimatedDeliveryDate: new Date(Date.now() + maxDeliveryDays * 24 * 60 * 60 * 1000).toISOString(),
            maxDeliveryDays,
            detailedItems
        });

    } catch (err) {
        console.error("Delivery Fee API Error:", err);
        return res.status(500).json({ error: "Failed to calculate delivery logistics." });
    }
}