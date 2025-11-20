// src/components/ProductCard.js
import Link from "next/link";
import { useState } from "react";
import SizeChartModal from "components/SizeChartModal";

/**
 * Helper: slugify a string for image naming
 */
function slugify(s = "") {
  return String(s || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}

function firstSizeLabel(sizes = []) {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;
  const s = sizes[0];
  return (s && (s.size ?? s.label)) || null;
}

function totalStockFrom(product = {}) {
  if (typeof product.totalStock === "number") return product.totalStock;
  if (Array.isArray(product.sizes)) {
    return product.sizes.reduce((acc, it) => acc + (Number(it.stock || 0)), 0);
  }
  return 0;
}

export default function ProductCard({ product = {} }) {
  const [open, setOpen] = useState(false);

  const price = typeof product.price === "number" ? product.price : Number(product.price || 0);
  const priceText = `₹${price.toLocaleString("en-IN")}`;
  const firstSize = firstSizeLabel(product.sizes);
  const totalStock = totalStockFrom(product);
  const isOutOfStock = totalStock <= 0;

  // Determine candidate image URL for size chart
  // 1) explicit product.sizeChart.image
  // 2) slugify(product.sizeChart.chartName) -> /images/sizecharts/<slug>.png
  // 3) slugify(product.category || product.productType) -> /images/sizecharts/<slug>.png
  // 4) fallback clothing-default.png
  function sizeChartImageFor(prod) {
    if (!prod) return null;
    if (prod.sizeChart && prod.sizeChart.image) return prod.sizeChart.image;
    const tryNames = [];
    if (prod.sizeChart && prod.sizeChart.chartName) tryNames.push(slugify(prod.sizeChart.chartName));
    if (prod.category) tryNames.push(slugify(prod.category));
    if (prod.productType) tryNames.push(slugify(prod.productType));
    for (const name of tryNames) {
      if (!name) continue;
      // assume PNG or JPG; default to png
      return `/images/sizecharts/${name}.png`;
    }
    // final fallback only for clothing
    if ((prod.productType && prod.productType.toLowerCase().includes("cloth")) || (prod.category && String(prod.category).toLowerCase().includes("cloth")) ) {
      return `/images/sizecharts/clothing-default.png`;
    }
    return null;
  }

  const sizeImage = sizeChartImageFor(product);
  const showChart = Boolean(sizeImage) && (product.productType && String(product.productType).toLowerCase().includes("cloth") || String(product.category || "").toLowerCase().includes("cloth") || (product.sizeChart && product.sizeChart.chartName));

  return (
    <>
      <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12, width: 260, background: "#fff" }}>
        <div style={{ position: "relative" }}>
          <div style={{ height: 140, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", borderRadius: 6 }}>
            <button
              onClick={() => { if (showChart) setOpen(true); }}
              aria-label={showChart ? "View size chart" : "Product image"}
              style={{
                border: "none", background: "transparent", padding: 0, margin: 0, cursor: showChart ? "pointer" : "default",
                display: "block", width: "100%", height: "100%"
              }}
            >
              <img
                src={(product.images && product.images[0]) || "/images/placeholder.png"}
                alt={product.name || "product image"}
                style={{ maxHeight: 130, maxWidth: "100%", objectFit: "cover", borderRadius: 4 }}
              />
            </button>
          </div>

          {isOutOfStock ? (
            <div style={{
              position: "absolute",
              top: 8,
              left: 8,
              background: "rgba(255,255,255,0.9)",
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #f1c0c0",
              color: "#b00020",
              fontSize: 12,
              fontWeight: 700
            }}>
              Out of stock
            </div>
          ) : null}
        </div>

        <h3 style={{ margin: "6px 0", fontSize: 16, lineHeight: "1.2em" }}>{product.name || "Untitled product"}</h3>
        <div style={{ color: "#555", marginBottom: 8, fontSize: 13 }}>
          {product.description ? (product.description.length > 80 ? product.description.slice(0, 80) + "…" : product.description) : ""}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>{priceText}</div>
          <div style={{ fontSize: 13, color: "#666" }}>
            {firstSize ? `Size: ${firstSize}` : null}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href={`/product/${product._id}`} style={{ textDecoration: "none", color: "#0070f3", fontWeight: 600 }}>
            View
          </Link>

          <div style={{ fontSize: 12, color: "#666" }}>
            {isOutOfStock ? "—" : `${totalStock} available`}
          </div>
        </div>
      </div>

      <SizeChartModal
        open={open}
        onClose={() => setOpen(false)}
        imageUrl={sizeImage}
        title={product.sizeChart && product.sizeChart.chartName ? product.sizeChart.chartName : "Size chart"}
      />
    </>
  );
}
