// src/pages/register.js
import { useState, useEffect } from "react";
import { redirectIfLoggedIn } from "../utils/redirectByRole";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("RETAILER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") redirectIfLoggedIn();
  }, []);

  function isProbablyEmail(value) {
    return typeof value === "string" && value.includes("@") && value.indexOf("@") > 0;
  }

  // SEND OTP (only email + role) — button must be type="button"
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
        setMessage("OTP sent. Check your email (or server console in dev).");
        // you can show the OTP input now
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setMessage("Network error while sending OTP.");
    } finally {
      setLoading(false);
    }
  }

  // VERIFY OTP (send email + otp); on success, finish registration by posting password
  // replace existing handleVerifyOtp in src/pages/register.js with this
async function handleVerifyOtp(e) {
  e.preventDefault(); // form submission for final registration
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
    // send otp + password together to verify endpoint (server should set password and return token)
    const verifyRes = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmedEmail,
        // backend accepts either `otp` or `code` — here we send `otp`
        otp: code,
        purpose: "register",
        password: password
      }),
    });

    const verifyData = await verifyRes.json().catch(() => null);

    if (!verifyData) {
      setMessage("Server returned an invalid response during OTP verify.");
      setLoading(false);
      return;
    }

    if (!verifyRes.ok || !verifyData.ok) {
      setMessage(verifyData.message || "Invalid OTP or verification failed");
      setLoading(false);
      return;
    }

    // SUCCESS: If backend returns a token, save it and redirect
    if (verifyData.token) {
      try {
        localStorage.setItem("token", verifyData.token);
        localStorage.removeItem("guest_browsing");
      } catch (e) {
        // ignore localStorage errors
      }

      try {
        const payload = JSON.parse(atob(verifyData.token.split(".")[1]));
        if (payload.role === "RETAILER") window.location.href = "/retailer/dashboard";
        else if (payload.role === "WHOLESALER") window.location.href = "/wholesaler/dashboard";
        else window.location.href = "/customer/home";
        return;
      } catch (err) {
        // fallback
        window.location.href = "/";
        return;
      }
    }

    // fallback success message
    setMessage("Registration complete. Please login.");
  } catch (err) {
    console.error("Verify/register error:", err);
    setMessage("Network/server error. Try again.");
  } finally {
    setLoading(false);
  }
}


  return (
    <div style={{ padding: 20 }}>
      <h2>Register / Sign up</h2>

      <form onSubmit={handleVerifyOtp}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ display: "block", width: 300 }} />
        </label>

        <div style={{ marginTop: 8 }}>
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
            style={{ display: "block", width: 300 }}
            required
          />
        </label>

        <label style={{ display: "block", marginTop: 10 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: 300 }}
            required
          />
        </label>

        {/* IMPORTANT: Send OTP is type="button" so it doesn't submit the form */}
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={handleSendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
          <span style={{ marginLeft: 8, color: "#777" }}>use email to receive otp</span>
        </div>

        {/* OTP input shown once user requested it (optional) */}
        {otpSent && (
          <div style={{ marginTop: 12 }}>
            <label>
              Enter OTP
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ display: "block", width: 200 }}
                placeholder="6-digit OTP"
              />
            </label>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP & Finish Registration"}
          </button>
        </div>
      </form>

      {message && <div style={{ color: "red", marginTop: 12 }}>{message}</div>}
    </div>
  );
}
