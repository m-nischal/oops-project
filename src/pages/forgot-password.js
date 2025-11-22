import { useState, useRef } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  
  // OTP Grid
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const otpInputRefs = useRef([]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [pwMismatch, setPwMismatch] = useState(false);

  // --- VALIDATION HELPERS ---
  function isValidPassword(value) {
    // At least 8 chars, 1 number, 1 special char
    const hasLength = value.length >= 8;
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    return hasLength && hasNumber && hasSpecial;
  }

  function checkConfirm(pw, conf) {
    setPwMismatch(conf.length > 0 && pw !== conf);
  }

  // --- OTP HANDLERS ---
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

  // --- API ACTIONS ---
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
      if (data.ok) {
        setMessage({ type: 'success', text: "OTP sent successfully." });
        setTimeout(() => {
            setStep(2);
            setMessage(null);
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.message || "Failed to send OTP." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndSet(e) {
    e.preventDefault();
    const code = otp.join("");
    
    if (code.length !== 6) {
        setMessage({ type: 'error', text: "Please enter the complete OTP." });
        return;
    }
    
    // --- NEW VALIDATION ---
    if (!isValidPassword(password)) {
        setMessage({ type: 'error', text: "Password must be 8+ chars, with a number & special char." });
        return;
    }

    if (pwMismatch) {
      setMessage({ type: 'error', text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/forgot/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep(3);
      } else {
        setMessage({ type: 'error', text: data.message || "Failed to reset password." });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  // UI Helper for password hint
  const passwordValid = isValidPassword(password);

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-white to-gray-100">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl p-8 rounded-[32px] shadow-xl border border-white/50">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-gray-900 mb-2">
            {step === 1 && "Forgot Password?"}
            {step === 2 && "Verify & Reset"}
            {step === 3 && "All Done!"}
          </h2>
          <p className="text-gray-500 text-sm">
            {step === 1 && "Enter your email to receive a reset code."}
            {step === 2 && `Enter the code sent to ${email}`}
            {step === 3 && "Your password has been updated successfully."}
          </p>
        </div>

        {/* STEP 1: REQUEST OTP */}
        {step === 1 && (
          <form onSubmit={requestOtp} className="space-y-6">
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
              {loading ? <Loader2 className="animate-spin" /> : "Send Code"}
              {!loading && <ArrowRight size={20} />}
            </button>
            
            <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-gray-500 hover:text-black">Back to Login</Link>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY & RESET */}
        {step === 2 && (
          <form onSubmit={verifyAndSet} className="space-y-5">
            
            {/* OTP GRID */}
            <div className="space-y-2">
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

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkConfirm(e.target.value, confirm);
                }}
                placeholder="New Password"
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

            {/* Password Requirements Hint */}
            {password && !passwordValid && (
                <p className="text-[10px] text-gray-500 pl-1 -mt-2">
                    Must be 8+ chars, with a number & special character.
                </p>
            )}

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                required
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  checkConfirm(password, e.target.value);
                }}
                placeholder="Confirm Password"
                className={`w-full h-14 pl-12 pr-4 rounded-2xl bg-white border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${pwMismatch ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-black focus:ring-black/10'}`}
              />
            </div>
            
            {pwMismatch && <p className="text-xs text-red-500 font-medium pl-1">Passwords do not match.</p>}

            <button
              type="submit"
              disabled={loading || pwMismatch || !passwordValid || otp.join("").length !== 6}
              className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Reset Password"}
            </button>
            
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="w-full text-sm text-gray-500 hover:text-black py-2"
            >
              Change Email
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600">
              You can now log in with your new password.
            </p>
            <Link href="/login">
              <button className="w-full h-14 rounded-2xl bg-black text-white font-bold text-lg hover:bg-gray-900 transition-all shadow-lg">
                Go to Login
              </button>
            </Link>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-3 rounded-xl text-sm font-medium text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message.text}
          </div>
        )}

      </div>
    </div>
  );
}