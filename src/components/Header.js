// src/components/Header.js
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem("lm_cart") || "[]");
      setCount(cart.reduce((s, i) => s + (i.qty||0), 0));
    } catch (e) { setCount(0); }
    const onStorage = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("lm_cart") || "[]");
        setCount(cart.reduce((s, i) => s + (i.qty||0), 0));
      } catch (e) {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header style={{ display:"flex", justifyContent:"space-between", padding:"1rem", borderBottom:"1px solid #eee" }}>
      <div>
        <Link href="/" style={{ fontWeight:700, fontSize:18 }}>LiveMart (dev)</Link>
      </div>
      <nav>
        <Link href="/cart">Cart ({count})</Link>
      </nav>
    </header>
  );
}
