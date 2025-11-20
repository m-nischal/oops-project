// src/pages/checkout.js
import { useEffect, useState } from "react";
import Header from "components/Header";
import { useRouter } from "next/router";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(()=> {
    setCart(JSON.parse(localStorage.getItem("lm_cart") || "[]"));
  }, []);

  async function placeOrder() {
    if (!name) return alert("Enter name");
    if (cart.length === 0) return alert("Cart empty");

    const items = cart.map(i => ({ productId: i.productId, sizeLabel: i.sizeLabel, qty: i.qty }));
    const customer = { name, address, phone };

    setLoading(true);
    try {
      // 1) (dev) optionally simulate payment by calling mock charge
      // compute amount as subtotal
      const amount = cart.reduce((s,i)=> s + (i.unitPrice||0)*(i.qty||0), 0);
      const payRes = await fetch("/api/payments/mock/charge", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ amount })
      });
      if (!payRes.ok) {
        throw new Error("Payment failed");
      }
      const payData = await payRes.json();
      // payData.paymentId is returned by mock charge. Use it as payment metadata.

      // 2) create order
      const res = await fetch("/api/orders", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ customer, items })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Order creation failed");
      }
      const order = await res.json();

      // 3) clear cart and navigate to order page
      localStorage.removeItem("lm_cart");
      window.dispatchEvent(new Event("storage"));
      router.push(`/order/${order._id}`);
    } catch (e) {
      alert("Checkout failed: " + (e.message || e));
      console.error(e);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <Header />
      <main style={{ padding:20 }}>
        <h2>Checkout</h2>

        <div style={{ maxWidth:600 }}>
          <div style={{ marginBottom:8 }}>
            <label>Name</label><br />
            <input value={name} onChange={(e)=>setName(e.target.value)} style={{ width:"100%" }} />
          </div>

          <div style={{ marginBottom:8 }}>
            <label>Address</label><br />
            <textarea value={address} onChange={(e)=>setAddress(e.target.value)} style={{ width:"100%" }} />
          </div>

          <div style={{ marginBottom:8 }}>
            <label>Phone</label><br />
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} style={{ width:"100%" }} />
          </div>

          <div style={{ marginTop:12 }}>
            <div>Items: {cart.length}</div>
            <button onClick={placeOrder} disabled={loading} style={{ marginTop:10 }}>
              {loading ? "Placing order…" : "Place order"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
