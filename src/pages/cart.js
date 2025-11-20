// src/pages/cart.js
import { useEffect, useState } from "react";
import Link from "next/link";

function loadCart() {
  try { return JSON.parse(localStorage.getItem("livemart_cart") || "[]"); } catch (e) { return []; }
}
function saveCart(cart) { localStorage.setItem("livemart_cart", JSON.stringify(cart)); }

function sizeLabelOf(s) {
  if (!s) return "";
  return typeof s.size !== "undefined" ? String(s.size) : (typeof s.label !== "undefined" ? String(s.label) : "");
}

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => { setCart(loadCart()); }, []);

  // Update quantity for the item at index (newQty: integer)
  async function updateQty(index, newQty) {
    newQty = Math.max(1, Number(newQty) || 1);
    const current = [...cart];
    const item = current[index];
    if (!item) return;

    try {
      // fetch latest product to verify stock
      const res = await fetch(`/api/products/${item.productId}`);
      if (!res.ok) {
        alert("Failed to verify stock. Try again.");
        return;
      }
      const json = await res.json();
      const latest = json && json.product ? json.product : json;

      if (item.size) {
        const sizeObj = (latest.sizes || []).find(s => sizeLabelOf(s) === item.size);
        const avail = sizeObj ? Number(sizeObj.stock || 0) : 0;
        if (newQty > avail) {
          alert(`Maximum available units for "${item.name}" (size ${item.size}) is ${avail}.`);
          return; // do not update qty
        }
      } else {
        if (typeof latest.totalStock === "number") {
          const avail = Number(latest.totalStock || 0);
          if (newQty > avail) {
            alert(`Maximum available units for "${item.name}" is ${avail}.`);
            return;
          }
        }
      }

      current[index].qty = newQty;
      setCart(current);
      saveCart(current);
    } catch (err) {
      console.error(err);
      alert("Could not verify stock. Try again.");
    }
  }

  function incrementItem(index) {
    const current = [...cart];
    const it = current[index];
    if (!it) return;
    updateQty(index, Number(it.qty || 1) + 1);
  }

  function decrementItem(index) {
    const current = [...cart];
    const it = current[index];
    if (!it) return;
    updateQty(index, Math.max(1, Number(it.qty || 1) - 1));
  }

  function removeItem(index) {
    const c = [...cart];
    c.splice(index, 1);
    setCart(c);
    saveCart(c);
  }

  const total = cart.reduce((s, it) => s + (Number(it.price || 0) * Number(it.qty || 1)), 0);

  async function placeOrder(e) {
    e.preventDefault();
    if (!name || !phone || !address) {
      setMessage({ type: "error", text: "Please fill name, phone and address." });
      return;
    }
    if (!cart.length) {
      setMessage({ type: "error", text: "Cart is empty." });
      return;
    }

    setPlacing(true);
    setMessage(null);
    try {
      // server pre-check (simple approach)
      const resAll = await fetch(`/api/products?limit=500`);
      const jsonAll = await resAll.json();
      const itemsList = jsonAll.items || jsonAll.products || jsonAll;
      const map = {};
      (itemsList || []).forEach(p => { map[p._id] = p; });

      const problems = [];
      for (const c of cart) {
        const p = map[c.productId];
        if (!p) { problems.push({ name: c.name, reason: "Not found" }); continue; }
        if (c.size) {
          const sizeObj = (p.sizes || []).find(s => sizeLabelOf(s) === c.size);
          const avail = sizeObj ? Number(sizeObj.stock || 0) : 0;
          if (avail < c.qty) problems.push({ name: c.name, size: c.size, available: avail, requested: c.qty });
        } else {
          if (typeof p.totalStock === "number") {
            if (p.totalStock < c.qty) problems.push({ name: c.name, available: p.totalStock, requested: c.qty });
          }
        }
      }

      if (problems.length) {
        setMessage({ type: "error", text: "Some items are out of stock. Please review your cart." });
        console.log("Stock problems:", problems);
        setPlacing(false);
        return;
      }

      const payload = {
        customer: { name, phone, address },
        items: cart.map(i => ({ productId: i.productId, qty: i.qty, price: i.price, size: i.size, name: i.name })),
        total
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({ message: "Order failed" }));
        setMessage({ type: "error", text: `Server rejected order: ${errJson.message || "Unknown"}` });
        setPlacing(false);
        return;
      }

      const orderJson = await orderRes.json();
      localStorage.removeItem("livemart_cart");
      setCart([]);
      setMessage({ type: "success", text: `Order placed. Order id: ${orderJson.orderId || orderJson._id || "unknown"}` });
    } catch (err) {
      console.error("Order error:", err);
      setMessage({ type: "error", text: "Failed to place order. Try again." });
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Cart</h1>
        <Link href="/categories">Back to categories</Link>
      </header>

      <section style={{ marginTop: 16 }}>
        {cart.length === 0 ? <p>Your cart is empty.</p> : (
          <div>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {cart.map((it, idx) => (
                <li key={`${it.productId}-${it.size || ""}`} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 8, border: "1px solid #eee", marginBottom: 10 }}>
                  <img src={it.image || "/images/placeholder.png"} alt={it.name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{it.name}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>{it.size ? `Size: ${it.size}` : null}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
                        <button onClick={() => decrementItem(idx)} aria-label={`Decrease qty for ${it.name}`} style={{ padding: "8px 10px", border: "none", background: "#fff", cursor: "pointer" }}>−</button>
                        <div style={{ minWidth: 56, textAlign: "center", padding: "8px 6px", fontWeight: 600 }}>{it.qty}</div>
                        <button onClick={() => incrementItem(idx)} aria-label={`Increase qty for ${it.name}`} style={{ padding: "8px 10px", border: "none", background: "#fff", cursor: "pointer" }}>+</button>
                      </div>

                      <button onClick={() => removeItem(idx)} style={{ marginLeft: 8 }}>Remove</button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700 }}>₹{(it.price || 0).toLocaleString("en-IN")}</div>
                    <div style={{ color: "#666", fontSize: 13 }}>Subtotal: ₹{((it.price||0) * (it.qty||1)).toLocaleString("en-IN")}</div>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ fontWeight: 700, marginBottom: 12 }}>Total: ₹{Number(total).toLocaleString("en-IN")}</div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Checkout</h2>
        {message && <div style={{ marginBottom: 12, color: message.type === "error" ? "crimson" : "green" }}>{message.text}</div>}
        <form onSubmit={placeOrder} style={{ maxWidth: 680 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 14 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 14 }}>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={{ width: "100%", padding: 8, borderRadius: 6 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 14 }}>Address</label>
            <textarea value={address} onChange={e => setAddress(e.target.value)} rows={4} style={{ width: "100%", padding: 8, borderRadius: 6 }} />
          </div>

          <div>
            <button type="submit" disabled={placing} style={{ padding: "10px 14px", borderRadius: 8, background: "#0070f3", color: "#fff", border: "none" }}>
              {placing ? "Placing order…" : "Place order"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
