// /mnt/data/oops-project/src/pages/delivery/login.js
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

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
      if (role === "DELIVERY") {
        router.replace("/delivery/assigned");
      } else {
        setError("This account is not a Delivery Partner.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Delivery Partner Login</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to view and manage your assigned deliveries</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4" aria-label="Delivery login form">
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="you@company.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-700">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full rounded-xl border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div role="alert" className="text-sm text-red-600 mt-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-black text-white font-medium disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/delivery/register" className="font-bold text-black hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
