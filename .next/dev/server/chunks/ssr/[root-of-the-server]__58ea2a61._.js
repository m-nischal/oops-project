module.exports = [
"[project]/src/utils/redirectByRole.js [ssr] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/src/pages/login.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/login.js
__turbopack_context__.s([
    "default",
    ()=>LoginPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$redirectByRole$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/redirectByRole.js [ssr] (ecmascript)");
;
;
;
function LoginPage() {
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    // Redirect if already logged in (run only on client)
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, []);
    function isProbablyEmail(value) {
        return typeof value === "string" && value.includes("@") && value.indexOf("@") > 0;
    }
    async function handleLogin(e) {
        e.preventDefault();
        setMessage("");
        const trimmedEmail = email.trim().toLowerCase();
        if (!isProbablyEmail(trimmedEmail)) {
            setMessage("Please enter a valid email address.");
            return;
        }
        if (!password) {
            setMessage("Please enter your password.");
            return;
        }
        const body = {
            email: trimmedEmail,
            password
        };
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!data.ok) {
                setMessage(data.message || "Login failed");
                return;
            }
            // Save token
            localStorage.setItem("token", data.token);
            // Redirect by role
            try {
                const payload = JSON.parse(atob(data.token.split(".")[1]));
                if (payload.role === "RETAILER") window.location.href = "/retailer/dashboard";
                else if (payload.role === "WHOLESALER") window.location.href = "/wholesaler/dashboard";
                else window.location.href = "/customer/home";
            } catch (err) {
                // fallback redirect
                window.location.href = "/";
            }
        } catch (err) {
            console.error("Login error:", err);
            setMessage("Network error. Please try again.");
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: "20px"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                children: "Login"
            }, void 0, false, {
                fileName: "[project]/src/pages/login.js",
                lineNumber: 76,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                onSubmit: handleLogin,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                        type: "email",
                        placeholder: "Email",
                        value: email,
                        onChange: (e)=>setEmail(e.target.value),
                        required: true,
                        style: {
                            display: "block",
                            marginBottom: "10px",
                            width: "250px"
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/pages/login.js",
                        lineNumber: 79,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                        type: "password",
                        placeholder: "Password",
                        value: password,
                        onChange: (e)=>setPassword(e.target.value),
                        required: true,
                        style: {
                            display: "block",
                            marginBottom: "10px",
                            width: "250px"
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/pages/login.js",
                        lineNumber: 88,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                        type: "submit",
                        children: "Login"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/login.js",
                        lineNumber: 97,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginTop: "10px"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                            href: "/forgot-password",
                            style: {
                                color: "blue"
                            },
                            children: "Forgot Password? Reset using email OTP"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/login.js",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/login.js",
                        lineNumber: 100,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/login.js",
                lineNumber: 78,
                columnNumber: 7
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                style: {
                    color: "red",
                    marginTop: "10px"
                },
                children: message
            }, void 0, false, {
                fileName: "[project]/src/pages/login.js",
                lineNumber: 107,
                columnNumber: 19
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("hr", {}, void 0, false, {
                fileName: "[project]/src/pages/login.js",
                lineNumber: 109,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                children: "Or login with Google"
            }, void 0, false, {
                fileName: "[project]/src/pages/login.js",
                lineNumber: 111,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                href: "/api/auth/signin",
                children: "Sign in with Google"
            }, void 0, false, {
                fileName: "[project]/src/pages/login.js",
                lineNumber: 112,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/login.js",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__58ea2a61._.js.map