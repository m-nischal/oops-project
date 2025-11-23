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
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
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
        maxPrice
      } = req.query;
      
      // 1. Base Filter
      const filter = {
        isPublished: true 
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
      
      // 6. ADVANCED Search Query (Smart AND Logic)
      if (q) {
        // Split query into individual terms
        const terms = q.trim().split(/\s+/).filter(t => t.length > 0);
        
        if (terms.length > 0) {
            // We need to find Retailers that match ANY of these terms
            const anyTermRegex = new RegExp(terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|"), "i");
            const matchingRetailers = await User.find({ 
                role: "RETAILER", 
                name: { $regex: anyTermRegex } 
            }).select("_id name").lean();

            // Smart Regex Builder
            const andConditions = terms.map(term => {
                const lower = term.toLowerCase();
                let regexPattern;

                // A. Handle Gender/Category Words (Strict but flexible for suffix)
                // "men" -> matches "men", "mens", "men's" | BUT NOT "women"
                if (["men", "mens", "man"].includes(lower)) {
                    regexPattern = "\\bmen('?s?)?\\b";
                } else if (["women", "womens", "woman"].includes(lower)) {
                    regexPattern = "\\bwomen('?s?)?\\b";
                } else if (["boy", "boys"].includes(lower)) {
                    regexPattern = "\\bboy('?s?)?\\b";
                } else if (["girl", "girls"].includes(lower)) {
                    regexPattern = "\\bgirl('?s?)?\\b";
                } else if (["kid", "kids"].includes(lower)) {
                    regexPattern = "\\bkid('?s?)?\\b";
                } 
                // B. Handle Plurals/Singulars for normal words
                // "shirts" -> matches "shirt", "shirts"
                else if (lower.length > 3 && lower.endsWith('s')) {
                    const root = term.slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    regexPattern = `${root}(s?)`;
                } 
                // C. Default fuzzy match
                else {
                    regexPattern = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }

                const termRegex = new RegExp(regexPattern, "i");

                // Find IDs of retailers that specifically match THIS term
                const specificRetailerIds = matchingRetailers
                    .filter(r => new RegExp(regexPattern, "i").test(r.name))
                    .map(r => r._id);

                // The term must match at least one of these fields
                return {
                    $or: [
                        { name: { $regex: termRegex } },
                        { description: { $regex: termRegex } },
                        { tags: { $regex: termRegex } },
                        { category: { $regex: termRegex } },
                        { brand: { $regex: termRegex } },
                        { retailer: { $regex: termRegex } },
                        { ownerId: { $in: specificRetailerIds } }
                    ]
                };
            });

            if (filter.$and) {
                filter.$and.push(...andConditions);
            } else {
                filter.$and = andConditions;
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
            $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
          }
        };
      }

      // --- EXCLUDE WHOLESALERS ---
      const wholesalers = await User.find({ role: "WHOLESALER" }).select("_id").lean();
      const wholesalerIds = wholesalers.map(u => u._id);
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
      if (sort === 'distance' && lat && lng) {
          const userLat = Number(lat);
          const userLng = Number(lng);
          
          const allProducts = await CatalogService.getProducts(filter, { 
              lean: true, 
              limit: 0, 
              sort: { createdAt: -1 }
          });

          allProducts.forEach(p => {
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
        if (sort === 'newest') sortOption = { createdAt: -1 };
        else if (sort === 'oldest') sortOption = { createdAt: 1 };
        else if (sort === 'price_asc') sortOption = { price: 1 };
        else if (sort === 'price_desc') sortOption = { price: -1 };
        else if (sort.includes(':')) {
             const [field, order] = sort.split(':');
             sortOption = { [field]: order === 'desc' ? -1 : 1 };
        }
      }

      const skip = (Number(page) - 1) * Number(limit);

      const products = await CatalogService.getProducts(filter, { 
        lean: true, 
        limit: Number(limit), 
        skip, 
        sort: sortOption 
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