module.exports = [
"[project]/src/pages/cart.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/cart.js
__turbopack_context__.s([
    "default",
    ()=>CartPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [ssr] (ecmascript)");
;
;
;
function loadCart() {
    try {
        return JSON.parse(localStorage.getItem("livemart_cart") || "[]");
    } catch (e) {
        return [];
    }
}
function saveCart(cart) {
    localStorage.setItem("livemart_cart", JSON.stringify(cart));
}
function sizeLabelOf(s) {
    if (!s) return "";
    return typeof s.size !== "undefined" ? String(s.size) : typeof s.label !== "undefined" ? String(s.label) : "";
}
function CartPage() {
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [phone, setPhone] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [address, setAddress] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [placing, setPlacing] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        setCart(loadCart());
    }, []);
    // Update quantity for the item at index (newQty: integer)
    async function updateQty(index, newQty) {
        newQty = Math.max(1, Number(newQty) || 1);
        const current = [
            ...cart
        ];
        const item = current[index];
        if (!item) return;
        try {
            // fetch latest product to verify stock
            const res = await fetch(`/api/products/${item.productId}`);
            if (!res.ok) {
                alert("Failed to verify stock. Try again.");
                return;
            }
            const json = await res.json();
            const latest = json && json.product ? json.product : json;
            if (item.size) {
                const sizeObj = (latest.sizes || []).find((s)=>sizeLabelOf(s) === item.size);
                const avail = sizeObj ? Number(sizeObj.stock || 0) : 0;
                if (newQty > avail) {
                    alert(`Maximum available units for "${item.name}" (size ${item.size}) is ${avail}.`);
                    return; // do not update qty
                }
            } else {
                if (typeof latest.totalStock === "number") {
                    const avail = Number(latest.totalStock || 0);
                    if (newQty > avail) {
                        alert(`Maximum available units for "${item.name}" is ${avail}.`);
                        return;
                    }
                }
            }
            current[index].qty = newQty;
            setCart(current);
            saveCart(current);
        } catch (err) {
            console.error(err);
            alert("Could not verify stock. Try again.");
        }
    }
    function incrementItem(index) {
        const current = [
            ...cart
        ];
        const it = current[index];
        if (!it) return;
        updateQty(index, Number(it.qty || 1) + 1);
    }
    function decrementItem(index) {
        const current = [
            ...cart
        ];
        const it = current[index];
        if (!it) return;
        updateQty(index, Math.max(1, Number(it.qty || 1) - 1));
    }
    function removeItem(index) {
        const c = [
            ...cart
        ];
        c.splice(index, 1);
        setCart(c);
        saveCart(c);
    }
    const total = cart.reduce((s, it)=>s + Number(it.price || 0) * Number(it.qty || 1), 0);
    async function placeOrder(e) {
        e.preventDefault();
        if (!name || !phone || !address) {
            setMessage({
                type: "error",
                text: "Please fill name, phone and address."
            });
            return;
        }
        if (!cart.length) {
            setMessage({
                type: "error",
                text: "Cart is empty."
            });
            return;
        }
        setPlacing(true);
        setMessage(null);
        try {
            // server pre-check (simple approach)
            const resAll = await fetch(`/api/products?limit=500`);
            const jsonAll = await resAll.json();
            const itemsList = jsonAll.items || jsonAll.products || jsonAll;
            const map = {};
            (itemsList || []).forEach((p)=>{
                map[p._id] = p;
            });
            const problems = [];
            for (const c of cart){
                const p = map[c.productId];
                if (!p) {
                    problems.push({
                        name: c.name,
                        reason: "Not found"
                    });
                    continue;
                }
                if (c.size) {
                    const sizeObj = (p.sizes || []).find((s)=>sizeLabelOf(s) === c.size);
                    const avail = sizeObj ? Number(sizeObj.stock || 0) : 0;
                    if (avail < c.qty) problems.push({
                        name: c.name,
                        size: c.size,
                        available: avail,
                        requested: c.qty
                    });
                } else {
                    if (typeof p.totalStock === "number") {
                        if (p.totalStock < c.qty) problems.push({
                            name: c.name,
                            available: p.totalStock,
                            requested: c.qty
                        });
                    }
                }
            }
            if (problems.length) {
                setMessage({
                    type: "error",
                    text: "Some items are out of stock. Please review your cart."
                });
                console.log("Stock problems:", problems);
                setPlacing(false);
                return;
            }
            const payload = {
                customer: {
                    name,
                    phone,
                    address
                },
                items: cart.map((i)=>({
                        productId: i.productId,
                        qty: i.qty,
                        price: i.price,
                        size: i.size,
                        name: i.name
                    })),
                total
            };
            const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (!orderRes.ok) {
                const errJson = await orderRes.json().catch(()=>({
                        message: "Order failed"
                    }));
                setMessage({
                    type: "error",
                    text: `Server rejected order: ${errJson.message || "Unknown"}`
                });
                setPlacing(false);
                return;
            }
            const orderJson = await orderRes.json();
            localStorage.removeItem("livemart_cart");
            setCart([]);
            setMessage({
                type: "success",
                text: `Order placed. Order id: ${orderJson.orderId || orderJson._id || "unknown"}`
            });
        } catch (err) {
            console.error("Order error:", err);
            setMessage({
                type: "error",
                text: "Failed to place order. Try again."
            });
        } finally{
            setPlacing(false);
        }
    }
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                        style: {
                            margin: 0
                        },
                        children: "Cart"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/cart.js",
                        lineNumber: 168,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/categories",
                        children: "Back to categories"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/cart.js",
                        lineNumber: 169,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/cart.js",
                lineNumber: 167,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 16
                },
                children: cart.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                    children: "Your cart is empty."
                }, void 0, false, {
                    fileName: "[project]/src/pages/cart.js",
                    lineNumber: 173,
                    columnNumber: 30
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                            style: {
                                listStyle: "none",
                                padding: 0
                            },
                            children: cart.map((it, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                    style: {
                                        display: "flex",
                                        gap: 12,
                                        padding: 12,
                                        borderRadius: 8,
                                        border: "1px solid #eee",
                                        marginBottom: 10
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                            src: it.image || "/images/placeholder.png",
                                            alt: it.name,
                                            style: {
                                                width: 80,
                                                height: 80,
                                                objectFit: "cover",
                                                borderRadius: 6
                                            }
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/cart.js",
                                            lineNumber: 178,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                flex: 1
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700
                                                    },
                                                    children: it.name
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/cart.js",
                                                    lineNumber: 180,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        color: "#666",
                                                        fontSize: 13
                                                    },
                                                    children: it.size ? `Size: ${it.size}` : null
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/cart.js",
                                                    lineNumber: 181,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        marginTop: 8,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8
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
                                                                    onClick: ()=>decrementItem(idx),
                                                                    "aria-label": `Decrease qty for ${it.name}`,
                                                                    style: {
                                                                        padding: "8px 10px",
                                                                        border: "none",
                                                                        background: "#fff",
                                                                        cursor: "pointer"
                                                                    },
                                                                    children: "−"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/cart.js",
                                                                    lineNumber: 184,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        minWidth: 56,
                                                                        textAlign: "center",
                                                                        padding: "8px 6px",
                                                                        fontWeight: 600
                                                                    },
                                                                    children: it.qty
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/cart.js",
                                                                    lineNumber: 185,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>incrementItem(idx),
                                                                    "aria-label": `Increase qty for ${it.name}`,
                                                                    style: {
                                                                        padding: "8px 10px",
                                                                        border: "none",
                                                                        background: "#fff",
                                                                        cursor: "pointer"
                                                                    },
                                                                    children: "+"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/cart.js",
                                                                    lineNumber: 186,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/pages/cart.js",
                                                            lineNumber: 183,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>removeItem(idx),
                                                            style: {
                                                                marginLeft: 8
                                                            },
                                                            children: "Remove"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/cart.js",
                                                            lineNumber: 189,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/cart.js",
                                                    lineNumber: 182,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/cart.js",
                                            lineNumber: 179,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                textAlign: "right"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontWeight: 700
                                                    },
                                                    children: [
                                                        "₹",
                                                        (it.price || 0).toLocaleString("en-IN")
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/cart.js",
                                                    lineNumber: 193,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        color: "#666",
                                                        fontSize: 13
                                                    },
                                                    children: [
                                                        "Subtotal: ₹",
                                                        ((it.price || 0) * (it.qty || 1)).toLocaleString("en-IN")
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/cart.js",
                                                    lineNumber: 194,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/cart.js",
                                            lineNumber: 192,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, `${it.productId}-${it.size || ""}`, true, {
                                    fileName: "[project]/src/pages/cart.js",
                                    lineNumber: 177,
                                    columnNumber: 17
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/pages/cart.js",
                            lineNumber: 175,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            style: {
                                fontWeight: 700,
                                marginBottom: 12
                            },
                            children: [
                                "Total: ₹",
                                Number(total).toLocaleString("en-IN")
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/cart.js",
                            lineNumber: 200,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/cart.js",
                    lineNumber: 174,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/cart.js",
                lineNumber: 172,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("section", {
                style: {
                    marginTop: 20
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                        children: "Checkout"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/cart.js",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this),
                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            marginBottom: 12,
                            color: message.type === "error" ? "crimson" : "green"
                        },
                        children: message.text
                    }, void 0, false, {
                        fileName: "[project]/src/pages/cart.js",
                        lineNumber: 207,
                        columnNumber: 21
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                        onSubmit: placeOrder,
                        style: {
                            maxWidth: 680
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginBottom: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        style: {
                                            display: "block",
                                            fontSize: 14
                                        },
                                        children: "Name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/cart.js",
                                        lineNumber: 210,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        value: name,
                                        onChange: (e)=>setName(e.target.value),
                                        style: {
                                            width: "100%",
                                            padding: 8,
                                            borderRadius: 6
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/cart.js",
                                        lineNumber: 211,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/cart.js",
                                lineNumber: 209,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginBottom: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        style: {
                                            display: "block",
                                            fontSize: 14
                                        },
                                        children: "Phone"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/cart.js",
                                        lineNumber: 214,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                        value: phone,
                                        onChange: (e)=>setPhone(e.target.value),
                                        style: {
                                            width: "100%",
                                            padding: 8,
                                            borderRadius: 6
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/cart.js",
                                        lineNumber: 215,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/cart.js",
                                lineNumber: 213,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                style: {
                                    marginBottom: 8
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                        style: {
                                            display: "block",
                                            fontSize: 14
                                        },
                                        children: "Address"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/cart.js",
                                        lineNumber: 218,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("textarea", {
                                        value: address,
                                        onChange: (e)=>setAddress(e.target.value),
                                        rows: 4,
                                        style: {
                                            width: "100%",
                                            padding: 8,
                                            borderRadius: 6
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/cart.js",
                                        lineNumber: 219,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/cart.js",
                                lineNumber: 217,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                    type: "submit",
                                    disabled: placing,
                                    style: {
                                        padding: "10px 14px",
                                        borderRadius: 8,
                                        background: "#0070f3",
                                        color: "#fff",
                                        border: "none"
                                    },
                                    children: placing ? "Placing order…" : "Place order"
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/cart.js",
                                    lineNumber: 223,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/pages/cart.js",
                                lineNumber: 222,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/cart.js",
                        lineNumber: 208,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/cart.js",
                lineNumber: 205,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/cart.js",
        lineNumber: 166,
        columnNumber: 5
    }, this);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__d3879069._.js.map