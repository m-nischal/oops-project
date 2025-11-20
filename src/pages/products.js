// src/pages/products.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

function formatPrice(p) {
  if (typeof p !== "number") return p;
  return `₹${p.toLocaleString("en-IN")}`;
}

export default function ProductsPage() {
  const router = useRouter();
  const { categoryId, q } = router.query;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const qparams = new URLSearchParams();
        if (categoryId) qparams.set("categoryId", categoryId);
        if (q) qparams.set("q", q);
        qparams.set("limit", "48");
        const res = await fetch(`/api/products?${qparams.toString()}`);
        const json = await res.json();
        // API may return { items: [...] } or raw array
        const list = json.items || json.products || json || [];
        // if items contain wrappers (e.g. { product: {...} }) normalize:
        const normalized = list.map(p => (p && p.product) ? p.product : p);
        setItems(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categoryId, q]);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>
          <Link href="/categories">Categories</Link> / Products
        </h1>
        <Link href="/cart">Cart</Link>
      </header>

      <div style={{ marginTop: 12 }}>
        {categoryId && <div style={{ color: "#444", marginBottom: 8 }}>Filtering by category: <strong>{categoryId}</strong></div>}
        {loading ? <p>Loading products…</p> : (
          items.length === 0 ? <p>No products found.</p> : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {items.map(p => (
                <Link
                  key={p._id}
                  href={`/product/${p._id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit"
                  }}
                >
                  <article
                    style={{
                      border: "1px solid #eee",
                      padding: 12,
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "transform 120ms ease, box-shadow 120ms ease",
                      background: "#fff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%"
                    }}
                    onMouseEnter={(ev) => {
                      ev.currentTarget.style.transform = "translateY(-4px)";
                      ev.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
                    }}
                    onMouseLeave={(ev) => {
                      ev.currentTarget.style.transform = "translateY(0)";
                      ev.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div>
                      <div style={{
                        height: 140,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fafafa",
                        borderRadius: 6
                      }}>
                        <img
                          src={p.images && p.images[0] ? p.images[0] : "/images/placeholder.png"}
                          alt={p.name}
                          style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                        />
                      </div>
                      <h3 style={{ margin: "6px 0", fontSize: 16, lineHeight: "1.2em" }}>{p.name}</h3>
                      <div style={{ color: "#666", fontSize: 14, marginBottom: 6 }}>
                        {p.description ? (p.description.slice(0, 80) + (p.description.length > 80 ? "…" : "")) : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <div style={{ fontWeight: 700 }}>{formatPrice(p.price)}</div>
                      <span style={{ fontSize: 13, color: "#0070f3" }}>View →</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
