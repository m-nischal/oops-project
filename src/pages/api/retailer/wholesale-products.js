import dbConnect from "../../../lib/dbConnect";
import Product from "../../../models/Product";
import User from "../../../models/User";
import { verifyToken } from "../../../lib/auth";

// Helper to safely escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
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
      return res
        .status(401)
        .json({ error: "Unauthorized. You must be a Retailer." });
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
      lng,
    } = req.query;

    const allWholesalers = await User.find({ role: "WHOLESALER" })
      .select("_id name")
      .lean();
    const allWholesalerIds = allWholesalers.map((w) => w._id);

    if (allWholesalerIds.length === 0) {
      return res
        .status(200)
        .json({ items: [], total: 0, page: 1, limit: Number(limit) });
    }

    const filter = {
      ownerId: { $in: allWholesalerIds },
    };

    if (category && category !== "All") {
      const catRegex = new RegExp(`\\b${escapeRegex(category)}`, "i");
      filter.$or = [
        { category: { $regex: catRegex } },
        { tags: { $in: [catRegex] } },
        { name: { $regex: catRegex } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // --- FIX: Regex Escaping & Smart AND Logic ---
    if (q) {
      const terms = q
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0);

      if (terms.length > 0) {
        // Safe regex for "Any Term"
        const anyTermRegex = new RegExp(
          terms.map((t) => escapeRegex(t)).join("|"),
          "i"
        );

        // Find matching wholesalers first
        const matchingRetailers = allWholesalers
          .filter((w) => w.name && w.name.match(anyTermRegex))
          .map((w) => w._id);

        const strictTerms = new Set([
          "men",
          "mens",
          "women",
          "womens",
          "boy",
          "boys",
          "girl",
          "girls",
        ]);

        // Construct AND conditions
        const andConditions = terms.map((term) => {
          const safeTerm = escapeRegex(term);
          let regexPattern;

          // Strict matching for gender
          if (strictTerms.has(term.toLowerCase())) {
            // "men" -> "men", "mens", "men's"
            if (term.toLowerCase().startsWith("men"))
              regexPattern = "\\bmen('?s?)?\\b";
            else if (term.toLowerCase().startsWith("women"))
              regexPattern = "\\bwomen('?s?)?\\b";
            else regexPattern = `\\b${safeTerm}\\b`;
          } else {
            regexPattern = safeTerm;
          }

          const termRegex = new RegExp(regexPattern, "i");

          return {
            $or: [
              { name: { $regex: termRegex } },
              { description: { $regex: termRegex } },
              { tags: { $regex: termRegex } },
              { category: { $regex: termRegex } },
              { brand: { $regex: termRegex } },
              { ownerId: { $in: matchingRetailers } },
            ],
          };
        });

        if (filter.$or) {
          filter.$and = [
            { $or: [...filter.$or] },
            { $and: andConditions }, // Logic: (Category OR Tags) AND (Search Term 1 AND Search Term 2)
          ];
          delete filter.$or;
        } else {
          filter.$and = andConditions;
        }
      }
    }

    // ... (Sorting Logic Remains Unchanged) ...
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
      products.forEach((p) => {
        const wLoc = p.warehouses?.[0]?.location?.coordinates;
        if (wLoc) {
          p._distance = calculateDistance(
            Number(lat),
            Number(lng),
            wLoc[1],
            wLoc[0]
          );
        } else {
          p._distance = Infinity;
        }
      });
    }

    // In-memory Sort if Distance selected
    if (sort === "distance" && lat && lng) {
      products.sort((a, b) => a._distance - b._distance);
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
    return res
      .status(500)
      .json({ error: "Failed to fetch wholesale products" });
  }
}
