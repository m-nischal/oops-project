import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product"; 
import User from "../../../models/User";
import { verifyToken } from "../../../lib/auth";

// Helper: Calculate Distance (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let payload;
  try {
    payload = verifyToken(req); 
    if (!payload || payload.role !== "RETAILER") {
      return res.status(401).json({ error: "Unauthorized. You must be a Retailer." });
    }
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }

  try {
    const { 
        page = 1, 
        limit = 12, 
        q = "", 
        sort = "newest",
        category, 
        minPrice, 
        maxPrice,
        lat, 
        lng
    } = req.query;

    // 1. Get All Wholesalers
    const allWholesalers = await User.find({ role: "WHOLESALER" }).select("_id name").lean();
    const allWholesalerIds = allWholesalers.map(w => w._id);

    if (allWholesalerIds.length === 0) {
      return res.status(200).json({ items: [], total: 0, page: 1, limit: Number(limit) });
    }

    // 2. Build Filter
    const filter = {
      ownerId: { $in: allWholesalerIds },
    };

    // --- CATEGORY FILTER (STRICTER) ---
    if (category && category !== "All") {
        // Use word boundary (\b) to ensure "Men" doesn't match "Women"
        // "Men" -> Matches "Men", "Men's", "Mens" | Does NOT match "Women"
        const catRegex = new RegExp(`\\b${category}`, "i"); 
        
        filter.$or = [
            { category: { $regex: catRegex } },
            { tags: { $in: [catRegex] } },
            { name: { $regex: catRegex } } 
        ];
    }

    // --- PRICE RANGE FILTER ---
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // --- SEARCH FILTER (SMARTER) ---
    if (q) {
      const trimmedQ = q.trim();
      
      // If the search term is a gender/common category word, use strict boundary
      // Otherwise allow partial match (e.g. "sams" -> "samsung")
      const isGenderKeyword = /^(men|women|boy|girl|male|female)$/i.test(trimmedQ);
      const searchRegex = isGenderKeyword 
          ? new RegExp(`\\b${trimmedQ}`, "i") // Strict for gender
          : new RegExp(trimmedQ, "i");        // Loose for others

      const matchingWholesalers = allWholesalers
        .filter(w => w.name && w.name.match(searchRegex))
        .map(w => w._id);

      const searchConditions = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { tags: { $in: [searchRegex] } },
        { ownerId: { $in: matchingWholesalers } }
      ];
      
      // Combine with existing category filter if present
      if (filter.$or) {
          filter.$and = [
              { $or: [...filter.$or] }, 
              { $or: searchConditions }
          ];
          delete filter.$or;
      } else {
          filter.$or = searchConditions;
      }
    }

    // 3. HANDLE SORTING
    // Distance Sort Logic
    if (sort === "distance" && lat && lng) {
        const userLat = Number(lat);
        const userLng = Number(lng);

        const allMatches = await Product.find(filter).lean();

        const withDistance = allMatches.map(p => {
            const wLoc = p.warehouses?.[0]?.location?.coordinates;
            let dist = Infinity;
            if (wLoc) {
                // Mongo stores [lng, lat]
                dist = calculateDistance(userLat, userLng, wLoc[1], wLoc[0]);
            }
            return { ...p, _distance: dist };
        });

        withDistance.sort((a, b) => a._distance - b._distance);

        const startIndex = (Number(page) - 1) * Number(limit);
        const paginatedItems = withDistance.slice(startIndex, startIndex + Number(limit));

        return res.status(200).json({
            items: paginatedItems,
            total: withDistance.length,
            page: Number(page),
            limit: Number(limit)
        });
    }

    // Standard DB Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === "price_low") sortOptions = { price: 1 };
    if (sort === "price_high") sortOptions = { price: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };

    const products = await Product.find(filter)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort(sortOptions)
      .lean();
      
    // Attach distance for UI display even if not sorting by it
    if (lat && lng) {
        products.forEach(p => {
            const wLoc = p.warehouses?.[0]?.location?.coordinates;
            if (wLoc) {
                p._distance = calculateDistance(Number(lat), Number(lng), wLoc[1], wLoc[0]);
            } else {
                p._distance = Infinity;
            }
        });
    }

    const total = await Product.countDocuments(filter);

    return res.status(200).json({ 
      items: products, 
      total,
      page: Number(page),
      limit: Number(limit),
    });

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: "Failed to fetch wholesale products" });
  }
}