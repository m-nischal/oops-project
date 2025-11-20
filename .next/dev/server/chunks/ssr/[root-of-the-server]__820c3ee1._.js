module.exports = [
"[project]/Project OOPS/src/pages/forgot-password.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/forgot-password.js
__turbopack_context__.s([
    "default",
    ()=>ForgotPasswordPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
function ForgotPasswordPage() {
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(1);
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [otp, setOtp] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [confirm, setConfirm] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [pwMismatch, setPwMismatch] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
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
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email
                })
            });
            const data = await res.json();
            setMessage(data.message || (data.ok ? "OTP sent (if account exists)." : "Failed"));
            setStep(2);
        } catch (err) {
            console.error(err);
            setMessage("Server error");
        } finally{
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
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    otp,
                    password
                })
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
        } finally{
            setLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            maxWidth: 520,
            margin: "2rem auto",
            padding: 20
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                children: "Forgot password"
            }, void 0, false, {
                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            step === 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                onSubmit: requestOtp,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        children: [
                            "Email",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                required: true,
                                type: "email",
                                value: email,
                                onChange: (e)=>setEmail(e.target.value),
                                style: {
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    margin: "8px 0"
                                }
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                                lineNumber: 82,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                        lineNumber: 80,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "submit",
                        disabled: loading,
                        children: loading ? "Sending..." : "Send OTP"
                    }, void 0, false, {
                        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                        lineNumber: 90,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                lineNumber: 79,
                columnNumber: 9
            }, this),
            step === 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                onSubmit: verifyAndSet,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        children: [
                            "OTP (check your email)",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                required: true,
                                value: otp,
                                onChange: (e)=>setOtp(e.target.value),
                                style: {
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    margin: "8px 0"
                                }
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                                lineNumber: 100,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                        lineNumber: 98,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        children: [
                            "New password",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                required: true,
                                type: "password",
                                value: password,
                                onChange: (e)=>{
                                    setPassword(e.target.value);
                                    checkConfirm(e.target.value, confirm);
                                },
                                style: {
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    margin: "8px 0"
                                }
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                        children: [
                            "Confirm password",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                required: true,
                                type: "password",
                                value: confirm,
                                onChange: (e)=>{
                                    setConfirm(e.target.value);
                                    checkConfirm(password, e.target.value);
                                },
                                style: {
                                    display: "block",
                                    width: "100%",
                                    padding: 8,
                                    margin: "8px 0"
                                }
                            }, void 0, false, {
                                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                                lineNumber: 124,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                        lineNumber: 122,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            minHeight: 22
                        },
                        children: confirm.length > 0 ? pwMismatch ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                color: "crimson"
                            },
                            children: "Confirm password does not match"
                        }, void 0, false, {
                            fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                            lineNumber: 139,
                            columnNumber: 17
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                color: "green"
                            },
                            children: "Passwords match"
                        }, void 0, false, {
                            fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                            lineNumber: 141,
                            columnNumber: 17
                        }, this) : null
                    }, void 0, false, {
                        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                        lineNumber: 136,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        disabled: loading,
                        type: "submit",
                        children: loading ? "Setting..." : "Set password"
                    }, void 0, false, {
                        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                        lineNumber: 146,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                lineNumber: 97,
                columnNumber: 9
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    marginTop: 12
                },
                children: message
            }, void 0, false, {
                fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
                lineNumber: 150,
                columnNumber: 19
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Project OOPS/src/pages/forgot-password.js",
        lineNumber: 76,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__820c3ee1._.js.map