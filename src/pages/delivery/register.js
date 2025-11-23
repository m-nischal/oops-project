import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { User, Mail, Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function DeliveryRegisterPage() {
  const router = useRouter();
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-gray-100">
      <div className="w-full max-w-[480px] bg-white/70 backdrop-blur-2xl p-8 rounded-[32px] shadow-xl border border-white/50">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">
            Partner Registration
          </h1>
          <p className="text-gray-500 text-sm">Join our delivery fleet today</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium text-center rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {!otpSent ? (
          /* --- STEP 1: DETAILS FORM --- */
          <form onSubmit={handleSendOtp} className="space-y-5">
            
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Send Verification Code"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        ) : (
          /* --- STEP 2: VERIFY OTP FORM --- */
          <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm flex items-start gap-3 border border-blue-100">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                We sent a 6-digit code to <strong>{email}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Enter OTP</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                placeholder="000000"
                className="w-full h-14 text-center rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:tracking-normal placeholder:text-gray-300 font-mono"
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Verify & Register"}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Back / Resend Code
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Already a partner?{' '}
            <Link href="/delivery/login" className="font-bold text-black hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}