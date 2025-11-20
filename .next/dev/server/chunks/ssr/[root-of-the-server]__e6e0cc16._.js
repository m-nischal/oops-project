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
function sizeLabelOf(s) {
    if (!s) return "";
    return typeof s.size !== "undefined" ? String(s.size) : typeof s.label !== "undefined" ? String(s.label) : "";
}
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
    const prevQtyRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(1);
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
                    const json = await res.json();
                    const p = json && json.product ? json.product : json;
                    if (!cancelled) {
                        setProduct(p);
                        const sizes = p?.sizes || [];
                        if (sizes && sizes.length) {
                            const first = sizes[0];
                            setSelectedSize(sizeLabelOf(first));
                            setSelectedSizeStock(Number(first.stock || 0));
                            setQty(1);
                            prevQtyRef.current = 1;
                        } else {
                            setSelectedSize(null);
                            setSelectedSizeStock(0);
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
        const s = (product.sizes || []).find((x)=>sizeLabelOf(x) === selectedSize);
        const stock = s ? s.stock || 0 : 0;
        setSelectedSizeStock(stock);
        // adjust qty if it exceeds stock — we keep it but block increments above
        if (qty > stock && stock > 0) {
        // no silent change
        }
    }, [
        product,
        selectedSize
    ]);
    function incrementQty() {
        // use qty state (not undefined q)
        const newQty = Number(qty || 0) + 1;
        if (selectedSize) {
            if (newQty > selectedSizeStock) {
                alert(`Only ${selectedSizeStock} units available for size ${selectedSize}.`);
                return;
            }
        } else {
            if (typeof product?.totalStock === "number" && newQty > product.totalStock) {
                alert(`Only ${product.totalStock} units available.`);
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
    async function handleAddToCart() {
        if (!product) {
            alert("Product not loaded");
            return;
        }
        const desiredQty = Number(qty) || 1;
        setAdding(true);
        try {
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
                if (typeof latest.totalStock === "number") {
                    const available = Number(latest.totalStock || 0);
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
            const pid = String(product._id || product._id);
            const existing = cart.find((i)=>i.productId === pid && i.size === selectedSize);
            if (existing) existing.qty = Math.min(existing.qty + desiredQty, 999);
            else cart.push({
                productId: pid,
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
        lineNumber: 144,
        columnNumber: 23
    }, this);
    if (!product) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
        style: {
            padding: 20
        },
        children: "Product not found."
    }, void 0, false, {
        fileName: "[project]/src/pages/product/[id].js",
        lineNumber: 145,
        columnNumber: 24
    }, this);
    const incrementDisabled = selectedSize ? qty >= selectedSizeStock : typeof product?.totalStock === "number" ? qty >= product.totalStock : false;
    const decrementDisabled = qty <= 1;
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
                                lineNumber: 153,
                                columnNumber: 14
                            }, this),
                            "  /  ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/products",
                                children: "Products"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 153,
                                columnNumber: 71
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 153,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/cart",
                        children: "Cart"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 154,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/product/[id].js",
                lineNumber: 152,
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
                                lineNumber: 160,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/product/[id].js",
                            lineNumber: 159,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 158,
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
                                lineNumber: 165,
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
                                lineNumber: 166,
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
                                lineNumber: 167,
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
                                        lineNumber: 171,
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
                                                lineNumber: 173,
                                                columnNumber: 41
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 172,
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
                                        lineNumber: 175,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 170,
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
                                                lineNumber: 181,
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
                                                lineNumber: 193,
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
                                                lineNumber: 197,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/product/[id].js",
                                        lineNumber: 180,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: handleAddToCart,
                                        disabled: adding || selectedSize && selectedSizeStock <= 0 || !selectedSize && typeof product.totalStock === "number" && product.totalStock <= 0,
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
                                        lineNumber: 210,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/product/[id].js",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/product/[id].js",
                        lineNumber: 164,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/product/[id].js",
                lineNumber: 157,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/product/[id].js",
        lineNumber: 151,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e6e0cc16._.js.map