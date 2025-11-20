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
"[project]/Project OOPS/src/lib/emailTemplates.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/emailTemplates.js
__turbopack_context__.s([
    "otpEmailHtml",
    ()=>otpEmailHtml,
    "resetPasswordEmailHtml",
    ()=>resetPasswordEmailHtml
]);
function otpEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 10 }) {
    return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color: #222; margin-bottom: 6px;">${appName} — Verification Code</h2>
      <p style="color: #555; margin-top: 0;">
        Use the code below to verify your email address. The code expires in ${expiryMinutes} minutes.
      </p>

      <div style="margin: 22px 0; text-align: center;">
        <div style="display:inline-block; padding: 14px 22px; border-radius:8px; background:#f0f4ff;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1a56db;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Team
      </p>
    </div>
  </div>
  `;
}
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
var __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$lib$2f$emailTemplates$2e$js__$5b$api$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Project OOPS/src/lib/emailTemplates.js [api] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
async function sendOtpMail({ to, otp }) {
    const transporter = __TURBOPACK__imported__module__$5b$externals$5d2f$nodemailer__$5b$external$5d$__$28$nodemailer$2c$__cjs$29$__["default"].createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_PORT) === "465",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    const subject = "Reset your LiveMart password";
    const html = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$lib$2f$emailTemplates$2e$js__$5b$api$5d$__$28$ecmascript$29$__["resetPasswordEmailHtml"])({
        otp,
        expiryMinutes: 10,
        appName: "LiveMart"
    });
    await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: user.email,
        subject,
        html,
        text: `Your LiveMart password reset code is ${otp}. It expires in 10 minutes.`
    });
}
async function handler(req, res) {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$lib$2f$dbConnect$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"])();
    if (req.method !== "POST") return res.status(405).json({
        ok: false,
        message: "Method not allowed"
    });
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({
            ok: false,
            message: "Email required"
        });
        const user1 = await __TURBOPACK__imported__module__$5b$project$5d2f$Project__OOPS$2f$src$2f$models$2f$User$2e$js__$5b$api$5d$__$28$ecmascript$29$__["default"].findOne({
            email: email.toLowerCase()
        });
        if (!user1) {
            // Do not reveal whether user exists — but we still respond OK to avoid user enumeration
            return res.status(200).json({
                ok: true,
                message: "If an account with that email exists, an OTP has been sent."
            });
        }
        // generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await __TURBOPACK__imported__module__$5b$externals$5d2f$bcryptjs__$5b$external$5d$__$28$bcryptjs$2c$__esm_import$29$__["default"].hash(otp, 10);
        user1.resetOtp = otpHash;
        user1.resetOtpExpiry = Date.now() + OTP_TTL_MS;
        user1.resetAttempts = 0;
        await user1.save();
        try {
            await sendOtpMail({
                to: user1.email,
                otp
            });
        } catch (mailErr) {
            console.error("Error sending OTP mail:", mailErr);
            // don't return detailed mail error to user
            return res.status(500).json({
                ok: false,
                message: "Failed to send OTP email"
            });
        }
        return res.status(200).json({
            ok: true,
            message: "If an account exists, an OTP was sent."
        });
    } catch (err) {
        console.error("forgot request error:", err);
        return res.status(500).json({
            ok: false,
            message: "Server error"
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__33a2ef22._.js.map