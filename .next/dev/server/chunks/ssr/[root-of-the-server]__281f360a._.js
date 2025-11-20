module.exports = [
"[project]/Project OOPS/src/pages/register.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// replace existing handleVerifyOtp in src/pages/register.js with this
__turbopack_context__.s([]);
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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: trimmedEmail,
                // backend accepts either `otp` or `code` — here we send `otp`
                otp: code,
                purpose: "register",
                password: password
            })
        });
        const verifyData = await verifyRes.json().catch(()=>null);
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
    } finally{
        setLoading(false);
    }
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__281f360a._.js.map