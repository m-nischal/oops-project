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
"[project]/Project OOPS/src/lib/dbConnect.js [api] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/Project OOPS/src/models/User.js [api] (ecmascript)", ((__turbopack_context__) => {
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
        unique: true
    },
    password: {
        type: String,
        select: false
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
    },
    resetOtp: {
        type: String
    },
    resetOtpExpiry: {
        type: Number
    },
    resetAttempts: {
        type: Number
    }
}, {
    timestamps: true
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.User || __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model("User", userSchema);
}),
"[externals]/bcryptjs [external] (bcryptjs, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("bcryptjs");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/nodemailer [external] (nodemailer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("nodemailer", () => require("nodemailer"));

module.exports = mod;
}),
"[project]/Project OOPS/src/pages/api/auth/forgot/request.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// src/pages/api/auth/forgot/request.js
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Project OOPS/src/lib/dbConnect.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Project OOPS/src/models/User.js [api] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/bcryptjs [external] (bcryptjs, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$nodemailer__$5b$external$5d$__$28$nodemailer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/nodemailer [external] (nodemailer, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
function resetPasswordEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 10 }) {
    return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color:#222; margin-bottom:6px;">${appName} — Password Reset</h2>
      <p style="color:#555; margin-top:0;">
        We received a request to reset the password for your account. Use the code below to continue.
      </p>

      <div style="margin:22px 0; text-align:center;">
        <div style="display:inline-block; padding:14px 22px; border-radius:8px; background:#fff0f0;">
          <span style="font-size:28px; font-weight:700; letter-spacing:6px; color:#d5182a;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        This code is valid for ${expiryMinutes} minutes. If you did not request a password reset, ignore this message.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Team
      </p>
    </div>
  </div>
  `;
}
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method !== "POST") {
        return res.status(405).json({
            ok: false,
            message: "Method not allowed"
        });
    }
    const { email } = req.body || {};
    if (!email || String(email).trim().length === 0) {
        return res.status(400).json({
            ok: false,
            message: "Email required"
        });
    }
    try {
        const normalized = String(email).toLowerCase().trim();
        // find or create user
        let user = await __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
            email: normalized
        });
        if (!user) {
            // create a user record with no password (OTP-only account)
            user = new __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"]({
                email: normalized
            });
        }
        // generate OTP and store hashed version + expiry
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashed = await __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__["default"].hash(otp, 10);
        user.resetOtp = hashed;
        user.resetOtpExpiry = Date.now() + OTP_TTL_MS;
        user.resetAttempts = 0;
        await user.save();
        // create transporter
        const transporter = __TURBOPACK__imported__module__$5b$externals$5d2f$nodemailer__$5b$external$5d$__$28$nodemailer$2c$__cjs$29$__["default"].createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_PORT) === "465",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        // verify transporter (helpful for debugging)
        try {
            await transporter.verify();
            console.log("SMTP verify OK");
        } catch (verifyErr) {
            console.warn("SMTP verify failed:", verifyErr && verifyErr.message ? verifyErr.message : verifyErr);
        // we continue — dev fallback below will help when SMTP isn't configured
        }
        // build email content
        const subject = "Reset your LiveMart password";
        const html = resetPasswordEmailHtml({
            otp,
            expiryMinutes: 10
        });
        try {
            await transporter.sendMail({
                from: process.env.FROM_EMAIL || process.env.SMTP_USER,
                to: user.email,
                subject,
                html,
                text: `Your LiveMart password reset code is ${otp}. It expires in 10 minutes.`
            });
            return res.status(200).json({
                ok: true,
                message: "OTP sent"
            });
        } catch (mailErr) {
            console.error("Error sending OTP mail:", mailErr && mailErr.stack ? mailErr.stack : mailErr);
            // Dev fallback — return OTP so you can test locally (DO NOT use in production)
            if ("TURBOPACK compile-time truthy", 1) {
                console.log(`[DEV OTP] ${user.email} -> ${otp}`);
                return res.status(200).json({
                    ok: true,
                    message: "OTP (dev) returned",
                    otp
                });
            }
            //TURBOPACK unreachable
            ;
        }
    } catch (err) {
        console.error("Forgot/request error:", err && err.stack ? err.stack : err);
        return res.status(500).json({
            ok: false,
            message: "Server error"
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__45e3f261._.js.map