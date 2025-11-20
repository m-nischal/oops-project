// src/pages/order/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Header from "components/Header";

export default function OrderPage(){
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        // Support both { order } and direct order responses
        const payload = data && data.order ? data.order : data;
        setOrder(payload);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!order && loading) return <>
    <Header />
    <div style={{ padding:20 }}>Loading order…</div>
  </>;

  if (!order && !loading) return <>
    <Header />
    <div style={{ padding:20 }}>Order not found.</div>
  </>;

  function formatDate(d) {
    if (!d) return "—";
    try { return new Date(d).toLocaleString(); } catch(e) { return d; }
  }

  return (
    <div>
      <Header />
      <main style={{ padding:20 }}>
        <h2>Order {order._id}</h2>
        <div>Status: <strong>{order.status}</strong></div>

        {order.estimatedDelivery && (
          <div style={{ marginTop:8 }}>
            Estimated delivery: <strong>{formatDate(order.estimatedDelivery)}</strong>
          </div>
        )}

        <div style={{ marginTop:12 }}>
          <h3>Timeline</h3>
          <ol>
            {Array.isArray(order.statusHistory) && order.statusHistory.length > 0
              ? order.statusHistory.map((h, i) => (
                  <li key={i}>
                    <strong>{h.status}</strong> — {formatDate(h.at)} {h.note ? ` — ${h.note}` : null}
                  </li>
                ))
              : <li>No history yet</li>
            }
          </ol>
        </div>

        <div style={{ marginTop:12 }}>
          <h3>Items</h3>
          {order.items.map((it, idx) => (
            <div key={idx} style={{ borderBottom:"1px solid #eee", padding:"8px 0" }}>
              <div>{it.name} — {it.sizeLabel} — qty: {it.qty} — ₹{it.unitPrice}</div>
              {it.estimatedDelivery && (
                <div style={{ fontSize: 13, color: "#555" }}>
                  ETA (item): {formatDate(it.estimatedDelivery)}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop:12 }}>
          <div>Subtotal: ₹{order.subtotal}</div>
          <div>Total: ₹{order.total}</div>
        </div>
      </main>
    </div>
  );
}
