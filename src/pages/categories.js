// src/pages/categories.js
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CategoriesPage() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/categories?parentId=null");
        const data = await res.json();
        setCats(data || []);
      } catch (e) {
        console.error("Failed to load categories", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>LiveMart — Categories</h1>
        <Link href="/cart">Cart</Link>
      </header>

      <p style={{ color: "#666" }}>Top-level categories (click to browse):</p>

      {loading ? <p>Loading…</p> : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {cats.map(c => (
            <li key={c._id} style={{ marginBottom: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      <Link href={`/products?categoryId=${c._id}`}>{c.name}</Link>
                    </div>
                    <div style={{ color: "#666", fontSize: 13 }}>{c.path}</div>
                  </div>
                  <div>
                    <Link href={`/products?categoryId=${c._id}`}>View items →</Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
