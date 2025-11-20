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
"[project]/src/lib/otpSenders.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/otpSenders.js
__turbopack_context__.s([
    "sendEmailOTP",
    ()=>sendEmailOTP,
    "sendSmsOTP",
    ()=>sendSmsOTP
]);
(()=>{
    const e = new Error("Cannot find module 'nodemailer'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
async function sendSmsOTP(phone, code) {
    // For local/dev: mock console log
    console.log(`Send SMS to ${phone}: OTP ${code}`);
    return true;
}
async function sendEmailOTP(email, code) {
    if (!process.env.SMTP_HOST) {
        console.log(`Mock email to ${email}: OTP ${code}`);
        return true;
    }
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Boolean(process.env.SMTP_SECURE === "true"),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    await transporter.sendMail({
        from: process.env.SMTP_FROM || "no-reply@example.com",
        to: email,
        subject: "Your LiveMart OTP",
        text: `Your OTP: ${code}. It will expire in 5 minutes.`
    });
    return true;
}
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/pages/api/auth/otp/request.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// pages/api/auth/otp/request.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otpSenders$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/otpSenders.js [api] (ecmascript)");
// implementations below
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
;
;
;
;
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method !== "POST") return res.status(405).end();
    const { phone, email, role = "CUSTOMER", name } = req.body;
    if (!phone && !email) return res.status(400).json({
        ok: false,
        message: "phone or email required"
    });
    // generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    // find or create user (set role if new)
    const query = phone ? {
        phone
    } : {
        email
    };
    let user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne(query);
    if (!user) {
        user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].create({
            name,
            phone: phone || undefined,
            email: email || undefined,
            role,
            verified: false,
            otp: {
                code,
                expiresAt
            }
        });
    } else {
        // update otp and ensure role kept or set if missing
        user.otp = {
            code,
            expiresAt
        };
        if (!user.role) user.role = role;
        await user.save();
    }
    try {
        if (phone) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otpSenders$2e$js__$5b$api$5d$__$28$ecmascript$29$__["sendSmsOTP"])(phone, code);
        } else {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$otpSenders$2e$js__$5b$api$5d$__$28$ecmascript$29$__["sendEmailOTP"])(email, code);
        }
        return res.json({
            ok: true,
            message: "OTP sent (mock)",
            debugCode: code
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            ok: false,
            message: "Failed to send OTP"
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__275f2409._.js.map