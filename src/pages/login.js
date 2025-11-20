// src/pages/login.js
import { useState, useEffect } from "react";
import { redirectIfLoggedIn } from "../utils/redirectByRole";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Redirect if already logged in (client-only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      redirectIfLoggedIn();
    }
  }, []);

  function isEmail(value) {
    return typeof value === "string" && value.includes("@") && value.indexOf("@") > 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!isEmail(trimmedEmail)) {
      setMessage("Please enter a valid email.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // store httpOnly cookie
        body: JSON.stringify({ email: trimmedEmail, password })
      });

      const data = await res.json();

      if (!data.ok) {
        setMessage(data.message || "Invalid login");
        return;
      }

      // legacy storage — optional
      if (data.token) {
        try { localStorage.setItem("token", data.token); } catch (_) {}
      }

      // Determine role
      let role = null;

      // From token payload
      if (data.token) {
        try {
          const payload = JSON.parse(atob(data.token.split(".")[1]));
          role = payload.role?.toUpperCase();
        } catch (_) {}
      }

      // fallback
      if (!role && data.user?.role) role = data.user.role.toUpperCase();

      // redirect by role
      if (role === "RETAILER") window.location.href = "/retailer/dashboard";
      else if (role === "WHOLESALER") window.location.href = "/wholesaler/dashboard";
      else if (role === "DELIVERY") window.location.href = "/delivery/assigned";
      else window.location.href = "/customer/home";

    } catch (err) {
      console.error("Login error:", err);
      setMessage("Network error — please try again.");
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", marginBottom: 10 }}
        />

        <button type="submit">Login</button>

        <div style={{ marginTop: 10 }}>
          <a href="/forgot-password">Forgot password?</a>
        </div>
      </form>

      {message && <div style={{ color: "red", marginTop: 10 }}>{message}</div>}
    </div>
  );
}