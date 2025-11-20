// src/pages/forgot-password.js
import { useState } from "react";


export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pwMismatch, setPwMismatch] = useState(false);

  function checkConfirm(pw, conf) {
    // immediate character-by-character validation:
    setPwMismatch(conf.length > 0 && pw !== conf);
  }

  async function requestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message || (data.ok ? "OTP sent (if account exists)." : "Failed"));
      setStep(2);
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndSet(e) {
    e.preventDefault();
    if (pwMismatch) {
      setMessage("Confirm password does not match.");
      return;
    }
    if (!password || password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Password changed. Redirect to login.");
        // optionally redirect to login
        // router.push("/login");
      } else {
        setMessage(data.message || "Failed to set password");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "2rem auto", padding: 20 }}>
      <h2>Forgot password</h2>
      {step === 1 && (
        <form onSubmit={requestOtp}>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, margin: "8px 0" }}
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyAndSet}>
          <label>
            OTP (check your email)
            <input
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ display: "block", width: "100%", padding: 8, margin: "8px 0" }}
            />
          </label>

          <label>
            New password
            <input
              required
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkConfirm(e.target.value, confirm);
              }}
              style={{ display: "block", width: "100%", padding: 8, margin: "8px 0" }}
            />
          </label>

          <label>
            Confirm password
            <input
              required
              type="password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                checkConfirm(password, e.target.value);
              }}
              style={{ display: "block", width: "100%", padding: 8, margin: "8px 0" }}
            />
          </label>

          <div style={{ minHeight: 22 }}>
            {confirm.length > 0 ? (
              pwMismatch ? (
                <div style={{ color: "crimson" }}>Confirm password does not match</div>
              ) : (
                <div style={{ color: "green" }}>Passwords match</div>
              )
            ) : null}
          </div>

          <button disabled={loading} type="submit">{loading ? "Setting..." : "Set password"}</button>
        </form>
      )}

      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}
