// src/pages/index.js
import { useEffect, useState } from "react";
import Header from "components/Header";
import ProductCard from "components/ProductCard";
import { redirectIfLoggedIn } from "../utils/redirectByRole"; // added by vamsi

export default function Home() {
  // redirect helper (if already logged-in this will navigate away)
  useEffect(() => {
    redirectIfLoggedIn();
  }, []);

  // products / search state
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function load(qstr = "") {
    setLoading(true);
    try {
      const url = `/api/products?q=${encodeURIComponent(qstr)}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();
      // normalize items shape and unwrap product wrapper if present
      const items = (data.items || data.products || data || []).map(p =>
        p && p.product ? p.product : p
      );
      setProducts(items);
    } catch (e) {
      console.error("Failed to load products:", e);
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <Header />
      <main style={{ padding: 20 }}>
        {/* If redirect runs it will navigate away; while on this page show register/login links */}
        <div style={{ marginBottom: 12 }}>
          Welcome to LiveMart.{" "}
          
          <a href="/register">Sign up</a> / <a href="/login">Login</a>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
          />
          <button onClick={() => load(q)} style={{ marginLeft: 8 }}>
            Search
          </button>
        </div>

        {loading ? <div>Loading products…</div> : null}

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {products.map((p) => (
            <ProductCard key={p._id || p.id} product={p} />
          ))}
        </div>
      </main>
    </div>
  );
}
