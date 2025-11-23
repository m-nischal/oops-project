// src/pages/api/products/index.js
import dbConnect from "../../../lib/dbConnect";
import CatalogService from "../../../services/catalogService";
import ProductModel from "../../../models/Product";
import User from "../../../models/User";
import Order from "../../../models/orderModel"; // ADDED: Import Order Model
import { verifyToken } from "../../../lib/auth"; // ADDED: Import Auth Helper

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

// Helper: Safely escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * NEW SERVER-SIDE RECOMMENDATION ENGINE
 * Fetches user order history, derives tags, and finds similar products excluding
 * purchased ones.
 */
async function getRecommendedProducts(userId, limit) {
    // 1. Fetch ALL Orders (user's purchases)
    const orders = await Order.find({ userId: userId }).limit(100).lean();

    const purchasedProductIds = [];
    const purchasedTags = [];
    orders.forEach(order => {
        order.items.forEach(item => {
            purchasedProductIds.push(item.productId);
        });
    });
    
    // 2. Fetch tags for all unique purchased products
    const uniquePurchasedIds = [...new Set(purchasedProductIds)];
    
    const purchasedProducts = await ProductModel.find({ _id: { $in: uniquePurchasedIds } })
        .select("tags").lean();

    purchasedProducts.forEach(p => {
        if (Array.isArray(p.tags)) {
            p.tags.forEach(tag => purchasedTags.push(tag));
        }
    });
    
    if (purchasedTags.length === 0) return [];

    // 3. Count tag frequency
    const tagCounts = purchasedTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});

    const sortedTags = Object.entries(tagCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .map(([tag]) => tag);
    
    const topTags = sortedTags.slice(0, 5);

    // 4. Find products matching top tags
    const filter = {
        isPublished: true,
        tags: { $in: topTags },
        _id: { $nin: uniquePurchasedIds } // Exclude already purchased items
    };

    // Exclude wholesalers (Retailer products only for customer view)
    const wholesalers = await User.find({ role: "WHOLESALER" }).select("_id").lean();
    const wholesalerIds = wholesalers.map(u => u._id);
    if (wholesalerIds.length > 0) {
        filter.ownerId = { $nin: wholesalerIds };
    }
    
    // Fetch potential candidates
    let candidates = await ProductModel.find(filter)
        .limit(Number(limit) * 2) // Fetch more than needed
        .lean();
        
    // 5. Secondary sort by highest tag match count (in-memory)
    candidates.forEach(p => {
        p.tagMatchCount = p.tags ? p.tags.filter(tag => topTags.includes(tag)).length : 0;
    });
    candidates.sort((a, b) => b.tagMatchCount - a.tagMatchCount);

    return candidates.slice(0, limit);
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
      
      // --- Handle Recommendation Sort Separately ---
      if (sort === 'recommended') {
        let userId = null;
        try {
            // Extract token from header and verify
            const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
            if (token) {
                const payload = verifyToken(req); // Uses token from header
                userId = payload.id;
            }
        } catch (e) {
            // Not logged in or invalid token: return empty results
            return res.status(200).json({ items: [], total: 0 });
        }
        
        // Execute the server-side recommendation logic
        const recommendedProducts = await getRecommendedProducts(userId, Number(limit) * 5);
        
        // Return a subset of these as a flat list
        const skip = (Number(page) - 1) * Number(limit);
        const paginated = recommendedProducts.slice(skip, skip + Number(limit));
        
        return res.status(200).json({ items: paginated, total: recommendedProducts.length });
      }


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
      
      // 6. ADVANCED Search Query (Custom Gender/Unisex Logic)
      if (q) {
        const terms = q.trim().split(/\s+/).filter(t => t.length > 0);
        const qLower = q.trim().toLowerCase();

        if (terms.length > 0) {
            
            let customFilter = null;
            let isCustomGenderSearch = false;
            
            // Helper to build a regex OR condition for name/tags
            const buildRegexOr = (patterns) => {
                const regexes = patterns.map(p => new RegExp(`\\b${p}\\b`, 'i'));
                return { $in: regexes };
            };

            // --- Apply Custom Gender/Unisex Rules (Rules 1-5) ---
            
            // Rule 5: Unisex Filter (must be explicitly searching for it)
            if (qLower === 'unisex') {
                isCustomGenderSearch = true;
                customFilter = {
                    $or: [
                        { tags: { $all: [/boys/i, /girls/i] } },
                        { tags: { $all: [/men/i, /women/i] } },
                        { tags: { $in: [/unisex/i] } }
                    ]
                };
            } 
            // Rule 1: Men Filter (Men OR Unisex)
            else if (terms.some(t => ['men', 'man', 'mens'].includes(t.toLowerCase()))) {
                isCustomGenderSearch = true;
                const patterns = ['man', 'men', 'mens', 'unisex'];
                customFilter = { $or: [{ name: buildRegexOr(patterns) }, { tags: buildRegexOr(patterns) }] };
            } 
            // Rule 2: Women Filter (Women OR Unisex)
            else if (terms.some(t => ['women', 'woman', 'womens'].includes(t.toLowerCase()))) {
                isCustomGenderSearch = true;
                const patterns = ['woman', 'women', 'womens', 'unisex'];
                customFilter = { $or: [{ name: buildRegexOr(patterns) }, { tags: buildRegexOr(patterns) }] };
            } 
            // Rule 3: Boys Filter (Boys OR Unisex)
            else if (terms.some(t => ['boy', 'boys'].includes(t.toLowerCase()))) {
                isCustomGenderSearch = true;
                const patterns = ['boy', 'boys', 'unisex'];
                customFilter = { $or: [{ name: buildRegexOr(patterns) }, { tags: buildRegexOr(patterns) }] };
            } 
            // Rule 4: Girls Filter (Girls OR Unisex)
            else if (terms.some(t => ['girl', 'girls'].includes(t.toLowerCase()))) {
                isCustomGenderSearch = true;
                const patterns = ['girl', 'girls', 'unisex'];
                customFilter = { $or: [{ name: buildRegexOr(patterns) }, { tags: buildRegexOr(patterns) }] };
            }
            
            const finalAndConditions = [];
            
            // 6a. If a custom filter was made, include it.
            if (isCustomGenderSearch) {
                finalAndConditions.push(customFilter);
            }

            // 6b. Fallback to original complex general search logic for all terms
            // This handles non-gender terms (e.g., 'blue', 'shirt') AND integrates retailer search.
            
            const anyTermRegex = new RegExp(terms.map(t => escapeRegex(t)).join("|"), "i");
            const matchingRetailers = await User.find({ 
                role: "RETAILER", 
                name: { $regex: anyTermRegex } 
            }).select("_id name").lean();

            const strictTerms = new Set([ "men", "mens", "women", "womens", "boy", "boys", "girl", "girls", "unisex" ]);
            
            const termConditions = terms.map(term => {
                const lower = term.toLowerCase();
                const safeTerm = escapeRegex(term);
                let regexPattern;

                // This section implements the default logic for non-gender terms
                if (strictTerms.has(lower)) {
                    if (lower.startsWith("men")) regexPattern = "\\bmen('?s?)?\\b";
                    else if (lower.startsWith("women")) regexPattern = "\\bwomen('?s?)?\\b";
                    else regexPattern = `\\b${safeTerm}\\b`;
                } else {
                    // Use simple safe term for general search
                    regexPattern = safeTerm;
                }

                const termRegex = new RegExp(regexPattern, "i");
                
                const retailerIds = matchingRetailers.filter(r => termRegex.test(r.name)).map(r => r._id);

                return {
                    $or: [
                        { name: { $regex: termRegex } },
                        { description: { $regex: termRegex } },
                        { tags: { $regex: termRegex } },
                        { category: { $regex: termRegex } },
                        { brand: { $regex: termRegex } },
                        { ownerId: { $in: retailerIds } },
                    ],
                };
            });
            
            // Combine both custom (if present) and general search results
            if (!isCustomGenderSearch || terms.length > 1) {
                finalAndConditions.push(...termConditions);
            }
            
            if (finalAndConditions.length > 0) {
                if (filter.$and) {
                    filter.$and.push(...finalAndConditions);
                } else {
                    filter.$and = finalAndConditions;
                }
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