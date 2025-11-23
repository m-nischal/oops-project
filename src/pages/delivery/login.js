import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle, X, Check } from "lucide-react";

// --- Password Validation Logic (Copied from settings/register for consistency) ---
const isValidNewPassword = (password) => {
    // 1. Minimum 8 characters
    const hasLength = password.length >= 8;
    // 2. At least one number
    const hasNumber = /\d/.test(password);
    // 3. At least one special character: @, !, or $
    const hasSpecial = /[@!$]/.test(password);
    return { hasLength, hasNumber, hasSpecial, isValid: hasLength && hasNumber && hasSpecial };
};

// --- Custom Password Input Component (Reused) ---
const PasswordInput = ({ id, value, onChange, placeholder, showToggle, setShowToggle, isInvalid }) => (
  <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        id={id}
        type={showToggle ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className={`w-full h-14 pl-12 pr-12 rounded-2xl bg-white border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all 
          ${isInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'}
        `}
      />
      <button
          type="button"
          onClick={() => setShowToggle(prev => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          tabIndex="-1"
      >
          {showToggle ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
  </div>
);


export default function DeliveryLoginPage() {
  const [step, setStep] = useState(1); // 1: Login, 2: Forgot/Request OTP, 3: Verify OTP + Reset Password, 4: Success
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const otpInputRefs = useRef([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // General success/info message
  
  const router = useRouter();

  // Derived State for Forgot Password flow
  const newPassValidation = useMemo(() => isValidNewPassword(newPassword), [newPassword]);
  const newPasswordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isResetFormValid = newPassword && confirmPassword && newPasswordsMatch && newPassValidation.isValid && otp.join("").length === 6;

  // --- LOGIN HANDLER ---
  async function handleDeliveryLogin(e) {
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
        return;
      }
      
      if (data.token) try { localStorage.setItem("token", data.token); } catch (_) {}
      
      let role = data.user?.role?.toUpperCase();
      if (data.token) {
        try {
          const payload = JSON.parse(atob(data.token.split(".")[1]));
          role = (payload.role || "").toUpperCase();
        } catch (e) {}
      }
      
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

  // --- FORGOT PASSWORD HANDLERS ---
  
  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: "DELIVERY" }), // Ensure we request for Delivery role if needed
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      
      setMessage("Verification code sent successfully.");
      setStep(3); // Move to Verify/Reset Step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleVerifyAndReset(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the complete OTP."); setLoading(false); return; }
    if (!isResetFormValid) { setError("Please resolve password requirements."); setLoading(false); return; }

    try {
      const res = await fetch("/api/auth/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, password: newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Password reset failed");
      
      setStep(4); // Success!
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- OTP HANDLERS (Reused from register/forgot-password) ---
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
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every(char => !isNaN(char))) {
        const newOtp = [...otp];
        pastedData.forEach((val, i) => { if (i < 6) newOtp[i] = val; });
        setOtp(newOtp);
        const focusIndex = Math.min(pastedData.length, 5);
        if (otpInputRefs.current[focusIndex]) otpInputRefs.current[focusIndex].focus();
    }
  };

  // --- UI RENDER LOGIC ---
  const renderForm = (currentStep) => {
    if (currentStep === 1) { // Default Login
      return (
        <form onSubmit={handleDeliveryLogin} className="space-y-5">
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
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              {/* FORGOT PASSWORD BUTTON (NEW) */}
              <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Forgot Password?
              </button>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>
      );
    }
    
    if (currentStep === 2) { // Forgot Password: Request Email
      return (
        <form onSubmit={handleRequestOtp} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Send Reset Code"}
            {!loading && <ArrowRight size={20} />}
          </button>
          
          <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-500 hover:text-black">
             Back to Login
          </button>
        </form>
      );
    }
    
    if (currentStep === 3) { // Verify OTP + Set New Password
      return (
        <form onSubmit={handleVerifyAndReset} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Enter 6-Digit Code</label>
            <div className="flex gap-2 justify-between">
              {otp.map((data, index) => (
                <input
                  key={index}
                  ref={el => otpInputRefs.current[index] = el}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={e => handleOtpChange(e.target, index)}
                  onKeyDown={e => handleOtpKeyDown(e, index)}
                  onPaste={handleOtpPaste}
                  className="w-full h-12 text-center rounded-xl bg-white border border-gray-200 text-gray-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            {/* New Password Input */}
            <PasswordInput
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                showToggle={showNewPassword}
                setShowToggle={setShowNewPassword}
                isInvalid={newPassword && !newPassValidation.isValid}
            />
            {/* Validation Hint */}
            <ul className="text-xs text-gray-500 space-y-0.5 ml-2 pt-1">
                <li className={`flex items-center ${newPassValidation.hasLength ? 'text-green-600' : 'text-red-500'}`}>
                    {newPassValidation.hasLength ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} 8+ characters
                </li>
                <li className={`flex items-center ${newPassValidation.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                    {newPassValidation.hasNumber ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} At least 1 number
                </li>
                <li className={`flex items-center ${newPassValidation.hasSpecial ? 'text-green-600' : 'text-red-500'}`}>
                    {newPassValidation.hasSpecial ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} Special char (@, !, $)
                </li>
            </ul>
          </div>
          
          {/* Confirm Password Input */}
          <div className="space-y-2">
            <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                showToggle={showConfirmPassword}
                setShowToggle={setShowConfirmPassword}
                isInvalid={confirmPassword && !newPasswordsMatch}
            />
            {confirmPassword && !newPasswordsMatch && (
                <p className="text-xs text-red-500 font-medium ml-1">Passwords do not match.</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !isResetFormValid}
            className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Reset Password"}
          </button>
          
          <button type="button" onClick={() => setStep(2)} className="w-full text-sm text-gray-500 hover:text-black">
             Resend Code
          </button>
        </form>
      );
    }
    
    if (currentStep === 4) { // Success
      return (
        <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600">
              Password updated successfully! You can now log in.
            </p>
            <button onClick={() => setStep(1)} className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 transition-all shadow-lg">
              Go to Login
            </button>
        </div>
      );
    }
  };

  const getTitle = (step) => {
      if (step === 1) return "Partner Login";
      if (step === 2) return "Forgot Password";
      if (step === 3) return "Verify & Reset";
      if (step === 4) return "Success!";
      return "Partner Access";
  }
  const getSubtitle = (step) => {
      if (step === 1) return "Sign in to manage your deliveries";
      if (step === 2) return "Enter your email to receive a reset code.";
      if (step === 3) return `Enter the code sent to ${email}`;
      if (step === 4) return "Your account is secure.";
      return "";
  }


  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-gray-100">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl p-8 rounded-[32px] shadow-xl border border-white/50">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 mb-2">
            {getTitle(step)}
          </h1>
          <p className="text-gray-500 text-sm">{getSubtitle(step)}</p>
        </div>

        {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center mb-6">
              {error}
            </div>
        )}
        
        {message && (
            <div className="p-3 rounded-xl bg-green-50 text-green-600 text-sm font-medium text-center mb-6">
              {message}
            </div>
        )}

        {renderForm(step)}

        {step === 1 && (
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Don't have an account?{' '}
                <Link href="/delivery/register" className="font-bold text-black hover:underline">
                  Register here
                </Link>
              </p>
            </div>
        )}
      </div>
    </div>
  );
}