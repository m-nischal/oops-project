// src/pages/api/admin/seed.js
import dbConnect from "lib/dbConnect.js";
import Product from "models/Product.js";

/**
 * POST /api/admin/seed
 * Seed sample products for dev. Protect with environment secret before using on any shared server.
 *
 * Body: { secret: process.env.SEED_SECRET } (optional)
 */
export default async function handler(req, res) {
  try { await dbConnect(); } catch (err) {
    console.error("DB connect failed:", err);
    return res.status(500).json({ error: "Database connection failed" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // optional protection
  const secret = process.env.SEED_SECRET || "";
  if (secret && (!req.body || req.body.secret !== secret)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const items = [
      {
        name: "Blue Hoodie",
        price: 1499,
        originalPrice: 1999,
        description: "Warm blue hoodie",
        materials: ["cotton", "polyester"],
        images: ["/images/hoodie1.jpg"],
        sizes: [{ label: "S", stock: 4 }, { label: "M", stock: 6 }]
      },
      {
        name: "Red Tee",
        price: 499,
        originalPrice: 699,
        description: "Soft cotton T-shirt",
        materials: ["cotton"],
        images: ["/images/redtee.jpg"],
        sizes: [{ label: "M", stock: 10 }]
      },
      {
        name: "Black Joggers",
        price: 1299,
        originalPrice: 1499,
        description: "Comfortable joggers for daily wear",
        materials: ["polyester", "spandex"],
        images: ["/images/joggers.jpg"],
        sizes: [{ label: "L", stock: 8 }, { label: "M", stock: 3 }]
      }
    ];

    await Product.deleteMany({});
    await Product.insertMany(items);
    return res.status(200).json({ success: true, seeded: items.length });
  } catch (err) {
    console.error("POST /api/admin/seed error:", err);
    return res.status(500).json({ error: err.message || "Seeding failed" });
  }
}
