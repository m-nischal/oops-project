module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next-connect [external] (next-connect, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("next-connect");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
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

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// src/pages/api/upload.js
__turbopack_context__.s([
    "config",
    ()=>config,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$next$2d$connect__$5b$external$5d$__$28$next$2d$connect$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/next-connect [external] (next-connect, esm_import)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$multer__$5b$external$5d$__$28$multer$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/multer [external] (multer, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$next$2d$connect__$5b$external$5d$__$28$next$2d$connect$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$next$2d$connect__$5b$external$5d$__$28$next$2d$connect$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
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
const upload = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$multer__$5b$external$5d$__$28$multer$2c$__cjs$29$__["default"])({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    } // 5MB file size limit
});
// --- API Route Handler ---
const router = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$next$2d$connect__$5b$external$5d$__$28$next$2d$connect$2c$__esm_import$29$__["createRouter"])();
// --- THIS IS THE CHANGE ---
// Use .array() instead of .single()
// 'productImages' is the new field name. Allows up to 10 images.
router.use(upload.array('productImages', 10));
router.post((req, res)=>{
    // --- THIS IS THE CHANGE ---
    // req.file is now req.files (an array)
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            error: 'No files were uploaded.'
        });
    }
    // Map over all uploaded files and return their URLs
    const urls = req.files.map((file)=>`/uploads/${file.filename}`);
    return res.status(200).json({
        message: 'Files uploaded successfully',
        urls: urls // Return an array of URLs
    });
});
const config = {
    api: {
        bodyParser: false
    }
};
const onError = (err, req, res)=>{
    console.error(err.stack);
    res.status(500).json({
        error: err.message || 'Something went wrong!'
    });
};
const __TURBOPACK__default__export__ = router.handler({
    onError
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__41175ce9._.js.map