// src/pages/register.js
import { useState, useEffect } from "react";
import { redirectIfLoggedIn, redirectByRole } from "../utils/redirectByRole";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    redirectIfLoggedIn();
  }, []);

  function isProbablyEmail(value) {
    return typeof value === "string" && value.includes("@") && value.indexOf("@") > 0;
  }

  // SEND OTP
  async function handleSendOtp() {
    setMessage("");
    if (!isProbablyEmail(email.trim().toLowerCase())) {
      setMessage("Please enter a valid email to receive OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.message || "Failed to send OTP");
      } else {
        setOtpSent(true);
        setMessage("OTP sent. Check your email.");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setMessage("Network error while sending OTP.");
    } finally {
      setLoading(false);
    }
  }

  // VERIFY OTP & REGISTER
  async function handleVerifyOtp(e) {
    e.preventDefault(); 
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const code = String(otp || "").trim();

    if (!isProbablyEmail(trimmedEmail) || !code) {
      setMessage("Email and OTP required");
      return;
    }
    if (!password || password.length < 6) {
      setMessage("Please enter a password (min 6 chars) to finish registration.");
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Important: 'credentials: include' ensures the new session cookie is saved by the browser
        credentials: "include", 
        body: JSON.stringify({
          email: trimmedEmail,
          otp: code,
          purpose: "register",
          password: password
        }),
      });

      const verifyData = await verifyRes.json().catch(() => null);

      if (!verifyData || !verifyData.ok) {
        setMessage(verifyData?.message || "Invalid OTP or verification failed");
        setLoading(false);
        return;
      }

      // Legacy support
      if (verifyData.token) {
        try { localStorage.setItem("token", verifyData.token); } catch (_) {}
      }

      // Clear prompt so the new user gets asked for location
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem("location_prompt_shown");
      }

      // Redirect
      try {
        const payload = JSON.parse(atob(verifyData.token.split(".")[1]));
        const userObj = { role: payload.role || "CUSTOMER" };
        redirectByRole(userObj);
        return;
      } catch (err) {
        window.location.href = "/";
        return;
      }

    } catch (err) {
      console.error("Verify/register error:", err);
      setMessage("Network/server error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: "0 auto" }}>
      <h2>Register / Sign up</h2>

      <form onSubmit={handleVerifyOtp}>
        <label style={{ display: "block", marginTop: 10 }}>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ display: "block", width: "100%", padding: 8 }} />
        </label>

        <div style={{ marginTop: 15, marginBottom: 15 }}>
          <span style={{ marginRight: 10 }}>I am a:</span>
          <label>
            <input type="radio" checked={role === "CUSTOMER"} onChange={() => setRole("CUSTOMER")} /> Customer
          </label>
          <label style={{ marginLeft: 12 }}>
            <input type="radio" checked={role === "RETAILER"} onChange={() => setRole("RETAILER")} /> Retailer
          </label>
          <label style={{ marginLeft: 12 }}>
            <input type="radio" checked={role === "WHOLESALER"} onChange={() => setRole("WHOLESALER")} /> Wholesaler
          </label>
        </div>

        <label style={{ display: "block", marginTop: 10 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8 }}
            required
          />
        </label>

        <label style={{ display: "block", marginTop: 10 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8 }}
            required
          />
        </label>

        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={handleSendOtp} disabled={loading || otpSent}>
            {loading && !otpSent ? "Sending..." : (otpSent ? "OTP Sent" : "Send OTP")}
          </button>
          <span style={{ marginLeft: 8, color: "#777", fontSize: "0.9em" }}>
            {otpSent ? "Check your email" : "Click to verify email"}
          </span>
        </div>

        {otpSent && (
          <div style={{ marginTop: 12 }}>
            <label>
              Enter OTP
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ display: "block", width: "100%", padding: 8 }}
                placeholder="6-digit OTP"
                required
              />
            </label>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button type="submit" disabled={loading || !otpSent}>
            {loading ? "Verifying..." : "Register & Login"}
          </button>
        </div>
      </form>

      {message && <div style={{ color: "red", marginTop: 12 }}>{message}</div>}
    </div>
  );
}