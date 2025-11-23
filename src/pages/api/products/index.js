// src/pages/api/products/index.js
import dbConnect from "../../../lib/dbConnect";
import CatalogService from "../../../services/catalogService";
import ProductModel from "../../../models/Product";
import User from "../../../models/User";

// Helper: Calculate Haversine Distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // km
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

// Helper: Safely escape regex special characters (Copied as necessary dependency)
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const {
        categoryId,
        limit = 20,
        page = 1,
        q = "",
        inStockOnly,
        storefront,
        sort,
        tag,
        lat,
        lng,
        radius,
        minPrice,
        maxPrice,
      } = req.query;

      // 1. Base Filter
      const filter = {
        isPublished: true,
      };

      // 2. Category Filter
      if (categoryId) {
        filter.categories = { $in: [categoryId] };
      }

      // 3. Storefront Filter
      if (storefront) filter.storefronts = storefront;

      // 4. Stock Filter
      if (inStockOnly === "true") {
        filter["sizes.stock"] = { $gt: 0 };
      }

      // 5. Price Filter
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }

      // 6. ADVANCED Search Query (Custom Gender/Unisex Logic)
      if (q) {
        const terms = q
          .trim()
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length > 0);

        if (terms.length > 0) {
          // 6a. Find Retailers (Sellers for B2C) whose names match ANY search term
          const anyTermRegex = new RegExp(
            terms.map((t) => escapeRegex(t)).join("|"),
            "i"
          );
          // Customer storefront focuses on RETAILERS selling to them
          const matchingSellers = await User.find({
            role: "RETAILER",
            name: { $regex: anyTermRegex },
          })
            .select("_id name")
            .lean();

          const allTermConditions = [];
          const genderTerms = new Set([
            "men",
            "mens",
            "women",
            "womens",
            "boy",
            "boys",
            "girl",
            "girls",
            "unisex",
          ]);

          // 6b. Build search conditions: all terms must match (AND logic)
          for (const term of terms) {
            const safeTerm = escapeRegex(term);
            let regexPattern;

            // Handle Gender terms specially (look for word boundaries)
            if (genderTerms.has(term)) {
              // Use word boundary for strict matching of gender terms
              if (term.startsWith("men")) regexPattern = "\\bmen('?s?)?\\b";
              else if (term.startsWith("women"))
                regexPattern = "\\bwomen('?s?)?\\b";
              else if (term.startsWith("boy"))
                regexPattern = "\\bboy('?s?)?\\b";
              else if (term.startsWith("girl"))
                regexPattern = "\\bgirl('?s?)?\\b";
              else regexPattern = `\\b${safeTerm}\\b`;
            } else {
              // General terms can match anywhere
              regexPattern = safeTerm;
            }

            const termRegex = new RegExp(regexPattern, "i");

            // Filter seller IDs who match this SPECIFIC term's regex
            const sellerIdsForTerm = matchingSellers
              .filter((r) => termRegex.test(r.name))
              .map((r) => r._id);

            // Each term must match in one of the fields (OR logic for fields)
            allTermConditions.push({
              $or: [
                { name: { $regex: termRegex } },
                { description: { $regex: termRegex } },
                { tags: { $regex: termRegex } },
                { category: { $regex: termRegex } },
                { brand: { $regex: termRegex } },
                { ownerId: { $in: sellerIdsForTerm } }, // Match seller name
              ],
            });
          }

          if (allTermConditions.length > 0) {
            // Apply the new AND conditions
            if (!filter.$and) filter.$and = [];
            // Enforce that ALL search terms must match at least one field
            filter.$and.push({ $and: allTermConditions });
          }
        }
      }

      // 7. Tag Filter
      if (tag) {
        filter.tags = { $in: [tag] };
      }

      // 8. Location Filter (GeoSpatial)
      if (lat && lng && radius) {
        const radiusInRadians = Number(radius) / 6378.1;
        filter["manufacturedAt.location"] = {
          $geoWithin: {
            $centerSphere: [[Number(lng), Number(lat)], radiusInRadians],
          },
        };
      }

      // --- EXCLUDE WHOLESALERS ---
      const wholesalers = await User.find({ role: "WHOLESALER" })
        .select("_id")
        .lean();
      const wholesalerIds = wholesalers.map((u) => u._id);
      if (wholesalerIds.length > 0) {
        const exclusion = { ownerId: { $nin: wholesalerIds } };
        if (!filter.$and) filter.$and = [];

        if (filter.ownerId) {
          filter.$and.push({ ownerId: filter.ownerId });
          delete filter.ownerId;
        }
        filter.$and.push(exclusion);
      }

      // 9. SORTING & PAGINATION

      // --- A. DISTANCE SORT (In-Memory) ---
      if (sort === "distance" && lat && lng) {
        const userLat = Number(lat);
        const userLng = Number(lng);

        const allProducts = await CatalogService.getProducts(filter, {
          lean: true,
          limit: 0,
          sort: { createdAt: -1 },
        });

        allProducts.forEach((p) => {
          const wLoc = p.warehouses?.[0]?.location?.coordinates;
          if (wLoc) {
            p._distance = calculateDistance(userLat, userLng, wLoc[1], wLoc[0]);
          } else {
            p._distance = Infinity;
          }
        });

        allProducts.sort((a, b) => a._distance - b._distance);

        const total = allProducts.length;
        const skip = (Number(page) - 1) * Number(limit);
        const paginated = allProducts.slice(skip, skip + Number(limit));

        return res.status(200).json({ items: paginated, total });
      }

      // --- B. STANDARD SORT (DB Level) ---
      let sortOption = { createdAt: -1 };
      if (sort) {
        if (sort === "newest") sortOption = { createdAt: -1 };
        else if (sort === "oldest") sortOption = { createdAt: 1 };
        else if (sort === "price_asc") sortOption = { price: 1 };
        else if (sort === "price_desc") sortOption = { price: -1 };
        else if (sort.includes(":")) {
          const [field, order] = sort.split(":");
          sortOption = { [field]: order === "desc" ? -1 : 1 };
        }
      }

      const skip = (Number(page) - 1) * Number(limit);

      const products = await CatalogService.getProducts(filter, {
        lean: true,
        limit: Number(limit),
        skip,
        sort: sortOption,
      });

      const total = await ProductModel.countDocuments(filter);

      return res.status(200).json({ items: products, total });
    } catch (err) {
      console.error("GET /api/products error:", err);
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
