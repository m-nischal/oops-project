import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function DeliveryLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      
      if (role === "DELIVERY") {
        router.replace("/delivery/assigned");
      } else {
        setError("This account is not a Delivery Partner.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-gray-100">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl p-8 rounded-[32px] shadow-xl border border-white/50">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">
            Partner Login
          </h1>
          <p className="text-gray-500 text-sm">Sign in to manage your deliveries</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                autoComplete="email"
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
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link href="/delivery/register" className="font-bold text-black hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}