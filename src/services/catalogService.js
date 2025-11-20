// src/services/catalogService.js
// Use your project's preferred import style. This file exports getProducts used by /api/products.
import Product from "models/Product.js";

/**
 * getProducts(filter, options)
 * - filter: mongo filter object
 * - options: { lean, limit, skip, sort }
 *
 * Returns an array of product plain objects (lean) or documents (if lean:false).
 * If lean:true, we compute a fresh totalStock for each plain product object using
 * Product.computeTotalStockForPlainObject to ensure availability is accurate.
 */
async function getProducts(filter = {}, options = {}) {
  const lean = options.lean === true;
  const limit = typeof options.limit === "number" ? options.limit : (options.limit ? Number(options.limit) : 20);
  const skip = typeof options.skip === "number" ? options.skip : (options.skip ? Number(options.skip) : 0);
  const sort = options.sort || { createdAt: -1 };

  // Build the query
  let query = Product.find(filter).sort(sort).skip(skip).limit(limit);

  if (lean) {
    query = query.lean();
  }

  const results = await query.exec();

  // If lean, results are plain objects — compute totalStock for each
  if (lean && Array.isArray(results)) {
    const computed = results.map((p) => {
      try {
        const ts = Product.computeTotalStockForPlainObject(p);
        // ensure the plain object has a totalStock numeric property for client
        return Object.assign({}, p, { totalStock: ts });
      } catch (e) {
        // If something fails, leave original object as-is (defensive)
        return Object.assign({}, p, { totalStock: (p && typeof p.totalStock === "number") ? p.totalStock : 0 });
      }
    });
    return computed;
  }

  // If not lean, attempt to ensure each mongoose document has totalStock up-to-date via instance recalc
  if (!lean && Array.isArray(results)) {
    for (const doc of results) {
      if (typeof doc.recalculateStock === "function") {
        try {
          doc.recalculateStock(); // updates doc.totalStock in memory
        } catch (e) {
          // ignore errors — not critical
        }
      }
    }
  }

  return results;
}

export default {
  getProducts,
};
