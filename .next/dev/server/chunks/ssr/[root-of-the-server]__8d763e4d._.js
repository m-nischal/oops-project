module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
"[project]/src/components/SizeChartModal.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/components/SizeChartModal.js
__turbopack_context__.s([
    "default",
    ()=>SizeChartModal
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
function SizeChartModal({ open, onClose, imageUrl, title = "Size chart" }) {
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!open) return;
        function onKey(e) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", onKey);
        return ()=>window.removeEventListener("keydown", onKey);
    }, [
        open,
        onClose
    ]);
    if (!open) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        onClick: onClose,
        style: {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            padding: 20
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            onClick: (e)=>e.stopPropagation(),
            style: {
                background: "#fff",
                padding: 12,
                borderRadius: 8,
                maxWidth: "95%",
                maxHeight: "90%",
                boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                overflow: "auto"
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/src/components/SizeChartModal.js",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            "aria-label": "Close size chart",
                            style: {
                                border: "none",
                                background: "transparent",
                                fontSize: 20,
                                cursor: "pointer"
                            },
                            children: "✕"
                        }, void 0, false, {
                            fileName: "[project]/src/components/SizeChartModal.js",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/SizeChartModal.js",
                    lineNumber: 40,
                    columnNumber: 9
                }, this),
                imageUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                        src: imageUrl,
                        alt: title,
                        style: {
                            maxWidth: "100%",
                            maxHeight: "75vh",
                            objectFit: "contain"
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/components/SizeChartModal.js",
                        lineNumber: 49,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/SizeChartModal.js",
                    lineNumber: 48,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    style: {
                        padding: 20,
                        color: "#666"
                    },
                    children: "Size chart not available."
                }, void 0, false, {
                    fileName: "[project]/src/components/SizeChartModal.js",
                    lineNumber: 52,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/SizeChartModal.js",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/SizeChartModal.js",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/pages/product/[id].js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/product/[id].js
__turbopack_context__.s([
    "default",
    ()=>ProductDetailPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SizeChartModal$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/SizeChartModal.js [ssr] (ecmascript)");
;
;
;
;
;
/* Helpers */ function sizeLabelOf(s) {
    if (!s) return "";
    return typeof s.size !== "undefined" ? String(s.size) : typeof s.label !== "undefined" ? String(s.label) : "";
}
function slugify(s = "") {
    return String(s || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
}
function totalStockFrom(product = {}) {
    if (!product) return 0;
    if (typeof product.totalStock === "number") return product.totalStock;
    if (Array.isArray(product.sizes)) return product.sizes.reduce((acc, it)=>acc + Number(it.stock || 0), 0);
    return 0;
}
function isClothingProduct(product = {}) {
    const pt = (product.productType || "").toString().toLowerCase();
    const cat = (product.category || "").toString().toLowerCase();
    return pt.includes("cloth") || cat.includes("cloth") || product.sizeChart && product.sizeChart.chartName;
}
/**
 * Determine the size-chart image URL for a product.
 * Priority:
 *  1) product.sizeChart.image
 *  2) slug(product.sizeChart.chartName) -> /images/sizecharts/<slug>.png
 *  3) slug(product.category) -> /images/sizecharts/<slug>.png
 *  4) slug(product.productType) -> /images/sizecharts/<slug>.png
 *  5) /images/sizecharts/clothing-default.png (only for clothing)
 */ function sizeChartImageFor(prod) {
    if (!prod) return null;
    if (prod.sizeChart && prod.sizeChart.image) return prod.sizeChart.image;
    const tryNames = [];
    if (prod.sizeChart && prod.sizeChart.chartName) tryNames.push(slugify(prod.sizeChart.chartName));
    if (prod.category) tryNames.push(slugify(prod.category));
    if (prod.productType) tryNames.push(slugify(prod.productType));
    for (const name of tryNames){
        if (!name) continue;
        return `/images/sizecharts/${name}.png`;
    }
    if (isClothingProduct(prod)) return `/images/sizecharts/clothing-default.png`;
    return null;
}
/* Local cart helpers (consistent with cart page) */ function getCart() {
    try {
        return JSON.parse(localStorage.getItem("livemart_cart") || "[]");
    } catch (e) {
        return [];
    }
}
function saveCart(cart) {
    localStorage.setItem("livemart_cart", JSON.stringify(cart));
}
function ProductDetailPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { id } = router.query;
    const [product, setProduct] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    // size & quantity
    const [selectedSize, setSelectedSize] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [selectedSizeStock, setSelectedSizeStock] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0);
    const [qty, setQty] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(1);
    const prevQtyRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(1);
    const [adding, setAdding] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    // size chart modal
    const [chartOpen, setChartOpen] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [sizeImage, setSizeImage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    // New: UI confirmation state (stays on page after add)
    const [justAdded, setJustAdded] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [addedCount, setAddedCount] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!id) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/api/products/${id}`);
                if (!res.ok) {
                    setProduct(null);
                    return;
                }
                const json = await res.json();
                const p = json && json.product ? json.product : json;
                if (cancelled) return;
                setProduct(p);
                // init size selection
                const sizes = p?.sizes || [];
                if (sizes && sizes.length) {
                    const first = sizes[0];
                    const label = sizeLabelOf(first);
                    setSelectedSize(label);
                    setSelectedSizeStock(Number(first.stock || 0));
                    setQty(1);
                    prevQtyRef.current = 1;
                } else {
                    setSelectedSize(null);
                    setSelectedSizeStock(0);
                    setQty(1);
                    prevQtyRef.current = 1;
                }
                // compute size chart image for UI
                setSizeImage(sizeChartImageFor(p));
            } catch (err) {
                console.error("Failed to load product:", err);
                setProduct(null);
            } finally{
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return ()=>{
            cancelled = true;
        };
    }, [
        id
    ]);
    // keep selectedSizeStock updated if product or selectedSize changes
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!product) return;
        const s = (product.sizes || []).find((x)=>sizeLabelOf(x) === selectedSize);
        const stock = s ? Number(s.stock || 0) : 0;
        setSelectedSizeStock(stock);
        // do not silently change qty if it exceeds stock; only block increments
        if (qty > stock && stock > 0) {
        // noop
        }
    }, [
        product,
        selectedSize
    ]);
    // Stepper handlers
    function incrementQty() {
        const newQty = Number(qty || 0) + 1;
        if (selectedSize) {
            if (newQty > selectedSizeStock) {
                alert(`Only ${selectedSizeStock} units available for size ${selectedSize}.`);
                return;
            }
        } else {
            const total = totalStockFrom(product);
            if (typeof total === "number" && newQty > total) {
                alert(`Only ${total} units available.`);
                return;
            }
        }
        setQty(newQty);
        prevQtyRef.current = newQty;
    }
    function decrementQty() {
        const newQty = Math.max(1, Number(qty || 0) - 1);
        setQty(newQty);
        prevQtyRef.current = newQty;
    }
    // Add to cart with server-side verification
    async function handleAddToCart() {
        if (!product) {
            alert("Product not loaded");
            return;
        }
        const desiredQty = Number(qty) || 1;
        setAdding(true);
        try {
            // verify latest
            const res = await fetch(`/api/products/${product._id || product._id}`);
            if (!res.ok) {
                alert("Failed to verify stock. Try again.");
                setAdding(false);
                return;
            }
            const json = await res.json();
            const latest = json && json.product ? json.product : json;
            if (selectedSize) {
                const sizeObj = (latest.sizes || []).find((s)=>sizeLabelOf(s) === selectedSize);
                const available = sizeObj ? Number(sizeObj.stock || 0) : 0;
                if (available <= 0) {
                    alert(`Selected size ${selectedSize} is out of stock.`);
                    setAdding(false);
                    return;
                }
                if (desiredQty > available) {
                    alert(`Only ${available} left for size ${selectedSize}.`);
                    setAdding(false);
                    return;
                }
            } else {
                const available = totalStockFrom(latest);
                if (available <= 0) {
                    alert("Product out of stock.");
                    setAdding(false);
                    return;
                }
                if (desiredQty > available) {
                    alert(`Only ${available} left.`);
                    setAdding(false);
                    return;
                }
            }
            const cart = getCart();
            const pid = String(product._id || product._id);
            const existing = cart.find((i)=>i.productId === pid && i.size === selectedSize);
            if (existing) {
                // merge but cap at some reasonable maximum
                existing.qty = Math.min(existing.qty + desiredQty, 999);
            } else {
                cart.push({
                    productId: pid,
                    name: product.name,
                    price: product.price,
                    size: selectedSize,
                    qty: desiredQty,
                    image: product.images && product.images[0]
                });
            }
            saveCart(cart);
            // notify other windows/components that cart changed
            try {
                window.dispatchEvent(new Event("storage"));
            } catch (e) {}
            // Instead of navigating away, stay on page and show a friendly confirmation
            setJustAdded(true);
            setAddedCount(desiredQty);
            // Auto-hide the confirmation after a short time
            setTimeout(()=>{
                setJustAdded(false);
            }, 3500);
        } catch (err) {
            console.error(err);
            alert("Error adding to cart");
        } finally{
            setAdding(false);
        }
    }
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
        style: {
            padding: 20
        },
        children: "Loading…"
    }, void 0, false, {
        fileName: "[project]/src/pages/product/[id].js",
        lineNumber: 221,
        columnNumber: 23
    }, this);
    if (!product) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
        style: {
            padding: 20
        },
        children: "Product not found."
    }, void 0, false, {
        fileName: "[project]/src/pages/product/[id].js",
        lineNumber: 222,
        columnNumber: 24
    }, this);
    const totalStock = totalStockFrom(product);
    const incrementDisabled = selectedSize ? qty >= selectedSizeStock : typeof totalStock === "number" ? qty >= totalStock : false;
    const decrementDisabled = qty <= 1;
    const chartImageUrl = sizeImage;
    const showChart = Boolean(chartImageUrl) && isClothingProduct(product);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        style: {
            padding: 20,
            fontFamily: "system-ui, sans-serif"
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("header", {
                style: {
                    display: "flex",
                    justifyContent: "space-between"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/categories",
                                children: "Categories"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 235,
                                columnNumber: 11
                            }, this),
                            "  / ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/products",
                                children: "Products"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 236,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 234,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/cart",
                        children: "Cart"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/product/[id].js",
                lineNumber: 233,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                style: {
                    display: "flex",
                    gap: 24,
                    marginTop: 18
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            width: 360
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                background: "#fafafa",
                                padding: 12,
                                borderRadius: 8
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    if (showChart) setChartOpen(true);
                                },
                                "aria-label": showChart ? "View size chart" : "Product image",
                                style: {
                                    border: "none",
                                    background: "transparent",
                                    padding: 0,
                                    margin: 0,
                                    cursor: showChart ? "pointer" : "default",
                                    width: "100%"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                    src: product.images && product.images[0] ? product.images[0] : "/images/placeholder.png",
                                    alt: product.name,
                                    style: {
                                        width: "100%",
                                        objectFit: "contain"
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/product/[id].js",
                                    lineNumber: 249,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 244,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/product/[id].js",
                            lineNumber: 243,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 242,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            flex: 1
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                style: {
                                    marginTop: 0
                                },
                                children: product.name
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 259,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    color: "#444",
                                    marginBottom: 12
                                },
                                children: product.description
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 260,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: 20,
                                    fontWeight: 700
                                },
                                children: [
                                    "₹",
                                    product.price
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 261,
                                columnNumber: 11
                            }, this),
                            product.sizes && product.sizes.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 12
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            marginBottom: 6
                                        },
                                        children: "Size"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 265,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                        value: selectedSize || "",
                                        onChange: (e)=>{
                                            setSelectedSize(e.target.value);
                                            setQty(1);
                                            prevQtyRef.current = 1;
                                        },
                                        style: {
                                            padding: 8,
                                            borderRadius: 6
                                        },
                                        children: product.sizes.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                value: sizeLabelOf(s),
                                                children: [
                                                    sizeLabelOf(s),
                                                    " — stock: ",
                                                    s.stock
                                                ]
                                            }, sizeLabelOf(s), true, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 272,
                                                columnNumber: 19
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 266,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 13,
                                            color: "#666",
                                            marginTop: 6
                                        },
                                        children: selectedSize ? `Available: ${selectedSizeStock}` : null
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 277,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 264,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 12,
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "inline-flex",
                                            alignItems: "center",
                                            border: "1px solid #ddd",
                                            borderRadius: 8,
                                            overflow: "hidden"
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                onClick: decrementQty,
                                                "aria-label": "Decrease quantity",
                                                disabled: decrementDisabled,
                                                style: {
                                                    padding: "10px 12px",
                                                    background: decrementDisabled ? "#f5f5f5" : "#fff",
                                                    border: "none",
                                                    cursor: decrementDisabled ? "not-allowed" : "pointer"
                                                },
                                                children: "−"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 283,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                "aria-live": "polite",
                                                style: {
                                                    minWidth: 56,
                                                    textAlign: "center",
                                                    padding: "10px 8px",
                                                    fontWeight: 600
                                                },
                                                children: qty
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 295,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                onClick: incrementQty,
                                                "aria-label": "Increase quantity",
                                                disabled: incrementDisabled,
                                                style: {
                                                    padding: "10px 12px",
                                                    background: incrementDisabled ? "#f5f5f5" : "#fff",
                                                    border: "none",
                                                    cursor: incrementDisabled ? "not-allowed" : "pointer"
                                                },
                                                children: "+"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 299,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 282,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: handleAddToCart,
                                        disabled: adding || selectedSize && selectedSizeStock <= 0 || !selectedSize && typeof totalStock === "number" && totalStock <= 0,
                                        style: {
                                            padding: "10px 14px",
                                            borderRadius: 8,
                                            background: "#0070f3",
                                            color: "#fff",
                                            border: "none",
                                            cursor: "pointer"
                                        },
                                        children: adding ? "Adding…" : "Add to cart"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 312,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 281,
                                columnNumber: 11
                            }, this),
                            justAdded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 12,
                                    padding: 10,
                                    background: "#e6ffed",
                                    border: "1px solid #cfeacb",
                                    borderRadius: 8,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                                children: addedCount
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 325,
                                                columnNumber: 17
                                            }, this),
                                            " item",
                                            addedCount > 1 ? "s" : "",
                                            " added to cart."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 324,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: "flex",
                                            gap: 8
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                onClick: ()=>router.push("/cart"),
                                                style: {
                                                    padding: "6px 10px",
                                                    borderRadius: 6,
                                                    border: "none",
                                                    background: "#0b74de",
                                                    color: "#fff",
                                                    cursor: "pointer"
                                                },
                                                children: "View cart"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 328,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setJustAdded(false),
                                                style: {
                                                    padding: "6px 10px",
                                                    borderRadius: 6,
                                                    border: "1px solid #ddd",
                                                    background: "#fff",
                                                    cursor: "pointer"
                                                },
                                                children: "Continue shopping"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 331,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 327,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 323,
                                columnNumber: 13
                            }, this),
                            showChart ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginTop: 14
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setChartOpen(true),
                                    style: {
                                        background: "transparent",
                                        border: "none",
                                        color: "#0070f3",
                                        cursor: "pointer",
                                        padding: 0
                                    },
                                    children: "View size chart"
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/product/[id].js",
                                    lineNumber: 341,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 340,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 258,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/product/[id].js",
                lineNumber: 241,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$SizeChartModal$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                open: chartOpen,
                onClose: ()=>setChartOpen(false),
                imageUrl: chartImageUrl,
                title: product.sizeChart && product.sizeChart.chartName ? product.sizeChart.chartName : "Size chart"
            }, void 0, false, {
                fileName: "[project]/src/pages/product/[id].js",
                lineNumber: 350,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/product/[id].js",
        lineNumber: 232,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8d763e4d._.js.map