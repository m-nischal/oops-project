module.exports = [
"[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react/jsx-dev-runtime", () => require("react/jsx-dev-runtime"));

module.exports = mod;
}),
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
;
;
;
;
function getCart() {
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
    const [qty, setQty] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(1);
    const prevQtyRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(1); // store last valid qty
    const [selectedSize, setSelectedSize] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [selectedSizeStock, setSelectedSizeStock] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(0);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [adding, setAdding] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!id) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const res = await fetch(`/api/products/${id}`);
                if (res.ok) {
                    const p = await res.json();
                    if (!cancelled) {
                        setProduct(p);
                        if (p.sizes && p.sizes.length) {
                            setSelectedSize(p.sizes[0].label);
                            setSelectedSizeStock(p.sizes[0].stock || 0);
                            setQty(1);
                            prevQtyRef.current = 1;
                        }
                    }
                } else {
                    setProduct(null);
                }
            } catch (e) {
                console.error(e);
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
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!product) return;
        const s = (product.sizes || []).find((x)=>x.label === selectedSize);
        const stock = s ? s.stock || 0 : 0;
        setSelectedSizeStock(stock);
        // if the previously stored qty is greater than new stock, keep prev valid but do not auto-reduce
        if (qty > stock && stock > 0) {
        // keep qty but inform user next time they try to increase
        // do nothing here (we don't change qty silently)
        }
    }, [
        product,
        selectedSize
    ]);
    // NEW: controlled qty input handler that warns user instead of clamping silently
    function handleQtyInputChange(e) {
        const raw = e.target.value;
        const n = Number(raw || 0);
        if (!Number.isFinite(n) || n <= 0) {
            // ignore invalid numbers; do not update prevQtyRef
            setQty(1);
            prevQtyRef.current = 1;
            return;
        }
        // if there's a size-based stock restriction
        if (selectedSize) {
            if (n > selectedSizeStock) {
                // show popup and DO NOT change qty — keep previous valid qty
                alert(`Maximum available units for size "${selectedSize}" is ${selectedSizeStock}.`);
                // restore previous qty value in the input display
                setQty(prevQtyRef.current);
                return;
            }
        } else {
            // top-level stock check if used
            // if product.stock is defined, enforce it
            if (typeof product?.stock === "number") {
                if (n > product.stock) {
                    alert(`Maximum available units is ${product.stock}.`);
                    setQty(prevQtyRef.current);
                    return;
                }
            }
        }
        // valid value within stock — accept it and update prevQtyRef
        setQty(n);
        prevQtyRef.current = n;
    }
    async function handleAddToCart() {
        if (!product) {
            alert("Product not loaded");
            return;
        }
        const desiredQty = Number(qty) || 1;
        setAdding(true);
        try {
            // fetch latest product to avoid stale data
            const res = await fetch(`/api/products/${product._id}`);
            if (!res.ok) {
                alert("Failed to verify stock. Try again.");
                setAdding(false);
                return;
            }
            const latest = await res.json();
            if (selectedSize) {
                const sizeObj = (latest.sizes || []).find((s)=>s.label === selectedSize);
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
                if (typeof latest.stock === "number") {
                    const available = Number(latest.stock || 0);
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
            }
            const cart = getCart();
            const existing = cart.find((i)=>i.productId === product._id && i.size === selectedSize);
            if (existing) existing.qty = Math.min(existing.qty + desiredQty, 999);
            else cart.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                size: selectedSize,
                qty: desiredQty,
                image: product.images && product.images[0]
            });
            saveCart(cart);
            router.push("/cart");
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
        lineNumber: 146,
        columnNumber: 23
    }, this);
    if (!product) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
        style: {
            padding: 20
        },
        children: "Product not found."
    }, void 0, false, {
        fileName: "[project]/src/pages/product/[id].js",
        lineNumber: 147,
        columnNumber: 24
    }, this);
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
                                lineNumber: 152,
                                columnNumber: 14
                            }, this),
                            "  /  ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/products",
                                children: "Products"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 152,
                                columnNumber: 71
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 152,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/cart",
                        children: "Cart"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 153,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/product/[id].js",
                lineNumber: 151,
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
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                src: product.images && product.images[0] ? product.images[0] : "/images/placeholder.png",
                                alt: product.name,
                                style: {
                                    width: "100%",
                                    objectFit: "contain"
                                }
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 159,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/product/[id].js",
                            lineNumber: 158,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 157,
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
                                lineNumber: 164,
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
                                lineNumber: 165,
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
                                lineNumber: 166,
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
                                        lineNumber: 170,
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
                                                value: s.label,
                                                children: [
                                                    s.label,
                                                    " — stock: ",
                                                    s.stock
                                                ]
                                            }, s.label, true, {
                                                fileName: "[project]/src/pages/product/[id].js",
                                                lineNumber: 172,
                                                columnNumber: 41
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 171,
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
                                        lineNumber: 174,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 169,
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        min: "1",
                                        value: qty,
                                        onChange: handleQtyInputChange,
                                        style: {
                                            width: 80,
                                            padding: 8,
                                            borderRadius: 6
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 179,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: handleAddToCart,
                                        disabled: adding,
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
                                        lineNumber: 186,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 178,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/product/[id].js",
                lineNumber: 156,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/product/[id].js",
        lineNumber: 150,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b3f0277c._.js.map