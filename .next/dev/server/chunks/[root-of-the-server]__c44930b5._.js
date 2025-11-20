module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/multer [external] (multer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("multer", () => require("multer"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/src/pages/api/upload.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/api/upload.js
__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$multer__$5b$external$5d$__$28$multer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/multer [external] (multer, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
// --- Helper to run middleware ---
// This allows us to use multer (which is Express/Connect middleware)
// in a standard Next.js API route.
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject)=>{
        fn(req, res, (result)=>{
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}
// --- Configuration for Multer (same as before) ---
const storage = __TURBOPACK__imported__module__$5b$externals$5d2f$multer__$5b$external$5d$__$28$multer$2c$__cjs$29$__["default"].diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb)=>{
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});
const fileFilter = (req, file, cb)=>{
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};
// We re-use the same multer instance
const upload = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$multer__$5b$external$5d$__$28$multer$2c$__cjs$29$__["default"])({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
const config = {
    api: {
        bodyParser: false
    }
};
async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', [
            'POST'
        ]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
    try {
        // Run the multer middleware for our fields
        await runMiddleware(req, res, upload.fields([
            {
                name: 'productImages',
                maxCount: 10
            },
            {
                name: 'productImage',
                maxCount: 1
            }
        ]));
        // After middleware, req.files will be populated
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                error: 'No files were uploaded.'
            });
        }
        // Process the files and get URLs
        const urls = {};
        if (req.files.productImages) {
            urls.productImages = req.files.productImages.map((file)=>`/uploads/${file.filename}`);
        }
        if (req.files.productImage) {
            urls.productImage = req.files.productImage.map((file)=>`/uploads/${file.filename}`);
        }
        return res.status(200).json({
            message: 'Files uploaded successfully',
            urls: urls // Return an object with both field arrays
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: err.message || 'Something went wrong!'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c44930b5._.js.map