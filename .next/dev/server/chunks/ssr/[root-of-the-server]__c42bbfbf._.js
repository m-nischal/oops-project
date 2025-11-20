module.exports = [
"[project]/Project OOPS/src/utils/redirectByRole.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// utils/redirectByRole.js (helper)
__turbopack_context__.s([
    "redirectIfLoggedIn",
    ()=>redirectIfLoggedIn
]);
async function redirectIfLoggedIn(ctxOrClientSide) {
    // client-side example:
    const token = localStorage.getItem("token");
    if (!token) return;
    // optionally decode token to get role
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload.role;
        if (role === "RETAILER") location.replace("/retailer/dashboard");
        else if (role === "WHOLESALER") location.replace("/wholesaler/dashboard");
        else location.replace("/customer/home");
    } catch (err) {
    // fallback: call /api/auth/me to get fresh data
    }
}
}),
"[project]/Project OOPS/src/pages/register.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/register.js
__turbopack_context__.s([
    "default",
    ()=>RegisterPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$utils$2f$redirectByRole$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Project OOPS/src/utils/redirectByRole.js [ssr] (ecmascript)");
;
;
;
function RegisterPage() {
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [role, setRole] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("RETAILER");
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [otp, setOtp] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [otpSent, setOtpSent] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
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
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    role
                })
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
        } finally{
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 20
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                children: "Register / Sign up"
            }, void 0, false, {
                fileName: "[project]/Project OOPS/src/pages/register.js",
                lineNumber: 135,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                onSubmit: handleVerifyOtp,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        children: [
                            "Name",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                value: name,
                                onChange: (e)=>setName(e.target.value),
                                style: {
                                    display: "block",
                                    width: 300
                                }
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 140,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/register.js",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 8
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "radio",
                                        checked: role === "CUSTOMER",
                                        onChange: ()=>setRole("CUSTOMER")
                                    }, void 0, false, {
                                        fileName: "[project]/Project OOPS/src/pages/register.js",
                                        lineNumber: 145,
                                        columnNumber: 13
                                    }, this),
                                    " Customer"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 144,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                style: {
                                    marginLeft: 12
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "radio",
                                        checked: role === "RETAILER",
                                        onChange: ()=>setRole("RETAILER")
                                    }, void 0, false, {
                                        fileName: "[project]/Project OOPS/src/pages/register.js",
                                        lineNumber: 148,
                                        columnNumber: 13
                                    }, this),
                                    " Retailer"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 147,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                style: {
                                    marginLeft: 12
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "radio",
                                        checked: role === "WHOLESALER",
                                        onChange: ()=>setRole("WHOLESALER")
                                    }, void 0, false, {
                                        fileName: "[project]/Project OOPS/src/pages/register.js",
                                        lineNumber: 151,
                                        columnNumber: 13
                                    }, this),
                                    " Wholesaler"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/register.js",
                        lineNumber: 143,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginTop: 10
                        },
                        children: [
                            "Email",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                type: "email",
                                value: email,
                                onChange: (e)=>setEmail(e.target.value),
                                style: {
                                    display: "block",
                                    width: 300
                                },
                                required: true
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 157,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/register.js",
                        lineNumber: 155,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        style: {
                            display: "block",
                            marginTop: 10
                        },
                        children: [
                            "Password",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                type: "password",
                                value: password,
                                onChange: (e)=>setPassword(e.target.value),
                                style: {
                                    display: "block",
                                    width: 300
                                },
                                required: true
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 168,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/register.js",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 12
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleSendOtp,
                                disabled: loading,
                                children: loading ? "Sending..." : "Send OTP"
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                style: {
                                    marginLeft: 8,
                                    color: "#777"
                                },
                                children: "use email to receive otp"
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/register.js",
                                lineNumber: 182,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/register.js",
                        lineNumber: 178,
                        columnNumber: 9
                    }, this),
                    otpSent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 12
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                            children: [
                                "Enter OTP",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                    value: otp,
                                    onChange: (e)=>setOtp(e.target.value),
                                    style: {
                                        display: "block",
                                        width: 200
                                    },
                                    placeholder: "6-digit OTP"
                                }, void 0, false, {
                                    fileName: "[project]/Project OOPS/src/pages/register.js",
                                    lineNumber: 190,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/Project OOPS/src/pages/register.js",
                            lineNumber: 188,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Project OOPS/src/pages/register.js",
                        lineNumber: 187,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: 12
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            type: "submit",
                            disabled: loading,
                            children: loading ? "Verifying..." : "Verify OTP & Finish Registration"
                        }, void 0, false, {
                            fileName: "[project]/Project OOPS/src/pages/register.js",
                            lineNumber: 201,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Project OOPS/src/pages/register.js",
                        lineNumber: 200,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Project OOPS/src/pages/register.js",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    color: "red",
                    marginTop: 12
                },
                children: message
            }, void 0, false, {
                fileName: "[project]/Project OOPS/src/pages/register.js",
                lineNumber: 207,
                columnNumber: 19
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Project OOPS/src/pages/register.js",
        lineNumber: 134,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c42bbfbf._.js.map