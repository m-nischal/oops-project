// src/pages/product/[id].js
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import SizeChartModal from "components/SizeChartModal";

/* Helpers */
function sizeLabelOf(s) {
  if (!s) return "";
  return typeof s.size !== "undefined" ? String(s.size) : (typeof s.label !== "undefined" ? String(s.label) : "");
}
function slugify(s = "") {
  return String(s || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}
function totalStockFrom(product = {}) {
  if (!product) return 0;
  if (typeof product.totalStock === "number") return product.totalStock;
  if (Array.isArray(product.sizes)) return product.sizes.reduce((acc, it) => acc + (Number(it.stock || 0)), 0);
  return 0;
}
function isClothingProduct(product = {}) {
  const pt = (product.productType || "").toString().toLowerCase();
  const cat = (product.category || "").toString().toLowerCase();
  return pt.includes("cloth") || cat.includes("cloth") || (product.sizeChart && product.sizeChart.chartName);
}

/**
 * Determine the size-chart image URL for a product.
 * Priority:
 *  1) product.sizeChart.image
 *  2) slug(product.sizeChart.chartName) -> /images/sizecharts/<slug>.png
 *  3) slug(product.category) -> /images/sizecharts/<slug>.png
 *  4) slug(product.productType) -> /images/sizecharts/<slug>.png
 *  5) /images/sizecharts/clothing-default.png (only for clothing)
 */
function sizeChartImageFor(prod) {
  if (!prod) return null;
  if (prod.sizeChart && prod.sizeChart.image) return prod.sizeChart.image;
  const tryNames = [];
  if (prod.sizeChart && prod.sizeChart.chartName) tryNames.push(slugify(prod.sizeChart.chartName));
  if (prod.category) tryNames.push(slugify(prod.category));
  if (prod.productType) tryNames.push(slugify(prod.productType));
  for (const name of tryNames) {
    if (!name) continue;
    return `/images/sizecharts/${name}.png`;
  }
  if (isClothingProduct(prod)) return `/images/sizecharts/clothing-default.png`;
  return null;
}

/* Local cart helpers (consistent with cart page) */
function getCart() {
  try { return JSON.parse(localStorage.getItem("livemart_cart") || "[]"); } catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem("livemart_cart", JSON.stringify(cart)); }

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // size & quantity
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedSizeStock, setSelectedSizeStock] = useState(0);
  const [qty, setQty] = useState(1);
  const prevQtyRef = useRef(1);

  const [adding, setAdding] = useState(false);

  // size chart modal
  const [chartOpen, setChartOpen] = useState(false);
  const [sizeImage, setSizeImage] = useState(null);

  // New: UI confirmation state (stays on page after add)
  const [justAdded, setJustAdded] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          setProduct(null);
          return;
        }
        const json = await res.json();
        const p = json && json.product ? json.product : json;
        if (cancelled) return;
        setProduct(p);

        // init size selection
        const sizes = p?.sizes || [];
        if (sizes && sizes.length) {
          const first = sizes[0];
          const label = sizeLabelOf(first);
          setSelectedSize(label);
          setSelectedSizeStock(Number(first.stock || 0));
          setQty(1);
          prevQtyRef.current = 1;
        } else {
          setSelectedSize(null);
          setSelectedSizeStock(0);
          setQty(1);
          prevQtyRef.current = 1;
        }

        // compute size chart image for UI
        setSizeImage(sizeChartImageFor(p));
      } catch (err) {
        console.error("Failed to load product:", err);
        setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  // keep selectedSizeStock updated if product or selectedSize changes
  useEffect(() => {
    if (!product) return;
    const s = (product.sizes || []).find(x => sizeLabelOf(x) === selectedSize);
    const stock = s ? Number(s.stock || 0) : 0;
    setSelectedSizeStock(stock);
    // do not silently change qty if it exceeds stock; only block increments
    if (qty > stock && stock > 0) {
      // noop
    }
  }, [product, selectedSize]);

  // Stepper handlers
  function incrementQty() {
    const newQty = Number(qty || 0) + 1;
    if (selectedSize) {
      if (newQty > selectedSizeStock) {
        alert(`Only ${selectedSizeStock} units available for size ${selectedSize}.`);
        return;
      }
    } else {
      const total = totalStockFrom(product);
      if (typeof total === "number" && newQty > total) {
        alert(`Only ${total} units available.`);
        return;
      }
    }
    setQty(newQty);
    prevQtyRef.current = newQty;
  }
  function decrementQty() {
    const newQty = Math.max(1, Number(qty || 0) - 1);
    setQty(newQty);
    prevQtyRef.current = newQty;
  }

  // Add to cart with server-side verification
  async function handleAddToCart() {
    if (!product) { alert("Product not loaded"); return; }
    const desiredQty = Number(qty) || 1;
    setAdding(true);
    try {
      // verify latest
      const res = await fetch(`/api/products/${product._id || product._id}`);
      if (!res.ok) { alert("Failed to verify stock. Try again."); setAdding(false); return; }
      const json = await res.json();
      const latest = json && json.product ? json.product : json;

      if (selectedSize) {
        const sizeObj = (latest.sizes || []).find(s => sizeLabelOf(s) === selectedSize);
        const available = sizeObj ? Number(sizeObj.stock || 0) : 0;
        if (available <= 0) { alert(`Selected size ${selectedSize} is out of stock.`); setAdding(false); return; }
        if (desiredQty > available) { alert(`Only ${available} left for size ${selectedSize}.`); setAdding(false); return; }
      } else {
        const available = totalStockFrom(latest);
        if (available <= 0) { alert("Product out of stock."); setAdding(false); return; }
        if (desiredQty > available) { alert(`Only ${available} left.`); setAdding(false); return; }
      }

      const cart = getCart();
      const pid = String(product._id || product._id);
      const existing = cart.find(i => i.productId === pid && i.size === selectedSize);

      if (existing) {
        // merge but cap at some reasonable maximum
        existing.qty = Math.min(existing.qty + desiredQty, 999);
      } else {
        cart.push({
          productId: pid,
          name: product.name,
          price: product.price,
          size: selectedSize,
          qty: desiredQty,
          image: product.images && product.images[0]
        });
      }

      saveCart(cart);

      // notify other windows/components that cart changed
      try { window.dispatchEvent(new Event("storage")); } catch (e) { /* ignore */ }

      // Instead of navigating away, stay on page and show a friendly confirmation
      setJustAdded(true);
      setAddedCount(desiredQty);

      // Auto-hide the confirmation after a short time
      setTimeout(() => { setJustAdded(false); }, 3500);
    } catch (err) {
      console.error(err);
      alert("Error adding to cart");
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <p style={{ padding: 20 }}>Loading…</p>;
  if (!product) return <p style={{ padding: 20 }}>Product not found.</p>;

  const totalStock = totalStockFrom(product);
  const incrementDisabled = selectedSize ? qty >= selectedSizeStock : (typeof totalStock === "number" ? qty >= totalStock : false);
  const decrementDisabled = qty <= 1;

  const chartImageUrl = sizeImage;
  const showChart = Boolean(chartImageUrl) && isClothingProduct(product);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Link href="/categories">Categories</Link> &nbsp;/&nbsp;
          <Link href="/products">Products</Link>
        </div>
        <Link href="/cart">Cart</Link>
      </header>

      <main style={{ display: "flex", gap: 24, marginTop: 18 }}>
        <div style={{ width: 360 }}>
          <div style={{ background: "#fafafa", padding: 12, borderRadius: 8 }}>
            <button
              onClick={() => { if (showChart) setChartOpen(true); }}
              aria-label={showChart ? "View size chart" : "Product image"}
              style={{ border: "none", background: "transparent", padding: 0, margin: 0, cursor: showChart ? "pointer" : "default", width: "100%" }}
            >
              <img
                src={product.images && product.images[0] ? product.images[0] : "/images/placeholder.png"}
                alt={product.name}
                style={{ width: "100%", objectFit: "contain" }}
              />
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ marginTop: 0 }}>{product.name}</h1>
          <div style={{ color: "#444", marginBottom: 12 }}>{product.description}</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>₹{product.price}</div>

          {product.sizes && product.sizes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6 }}>Size</div>
              <select
                value={selectedSize || ""}
                onChange={e => { setSelectedSize(e.target.value); setQty(1); prevQtyRef.current = 1; }}
                style={{ padding: 8, borderRadius: 6 }}
              >
                {product.sizes.map(s => (
                  <option key={sizeLabelOf(s)} value={sizeLabelOf(s)}>
                    {sizeLabelOf(s)} — stock: {s.stock}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>{selectedSize ? `Available: ${selectedSizeStock}` : null}</div>
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
              <button
                onClick={decrementQty}
                aria-label="Decrease quantity"
                disabled={decrementDisabled}
                style={{
                  padding: "10px 12px",
                  background: decrementDisabled ? "#f5f5f5" : "#fff",
                  border: "none",
                  cursor: decrementDisabled ? "not-allowed" : "pointer"
                }}
              >−</button>

              <div aria-live="polite" style={{ minWidth: 56, textAlign: "center", padding: "10px 8px", fontWeight: 600 }}>
                {qty}
              </div>

              <button
                onClick={incrementQty}
                aria-label="Increase quantity"
                disabled={incrementDisabled}
                style={{
                  padding: "10px 12px",
                  background: incrementDisabled ? "#f5f5f5" : "#fff",
                  border: "none",
                  cursor: incrementDisabled ? "not-allowed" : "pointer"
                }}
              >+</button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || (selectedSize && selectedSizeStock <= 0) || (!selectedSize && typeof totalStock === "number" && totalStock <= 0)}
              style={{ padding: "10px 14px", borderRadius: 8, background: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}
            >
              {adding ? "Adding…" : "Add to cart"}
            </button>
          </div>

          {/* Confirmation UI: show inline message when item added (stays on page) */}
          {justAdded && (
            <div style={{ marginTop: 12, padding: 10, background: "#e6ffed", border: "1px solid #cfeacb", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{addedCount}</strong> item{addedCount > 1 ? "s" : ""} added to cart.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => router.push("/cart")} style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#0b74de", color: "#fff", cursor: "pointer" }}>
                  View cart
                </button>
                <button onClick={() => setJustAdded(false)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>
                  Continue shopping
                </button>
              </div>
            </div>
          )}

          {/* Optional: show size chart link */}
          {showChart ? (
            <div style={{ marginTop: 14 }}>
              <button onClick={() => setChartOpen(true)} style={{ background: "transparent", border: "none", color: "#0070f3", cursor: "pointer", padding: 0 }}>
                View size chart
              </button>
            </div>
          ) : null}

        </div>
      </main>

      <SizeChartModal
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        imageUrl={chartImageUrl}
        title={(product.sizeChart && product.sizeChart.chartName) ? product.sizeChart.chartName : "Size chart"}
      />
    </div>
  );
}
