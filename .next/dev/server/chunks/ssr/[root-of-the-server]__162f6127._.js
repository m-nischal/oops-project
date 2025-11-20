module.exports = [
"[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react/jsx-dev-runtime", () => require("react/jsx-dev-runtime"));

module.exports = mod;
}),
"[externals]/react [external] (react, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react", () => require("react"));

module.exports = mod;
}),
"[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("styled-jsx/style.js", () => require("styled-jsx/style.js"));

module.exports = mod;
}),
"[externals]/react/jsx-runtime [external] (react/jsx-runtime, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react/jsx-runtime", () => require("react/jsx-runtime"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/components/LeftSidebar.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/components/LeftSidebar.jsx
__turbopack_context__.s([
    "default",
    ()=>LeftSidebar
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/styled-jsx/style.js [external] (styled-jsx/style.js, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [ssr] (ecmascript)");
;
;
;
;
function LeftSidebar({ maxWidth = 300 }) {
    const [tree, setTree] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]); // [{ cat, children: [] }]
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [openCatId, setOpenCatId] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        let mounted = true;
        async function load() {
            setLoading(true);
            try {
                const res = await fetch("/api/categories");
                if (!res.ok) throw new Error("Failed to load categories");
                const all = await res.json();
                if (!mounted) return;
                const map = {};
                all.forEach((c)=>{
                    const parentKey = c.parent ? String(c.parent) : "root";
                    map[parentKey] = map[parentKey] || [];
                    map[parentKey].push(c);
                });
                const top = (map["root"] || []).sort((a, b)=>(a.meta?.sortOrder || 0) - (b.meta?.sortOrder || 0) || a.name.localeCompare(b.name));
                const built = top.map((t)=>({
                        cat: t,
                        children: (map[String(t._id)] || []).sort((a, b)=>(a.meta?.sortOrder || 0) - (b.meta?.sortOrder || 0) || a.name.localeCompare(b.name))
                    }));
                setTree(built);
            } catch (err) {
                console.error("LeftSidebar load error", err);
            } finally{
                setLoading(false);
            }
        }
        load();
        return ()=>{
            mounted = false;
        };
    }, []);
    function handleKeyOpen(catId, e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpenCatId(openCatId === catId ? null : catId);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"], {
                id: "2256de3c35188bad",
                dynamic: [
                    maxWidth,
                    maxWidth,
                    maxWidth
                ],
                children: `.ls-wrapper.__jsx-style-dynamic-selector{z-index:1000;pointer-events:none;align-items:center;display:flex;position:fixed;top:50%;left:8px;transform:translateY(-50%)}.hamburger.__jsx-style-dynamic-selector{cursor:pointer;pointer-events:auto;background:#fff;border-radius:8px;outline:none;flex-direction:column;justify-content:center;align-items:center;gap:4px;width:40px;height:40px;padding:8px;display:flex;box-shadow:0 4px 12px #0000001f}.bar.__jsx-style-dynamic-selector{background:#333;border-radius:2px;width:20px;height:2px}.panel.__jsx-style-dynamic-selector{pointer-events:none;width:0;transition:width .22s;overflow:visible}.panel-inner.__jsx-style-dynamic-selector{width:${maxWidth}px;max-width:${maxWidth}px;transform-origin:0;opacity:0;pointer-events:auto;background:#fff;border-radius:8px;padding:12px;transition:opacity .16s,transform .16s;position:relative;top:-8px;left:46px;transform:translate(-6px);box-shadow:0 8px 30px #00000026}.hamburger.__jsx-style-dynamic-selector:hover+.panel.__jsx-style-dynamic-selector,.hamburger.__jsx-style-dynamic-selector:focus+.panel.__jsx-style-dynamic-selector,.panel.__jsx-style-dynamic-selector:hover,.panel.__jsx-style-dynamic-selector:focus-within{width:calc(${maxWidth}px + 56px);pointer-events:auto}.hamburger.__jsx-style-dynamic-selector:hover+.panel.__jsx-style-dynamic-selector .panel-inner.__jsx-style-dynamic-selector,.hamburger.__jsx-style-dynamic-selector:focus+.panel.__jsx-style-dynamic-selector .panel-inner.__jsx-style-dynamic-selector,.panel.__jsx-style-dynamic-selector:hover .panel-inner.__jsx-style-dynamic-selector,.panel.__jsx-style-dynamic-selector:focus-within .panel-inner.__jsx-style-dynamic-selector{opacity:1;transform:translate(0)}.major-list.__jsx-style-dynamic-selector{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.major-item.__jsx-style-dynamic-selector{cursor:pointer;border-radius:6px;justify-content:space-between;align-items:center;padding:8px;display:flex}.major-item.__jsx-style-dynamic-selector:hover,.major-item.__jsx-style-dynamic-selector:focus{background:#f6f8fb}.major-title.__jsx-style-dynamic-selector{color:#111;font-weight:700}.children.__jsx-style-dynamic-selector{margin:6px 0 0;padding-left:12px;list-style:none;display:none}.children.__jsx-style-dynamic-selector a.__jsx-style-dynamic-selector{color:#333;border-radius:6px;padding:6px 8px;font-size:14px;text-decoration:none;display:block}.children.__jsx-style-dynamic-selector a.__jsx-style-dynamic-selector:hover{background:#f3f6ff}.major-item.__jsx-style-dynamic-selector:hover .children.__jsx-style-dynamic-selector,.major-item.__jsx-style-dynamic-selector:focus-within .children.__jsx-style-dynamic-selector,.major-item.open.__jsx-style-dynamic-selector .children.__jsx-style-dynamic-selector{display:block}.cat-path.__jsx-style-dynamic-selector{color:#666;margin-top:4px;font-size:12px}`
            }, void 0, false, void 0, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                "aria-hidden": false,
                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                    [
                        "2256de3c35188bad",
                        [
                            maxWidth,
                            maxWidth,
                            maxWidth
                        ]
                    ]
                ]) + " " + "ls-wrapper",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        role: "button",
                        tabIndex: 0,
                        "aria-label": "Open categories",
                        title: "Browse categories (hover)",
                        className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                            [
                                "2256de3c35188bad",
                                [
                                    maxWidth,
                                    maxWidth,
                                    maxWidth
                                ]
                            ]
                        ]) + " " + "hamburger",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                    [
                                        "2256de3c35188bad",
                                        [
                                            maxWidth,
                                            maxWidth,
                                            maxWidth
                                        ]
                                    ]
                                ]) + " " + "bar"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LeftSidebar.jsx",
                                lineNumber: 152,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                    [
                                        "2256de3c35188bad",
                                        [
                                            maxWidth,
                                            maxWidth,
                                            maxWidth
                                        ]
                                    ]
                                ]) + " " + "bar"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LeftSidebar.jsx",
                                lineNumber: 153,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                    [
                                        "2256de3c35188bad",
                                        [
                                            maxWidth,
                                            maxWidth,
                                            maxWidth
                                        ]
                                    ]
                                ]) + " " + "bar"
                            }, void 0, false, {
                                fileName: "[project]/src/components/LeftSidebar.jsx",
                                lineNumber: 154,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/LeftSidebar.jsx",
                        lineNumber: 145,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        "aria-hidden": "true",
                        className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                            [
                                "2256de3c35188bad",
                                [
                                    maxWidth,
                                    maxWidth,
                                    maxWidth
                                ]
                            ]
                        ]) + " " + "panel",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            role: "menu",
                            "aria-label": "Category navigation",
                            className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                [
                                    "2256de3c35188bad",
                                    [
                                        maxWidth,
                                        maxWidth,
                                        maxWidth
                                    ]
                                ]
                            ]) + " " + "panel-inner",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: 8
                                    },
                                    className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                        [
                                            "2256de3c35188bad",
                                            [
                                                maxWidth,
                                                maxWidth,
                                                maxWidth
                                            ]
                                        ]
                                    ]),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontWeight: 800
                                            },
                                            className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                [
                                                    "2256de3c35188bad",
                                                    [
                                                        maxWidth,
                                                        maxWidth,
                                                        maxWidth
                                                    ]
                                                ]
                                            ]),
                                            children: "Categories"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LeftSidebar.jsx",
                                            lineNumber: 160,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: 13,
                                                color: "#666"
                                            },
                                            className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                [
                                                    "2256de3c35188bad",
                                                    [
                                                        maxWidth,
                                                        maxWidth,
                                                        maxWidth
                                                    ]
                                                ]
                                            ]),
                                            children: loading ? "Loading…" : `${tree.length} groups`
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/LeftSidebar.jsx",
                                            lineNumber: 161,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/LeftSidebar.jsx",
                                    lineNumber: 159,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
                                    className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                        [
                                            "2256de3c35188bad",
                                            [
                                                maxWidth,
                                                maxWidth,
                                                maxWidth
                                            ]
                                        ]
                                    ]),
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                        role: "list",
                                        className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                            [
                                                "2256de3c35188bad",
                                                [
                                                    maxWidth,
                                                    maxWidth,
                                                    maxWidth
                                                ]
                                            ]
                                        ]) + " " + "major-list",
                                        children: tree.map(({ cat, children })=>{
                                            const isOpen = openCatId === String(cat._id);
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                onMouseEnter: ()=>setOpenCatId(String(cat._id)),
                                                onMouseLeave: ()=>setOpenCatId(null),
                                                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                    [
                                                        "2256de3c35188bad",
                                                        [
                                                            maxWidth,
                                                            maxWidth,
                                                            maxWidth
                                                        ]
                                                    ]
                                                ]) + " " + `major-item ${isOpen ? "open" : ""}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            display: "flex",
                                                            flexDirection: "column"
                                                        },
                                                        className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                            [
                                                                "2256de3c35188bad",
                                                                [
                                                                    maxWidth,
                                                                    maxWidth,
                                                                    maxWidth
                                                                ]
                                                            ]
                                                        ]),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                href: `/products?categoryId=${cat._id}`,
                                                                legacyBehavior: true,
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                    style: {
                                                                        textDecoration: "none"
                                                                    },
                                                                    className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                                        [
                                                                            "2256de3c35188bad",
                                                                            [
                                                                                maxWidth,
                                                                                maxWidth,
                                                                                maxWidth
                                                                            ]
                                                                        ]
                                                                    ]) + " " + "major-title",
                                                                    children: cat.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/LeftSidebar.jsx",
                                                                    lineNumber: 176,
                                                                    columnNumber: 87
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/LeftSidebar.jsx",
                                                                lineNumber: 176,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                                    [
                                                                        "2256de3c35188bad",
                                                                        [
                                                                            maxWidth,
                                                                            maxWidth,
                                                                            maxWidth
                                                                        ]
                                                                    ]
                                                                ]) + " " + "cat-path",
                                                                children: cat.path
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/LeftSidebar.jsx",
                                                                lineNumber: 177,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/LeftSidebar.jsx",
                                                        lineNumber: 175,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        style: {
                                                            marginLeft: 8
                                                        },
                                                        className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                            [
                                                                "2256de3c35188bad",
                                                                [
                                                                    maxWidth,
                                                                    maxWidth,
                                                                    maxWidth
                                                                ]
                                                            ]
                                                        ]),
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>setOpenCatId(isOpen ? null : String(cat._id)),
                                                            onKeyDown: (e)=>handleKeyOpen(String(cat._id), e),
                                                            "aria-expanded": isOpen,
                                                            "aria-controls": `children-${cat._id}`,
                                                            style: {
                                                                background: "transparent",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                color: "#666"
                                                            },
                                                            title: isOpen ? "Collapse" : "Expand",
                                                            className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                                [
                                                                    "2256de3c35188bad",
                                                                    [
                                                                        maxWidth,
                                                                        maxWidth,
                                                                        maxWidth
                                                                    ]
                                                                ]
                                                            ]),
                                                            children: "▾"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/LeftSidebar.jsx",
                                                            lineNumber: 181,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/LeftSidebar.jsx",
                                                        lineNumber: 180,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                                        id: `children-${cat._id}`,
                                                        role: "list",
                                                        className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                            [
                                                                "2256de3c35188bad",
                                                                [
                                                                    maxWidth,
                                                                    maxWidth,
                                                                    maxWidth
                                                                ]
                                                            ]
                                                        ]) + " " + "children",
                                                        children: [
                                                            children.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                style: {
                                                                    fontSize: 13,
                                                                    color: "#999",
                                                                    padding: "6px 8px"
                                                                },
                                                                className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                                    [
                                                                        "2256de3c35188bad",
                                                                        [
                                                                            maxWidth,
                                                                            maxWidth,
                                                                            maxWidth
                                                                        ]
                                                                    ]
                                                                ]),
                                                                children: "No subcategories"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/LeftSidebar.jsx",
                                                                lineNumber: 194,
                                                                columnNumber: 51
                                                            }, this),
                                                            children.map((child)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                                        [
                                                                            "2256de3c35188bad",
                                                                            [
                                                                                maxWidth,
                                                                                maxWidth,
                                                                                maxWidth
                                                                            ]
                                                                        ]
                                                                    ]),
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: `/products?categoryId=${child._id}`,
                                                                        legacyBehavior: true,
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                            className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                                                                [
                                                                                    "2256de3c35188bad",
                                                                                    [
                                                                                        maxWidth,
                                                                                        maxWidth,
                                                                                        maxWidth
                                                                                    ]
                                                                                ]
                                                                            ]),
                                                                            children: child.name
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/components/LeftSidebar.jsx",
                                                                            lineNumber: 198,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/components/LeftSidebar.jsx",
                                                                        lineNumber: 197,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, child._id, false, {
                                                                    fileName: "[project]/src/components/LeftSidebar.jsx",
                                                                    lineNumber: 196,
                                                                    columnNumber: 27
                                                                }, this))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/components/LeftSidebar.jsx",
                                                        lineNumber: 193,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, cat._id, true, {
                                                fileName: "[project]/src/components/LeftSidebar.jsx",
                                                lineNumber: 169,
                                                columnNumber: 21
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/LeftSidebar.jsx",
                                        lineNumber: 165,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LeftSidebar.jsx",
                                    lineNumber: 164,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    style: {
                                        marginTop: 12,
                                        fontSize: 13,
                                        color: "#666"
                                    },
                                    className: __TURBOPACK__imported__module__$5b$externals$5d2f$styled$2d$jsx$2f$style$2e$js__$5b$external$5d$__$28$styled$2d$jsx$2f$style$2e$js$2c$__cjs$29$__["default"].dynamic([
                                        [
                                            "2256de3c35188bad",
                                            [
                                                maxWidth,
                                                maxWidth,
                                                maxWidth
                                            ]
                                        ]
                                    ]),
                                    children: "Tip: hover the three-dash icon to open. Click a category to view products."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/LeftSidebar.jsx",
                                    lineNumber: 209,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/LeftSidebar.jsx",
                            lineNumber: 158,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/LeftSidebar.jsx",
                        lineNumber: 157,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/LeftSidebar.jsx",
                lineNumber: 144,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/src/pages/_app.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/_app.js
__turbopack_context__.s([
    "default",
    ()=>App
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LeftSidebar$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/LeftSidebar.jsx [ssr] (ecmascript)");
;
;
;
;
function App({ Component, pageProps }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$LeftSidebar$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/pages/_app.js",
                lineNumber: 9,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(Component, {
                ...pageProps
            }, void 0, false, {
                fileName: "[project]/src/pages/_app.js",
                lineNumber: 10,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__162f6127._.js.map