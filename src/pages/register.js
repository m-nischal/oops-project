import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { redirectIfLoggedIn, redirectByRole } from "../utils/redirectByRole";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Store,
  Truck,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState(new Array(6).fill(""));

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpInputRefs = useRef([]);

  useEffect(() => {
    redirectIfLoggedIn();
  }, []);

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPassword(value) {
    const hasLength = value.length >= 8;
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasLength && hasNumber && hasSpecial;
  }

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    if (pastedData.every((char) => !isNaN(char))) {
      const newOtp = [...otp];
      pastedData.forEach((val, i) => {
        if (i < 6) newOtp[i] = val;
      });
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      if (otpInputRefs.current[focusIndex]) {
        otpInputRefs.current[focusIndex].focus();
      }
    }
  };

  async function handleSendOtp() {
    setMessage("");
    if (!name) {
      setMessage("Please enter your name first.");
      return;
    }
    if (!isValidEmail(email.trim().toLowerCase())) {
      setMessage(
        "Please enter a valid email address (must contain '@' and '.')."
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          name, // FIX: Sending name here
          isRegister: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.message || "Failed to send OTP");
      } else {
        setOtpSent(true);
        setMessage("");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setMessage("Network error while sending OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const code = otp.join("");

    if (!isValidEmail(trimmedEmail) || code.length !== 6) {
      setMessage("Please enter a valid email and complete the OTP.");
      return;
    }

    if (!isValidPassword(password)) {
      setMessage(
        "Password must be at least 8 characters, with a number and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: trimmedEmail,
          otp: code,
          purpose: "register",
          password: password,
        }),
      });

      const verifyData = await verifyRes.json().catch(() => null);

      if (!verifyData || !verifyData.ok) {
        setMessage(verifyData?.message || "Invalid OTP or verification failed");
        setLoading(false);
        return;
      }

      if (verifyData.token) {
        try {
          localStorage.setItem("token", verifyData.token);
        } catch (_) {}
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("location_prompt_shown");
      }

      try {
        const payload = JSON.parse(atob(verifyData.token.split(".")[1]));
        const userRole = (payload.role || "CUSTOMER").toUpperCase();

        if (userRole === "RETAILER" || userRole === "WHOLESALER") {
          router.push("/profile?setup=true");
        } else {
          redirectByRole({ role: userRole });
        }
      } catch (err) {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Verify/register error:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const RoleCard = ({ value, label, icon: Icon }) => (
    <div
      onClick={() => !otpSent && setRole(value)}
      className={`relative cursor-pointer rounded-xl border p-3 flex flex-col items-center justify-center text-center gap-2 transition-all ${
        role === value
          ? "border-black bg-black text-white shadow-md scale-[1.02]"
          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50"
      } ${otpSent ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <Icon className="w-6 h-6" />
      <div className="text-xs font-bold uppercase">{label}</div>
    </div>
  );

  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;
  const passwordValid = isValidPassword(password);

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-gray-100">
      <div className="w-full max-w-[480px] bg-white/70 backdrop-blur-2xl p-8 rounded-[32px] shadow-xl border border-white/50">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm">
            Join LiveMart to start your journey
          </p>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <RoleCard value="CUSTOMER" label="Customer" icon={User} />
            <RoleCard value="RETAILER" label="Retailer" icon={Store} />
            <RoleCard value="WHOLESALER" label="Wholesaler" icon={Truck} />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                disabled={otpSent}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                disabled={otpSent}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          {!otpSent ? (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Verify Email"}
              {!loading && <ArrowRight size={20} />}
            </button>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  OTP sent to <strong>{email}</strong>.
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="ml-1 underline font-semibold hover:text-blue-900"
                  >
                    Change?
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Enter 6-Digit Code
                </label>
                <div className="flex gap-2 justify-between">
                  {otp.map((data, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={handleOtpPaste}
                      className="w-full h-12 text-center rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all placeholder:tracking-normal placeholder:text-gray-300 font-mono"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create Password"
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

                {password && !passwordValid && (
                  <p className="text-[10px] text-gray-500 pl-1">
                    Must be 8+ chars, with a number & special character.
                  </p>
                )}

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter Password"
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-white border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      confirmPassword && !passwordsMatch
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-black focus:ring-black/10"
                    }`}
                  />
                </div>

                {password && confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500 font-medium ml-1">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !passwordsMatch ||
                  !passwordValid ||
                  otp.join("").length !== 6
                }
                className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Complete Registration"
                )}
              </button>
            </div>
          )}

          {message && (
            <div className="text-center text-red-600 text-sm font-medium bg-red-50 p-3 rounded-xl">
              {message}
            </div>
          )}
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white/50 px-4 text-gray-400 font-medium">
              Or sign up with
            </span>
          </div>
        </div>

        <button
          onClick={() =>
            signIn("google", { callbackUrl: "/auth/oauth-bridge" })
          }
          className="w-full h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-300 transition-all group"
        >
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          <span className="font-semibold text-gray-700">Google</span>
        </button>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-black hover:underline"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
