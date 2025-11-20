// src/pages/delivery/login.js
import { useState } from "react";
import { useRouter } from "next/router";

export default function DeliveryLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }
      // preserve legacy token if returned
      if (data.token) try { localStorage.setItem("token", data.token); } catch (_) {}
      // get role from token or user object
      let role = null;
      if (data.token) {
        try {
          const payload = JSON.parse(atob(data.token.split(".")[1]));
          role = (payload.role || "").toUpperCase();
        } catch (e) {}
      }
      if (!role && data.user?.role) role = data.user.role.toUpperCase();
      if (role === "DELIVERY") router.replace("/delivery/assigned");
      else setError("This account is not a Delivery Partner.");
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Delivery Partner Login</h2>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" required />
        <input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" type="password" required />
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>{loading ? "Signing in…" : "Login"}</button>
      </form>
    </div>
  );
}
