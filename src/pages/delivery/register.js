import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function DeliveryRegisterPage() {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  // UI State
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Request OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Force role to DELIVERY here 👇
        body: JSON.stringify({ email: email.trim().toLowerCase(), role: "DELIVERY" }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 2. Verify OTP & Register
  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          password,
          role: "DELIVERY" // Ensure backend knows the intent
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      // Success!
      if (data.token) localStorage.setItem("token", data.token);
      
      // Redirect to Delivery Dashboard
      router.push("/delivery/assigned");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Partner Registration</h1>
          <p className="text-sm text-gray-500 mt-1">Join our delivery fleet today</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
            {error}
          </div>
        )}

        {!otpSent ? (
          /* --- STEP 1: DETAILS FORM --- */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-gray-700">Full Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
                placeholder="John Doe"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
                placeholder="you@company.com"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Create Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400"
                placeholder="••••••••"
                minLength={6}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-black text-white font-medium disabled:opacity-60 hover:bg-gray-800 transition-colors"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          /* --- STEP 2: VERIFY OTP FORM --- */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-700 mb-4 text-center border border-blue-100">
              We sent a 6-digit code to <strong>{email}</strong>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-gray-700">Enter OTP</span>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="mt-1 block w-full rounded-xl border px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-300"
                placeholder="000000"
              />
            </label>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full mt-2 py-3 rounded-xl bg-green-600 text-white font-medium disabled:opacity-60 hover:bg-green-700 transition-colors"
            >
              {loading ? "Verifying..." : "Verify & Register"}
            </button>

            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Back / Resend Code
            </button>
          </form>
        )}

        <div className="text-center mt-6 text-sm text-gray-500">
          Already a partner?{' '}
          <Link href="/delivery/login" className="font-bold text-black hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}