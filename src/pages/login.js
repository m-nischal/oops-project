// src/pages/login.js
import { useState } from "react";
import { redirectByRole } from "../utils/redirectByRole";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function isEmail(value) {
    return typeof value === "string" && value.includes("@") && value.indexOf("@") > 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const trimmedEmail = email.trim().toLowerCase();
    if (!isEmail(trimmedEmail)) {
      setMessage("Please enter a valid email.");
      setLoading(false);
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      setLoading(false);
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
        setLoading(false);
        return;
      }

      // Legacy token storage
      if (data.token) {
        try { localStorage.setItem("token", data.token); } catch (_) {}
      }

      // SUCCESS: Redirect based on role
      if (data.user) {
        redirectByRole(data.user);
      } else {
        window.location.href = "/";
      }

    } catch (err) {
      console.error("Login error:", err);
      setMessage("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 10 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8 }}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8 }}
            required
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={{ marginTop: 10 }}>
          <a href="/forgot-password">Forgot password?</a>
        </div>
      </form>

      {message && <div style={{ color: "red", marginTop: 10 }}>{message}</div>}
    </div>
  );
}