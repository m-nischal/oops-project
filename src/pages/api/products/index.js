// src/pages/api/products/index.js
import dbConnect from "../../../lib/dbConnect";
import CatalogService from "../../../services/catalogService";
import ProductModel from "../../../models/Product";
import User from "../../../models/User";

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
        radius 
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
      
      // 5. Search Query
      if (q) {
        const regex = { $regex: q, $options: "i" };
        filter.$or = [
          { name: regex },
          { description: regex },
          { tags: regex },
          { category: regex }
        ];
      }

      // 6. Tag Filter
      if (tag) {
        filter.tags = { $in: [tag] };
      }

      // 7. Location Filter (Geospatial)
      // Radius is in kilometers, converted to radians for MongoDB (Earth radius ~6378km)
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
        filter.ownerId = { $nin: wholesalerIds };
      }
      // ----------------------------

      // 8. Sorting
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