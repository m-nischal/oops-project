// src/pages/login.js
import { useState, useEffect } from "react";
import { redirectIfLoggedIn } from "../utils/redirectByRole";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Redirect if already logged in (run only on client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      redirectIfLoggedIn();
    }
  }, []);

  function isProbablyEmail(value) {
    return typeof value === "string" && value.includes("@") && value.indexOf("@") > 0;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!isProbablyEmail(trimmedEmail)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setMessage("Please enter your password.");
      return;
    }

    const body = {
      email: trimmedEmail,
      password,
    };

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      // Save token
      localStorage.setItem("token", data.token);

      // Redirect by role
      try {
        const payload = JSON.parse(atob(data.token.split(".")[1]));
        if (payload.role === "RETAILER") window.location.href = "/retailer/dashboard";
        else if (payload.role === "WHOLESALER") window.location.href = "/wholesaler/dashboard";
        else window.location.href = "/customer/home";
      } catch (err) {
        // fallback redirect
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", marginBottom: "10px", width: "250px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", marginBottom: "10px", width: "250px" }}
        />

        <button type="submit">Login</button>

        {/* Always-visible forgot-password link (placed under the button) */}
        <div style={{ marginTop: "10px" }}>
          <a href="/forgot-password" style={{ color: "blue" }}>
            Forgot Password? Reset using email OTP
          </a>
        </div>
      </form>

      {message && <div style={{ color: "red", marginTop: "10px" }}>{message}</div>}

      <hr />

      <h3>Or login with Google</h3>
      <a href="/api/auth/signin">Sign in with Google</a>
    </div>
  );
}
