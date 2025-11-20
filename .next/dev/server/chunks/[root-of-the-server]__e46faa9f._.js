module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/mongoose [external] (mongoose, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}),
"[project]/src/lib/dbConnect.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/dbConnect.js
__turbopack_context__.s([
    "default",
    ()=>dbConnect
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
/**
 * @file dbConnect
 * @brief Reusable MongoDB connection util for Next.js API routes.
 *
 * Throws if MONGO_URI missing. Caches connection in global to avoid multiple
 * connections during hot-reload/development.
 */ const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI not set");
let cached = /*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose || {
    conn: null,
    promise: null
};
if (!/*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose) /*TURBOPACK member replacement*/ __turbopack_context__.g._mongoose = cached;
async function dbConnect() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        // Use the connection string directly; options are managed by mongoose v8 defaults.
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGO_URI).then((m)=>m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
}),
"[project]/src/models/User.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/models/User.js
__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const userSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        index: true,
        sparse: true,
        unique: false
    },
    phone: {
        type: String,
        index: true,
        sparse: true,
        unique: false
    },
    password: {
        type: String
    },
    oauthProvider: String,
    oauthId: String,
    role: {
        type: String,
        enum: [
            "CUSTOMER",
            "RETAILER",
            "WHOLESALER"
        ],
        default: "CUSTOMER"
    },
    verified: {
        type: Boolean,
        default: false
    },
    otp: {
        code: String,
        expiresAt: Date
    }
}, {
    timestamps: true
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.User || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("User", userSchema);
}),
"[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("jsonwebtoken", () => require("jsonwebtoken"));

module.exports = mod;
}),
"[project]/src/pages/api/auth/otp/verify.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/auth/otp/verify.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/jsonwebtoken [external] (jsonwebtoken, cjs)");
;
;
;
async function handler(req, res) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
        if (req.method !== "POST") {
            res.setHeader("Allow", "POST");
            return res.status(405).json({
                ok: false,
                message: "Method not allowed"
            });
        }
        const { phone, email, code } = req.body || {};
        if (!code || !phone && !email) {
            return res.status(400).json({
                ok: false,
                message: "email or phone and code are required"
            });
        }
        const query = phone ? {
            phone
        } : {
            email
        };
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne(query);
        if (!user) return res.status(404).json({
            ok: false,
            message: "User not found"
        });
        // validate OTP
        if (!user.otp || user.otp.code !== code) {
            return res.status(400).json({
                ok: false,
                message: "Invalid or expired OTP"
            });
        }
        const now = Date.now();
        const expiresAt = user.otp.expiresAt ? new Date(user.otp.expiresAt).getTime() : 0;
        if (now > expiresAt) {
            return res.status(400).json({
                ok: false,
                message: "Invalid or expired OTP"
            });
        }
        // mark verified and clear otp
        user.verified = true;
        user.otp = undefined;
        await user.save();
        // ensure JWT secret exists
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            // log for server operators and return 500
            console.error("JWT_SECRET is not set in environment");
            return res.status(500).json({
                ok: false,
                message: "Server misconfiguration"
            });
        }
        // sign token
        const token = __TURBOPACK__imported__module__$5b$externals$5d2f$jsonwebtoken__$5b$external$5d$__$28$jsonwebtoken$2c$__cjs$29$__["default"].sign({
            id: user._id.toString(),
            role: user.role
        }, secret, {
            expiresIn: "30d"
        });
        // Optionally set HttpOnly cookie (safe default). Frontend can still read the token from the JSON.
        // Adjust `Secure` and `SameSite` as appropriate for your deployment.
        const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
        const isProd = ("TURBOPACK compile-time value", "development") === "production";
        const cookieParts = [
            `token=${token}`,
            `HttpOnly`,
            `Path=/`,
            `Max-Age=${maxAge}`,
            ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : "",
            ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : "SameSite=Lax"
        ].filter(Boolean).join("; ");
        res.setHeader("Set-Cookie", cookieParts);
        // Return minimal user info
        return res.json({
            ok: true,
            message: "Verified",
            token,
            user: {
                id: user._id.toString(),
                name: user.name || null,
                email: user.email || null,
                phone: user.phone || null,
                role: user.role
            }
        });
    } catch (err) {
        console.error("OTP verify error:", err);
        return res.status(500).json({
            ok: false,
            message: "Internal server error"
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e46faa9f._.js.map