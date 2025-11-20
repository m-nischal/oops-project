(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/src/hooks/useAuthGuard.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/hooks/useAuthGuard.js
__turbopack_context__.s([
    "useAuthGuard",
    ()=>useAuthGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
;
function useAuthGuard(expectedRole) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useAuthGuard.useEffect": ()=>{
            // We can only check localStorage on the client-side
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const token = localStorage.getItem("token");
            if (!token) {
                // No token, send to login
                alert("Access Denied. Please log in.");
                router.replace('/login');
                return;
            }
            try {
                // Decode the token to get the role
                const payload = JSON.parse(atob(token.split(".")[1]));
                const userRole = payload.role;
                if (userRole === expectedRole) {
                    // --- Success ---
                    // User has the correct role.
                    setIsLoading(false);
                } else {
                    // --- Failure ---
                    // User is logged in, but with the WRONG role.
                    alert(`Access Denied. This page is for ${expectedRole}s, but you are logged in as a ${userRole}.`);
                    // Redirect them to their *correct* dashboard
                    if (userRole === "RETAILER") router.replace('/retailer/dashboard');
                    else if (userRole === "WHOLESALER") router.replace('/wholesaler/dashboard');
                    else router.replace('/customer/home'); //
                }
            } catch (e) {
                // Token is invalid or malformed
                console.error("Auth guard error:", e);
                localStorage.removeItem("token");
                alert("An error occurred. Please log in again.");
                router.replace('/login');
            }
        }
    }["useAuthGuard.useEffect"], [
        expectedRole,
        router
    ]);
    return {
        isLoading
    };
}
_s(useAuthGuard, "l9mOnJ2XXArxG69ajpcNCw8SPqI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/utils.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/lib/utils.js
__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/button.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9",
            "icon-sm": "size-8",
            "icon-lg": "size-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/button.jsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/avatar.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Avatar",
    ()=>Avatar,
    "AvatarFallback",
    ()=>AvatarFallback,
    "AvatarImage",
    ()=>AvatarImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-avatar/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
"use client";
;
;
;
;
const Avatar = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/avatar.jsx",
        lineNumber: 9,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Avatar;
Avatar.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"].displayName;
const AvatarImage = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Image"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("aspect-square h-full w-full", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/avatar.jsx",
        lineNumber: 17,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = AvatarImage;
AvatarImage.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Image"].displayName;
const AvatarFallback = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Fallback"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/avatar.jsx",
        lineNumber: 25,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = AvatarFallback;
AvatarFallback.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Fallback"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "Avatar$React.forwardRef");
__turbopack_context__.k.register(_c1, "Avatar");
__turbopack_context__.k.register(_c2, "AvatarImage$React.forwardRef");
__turbopack_context__.k.register(_c3, "AvatarImage");
__turbopack_context__.k.register(_c4, "AvatarFallback$React.forwardRef");
__turbopack_context__.k.register(_c5, "AvatarFallback");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/dropdown-menu.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DropdownMenu",
    ()=>DropdownMenu,
    "DropdownMenuCheckboxItem",
    ()=>DropdownMenuCheckboxItem,
    "DropdownMenuContent",
    ()=>DropdownMenuContent,
    "DropdownMenuGroup",
    ()=>DropdownMenuGroup,
    "DropdownMenuItem",
    ()=>DropdownMenuItem,
    "DropdownMenuLabel",
    ()=>DropdownMenuLabel,
    "DropdownMenuPortal",
    ()=>DropdownMenuPortal,
    "DropdownMenuRadioGroup",
    ()=>DropdownMenuRadioGroup,
    "DropdownMenuRadioItem",
    ()=>DropdownMenuRadioItem,
    "DropdownMenuSeparator",
    ()=>DropdownMenuSeparator,
    "DropdownMenuShortcut",
    ()=>DropdownMenuShortcut,
    "DropdownMenuSub",
    ()=>DropdownMenuSub,
    "DropdownMenuSubContent",
    ()=>DropdownMenuSubContent,
    "DropdownMenuSubTrigger",
    ()=>DropdownMenuSubTrigger,
    "DropdownMenuTrigger",
    ()=>DropdownMenuTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [client] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-right.js [client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle.js [client] (ecmascript) <export default as Circle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
;
;
const DropdownMenu = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"];
const DropdownMenuTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Trigger"];
const DropdownMenuGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Group"];
const DropdownMenuPortal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Portal"];
const DropdownMenuSub = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Sub"];
const DropdownMenuRadioGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RadioGroup"];
const DropdownMenuSubTrigger = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, inset, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["SubTrigger"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
        ...props,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                className: "ml-auto"
            }, void 0, false, {
                fileName: "[project]/src/components/ui/dropdown-menu.jsx",
                lineNumber: 29,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 20,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = DropdownMenuSubTrigger;
DropdownMenuSubTrigger.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["SubTrigger"].displayName;
const DropdownMenuSubContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["SubContent"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 36,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = DropdownMenuSubContent;
DropdownMenuSubContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["SubContent"].displayName;
const DropdownMenuContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, sideOffset = 4, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"], {
            ref: ref,
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]", className),
            ...props
        }, void 0, false, {
            fileName: "[project]/src/components/ui/dropdown-menu.jsx",
            lineNumber: 49,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 48,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = DropdownMenuContent;
DropdownMenuContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"].displayName;
const DropdownMenuItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c6 = ({ className, inset, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Item"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 63,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c7 = DropdownMenuItem;
DropdownMenuItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Item"].displayName;
const DropdownMenuCheckboxItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c8 = ({ className, children, checked, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["CheckboxItem"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        checked: checked,
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["ItemIndicator"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
                        lineNumber: 85,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/ui/dropdown-menu.jsx",
                    lineNumber: 84,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/ui/dropdown-menu.jsx",
                lineNumber: 83,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 75,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c9 = DropdownMenuCheckboxItem;
DropdownMenuCheckboxItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["CheckboxItem"].displayName;
const DropdownMenuRadioItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c10 = ({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RadioItem"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["ItemIndicator"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Circle$3e$__["Circle"], {
                        className: "h-2 w-2 fill-current"
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
                        lineNumber: 104,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/src/components/ui/dropdown-menu.jsx",
                    lineNumber: 103,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/ui/dropdown-menu.jsx",
                lineNumber: 102,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 95,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c11 = DropdownMenuRadioItem;
DropdownMenuRadioItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["RadioItem"].displayName;
const DropdownMenuLabel = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c12 = ({ className, inset, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 113,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c13 = DropdownMenuLabel;
DropdownMenuLabel.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Label"].displayName;
const DropdownMenuSeparator = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c14 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Separator"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("-mx-1 my-1 h-px bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 121,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c15 = DropdownMenuSeparator;
DropdownMenuSeparator.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dropdown$2d$menu$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Separator"].displayName;
const DropdownMenuShortcut = ({ className, ...props })=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("ml-auto text-xs tracking-widest opacity-60", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dropdown-menu.jsx",
        lineNumber: 133,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c16 = DropdownMenuShortcut;
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14, _c15, _c16;
__turbopack_context__.k.register(_c, "DropdownMenuSubTrigger$React.forwardRef");
__turbopack_context__.k.register(_c1, "DropdownMenuSubTrigger");
__turbopack_context__.k.register(_c2, "DropdownMenuSubContent$React.forwardRef");
__turbopack_context__.k.register(_c3, "DropdownMenuSubContent");
__turbopack_context__.k.register(_c4, "DropdownMenuContent$React.forwardRef");
__turbopack_context__.k.register(_c5, "DropdownMenuContent");
__turbopack_context__.k.register(_c6, "DropdownMenuItem$React.forwardRef");
__turbopack_context__.k.register(_c7, "DropdownMenuItem");
__turbopack_context__.k.register(_c8, "DropdownMenuCheckboxItem$React.forwardRef");
__turbopack_context__.k.register(_c9, "DropdownMenuCheckboxItem");
__turbopack_context__.k.register(_c10, "DropdownMenuRadioItem$React.forwardRef");
__turbopack_context__.k.register(_c11, "DropdownMenuRadioItem");
__turbopack_context__.k.register(_c12, "DropdownMenuLabel$React.forwardRef");
__turbopack_context__.k.register(_c13, "DropdownMenuLabel");
__turbopack_context__.k.register(_c14, "DropdownMenuSeparator$React.forwardRef");
__turbopack_context__.k.register(_c15, "DropdownMenuSeparator");
__turbopack_context__.k.register(_c16, "DropdownMenuShortcut");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/WholesalerLayout.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/components/WholesalerLayout.jsx
__turbopack_context__.s([
    "default",
    ()=>WholesalerLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$avatar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/avatar.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/dropdown-menu.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/layout-dashboard.js [client] (ecmascript) <export default as LayoutDashboard>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/package.js [client] (ecmascript) <export default as Package>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/shopping-cart.js [client] (ecmascript) <export default as ShoppingCart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/bell.js [client] (ecmascript) <export default as Bell>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/store.js [client] (ecmascript) <export default as Store>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [client] (ecmascript) <export default as User>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
// Helper NavLink component (no changes)
function NavLink({ href, icon: Icon, children }) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const isActive = router.pathname.startsWith(href);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
        href: href,
        legacyBehavior: true,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
            className: "w-full",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                variant: isActive ? "secondary" : "ghost",
                className: "w-full justify-start text-left",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                        className: "mr-2 h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this),
                    children
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/WholesalerLayout.jsx",
                lineNumber: 33,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/WholesalerLayout.jsx",
            lineNumber: 32,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/WholesalerLayout.jsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
_s(NavLink, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = NavLink;
function WholesalerLayout({ children }) {
    _s1();
    // --- THIS IS THE FIX ---
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])(); // Get the router
    const handleLogout = ()=>{
        localStorage.removeItem("token"); //
        router.push("/login"); //
    };
    // --- END FIX ---
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-100/50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: "fixed top-0 left-0 z-40 flex h-screen w-[250px] flex-col gap-2 border-r bg-gray-900 text-white",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex h-[60px] items-center border-b px-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/wholesaler/dashboard",
                            className: "flex items-center gap-2 font-semibold",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$store$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Store$3e$__["Store"], {
                                    className: "h-6 w-6"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/WholesalerLayout.jsx",
                                    lineNumber: 62,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "",
                                    children: "Arik Dashboard"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/WholesalerLayout.jsx",
                                    lineNumber: 63,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/WholesalerLayout.jsx",
                            lineNumber: 61,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex-1 overflow-auto px-4 py-4 space-y-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                href: "/wholesaler/dashboard",
                                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$layout$2d$dashboard$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LayoutDashboard$3e$__["LayoutDashboard"],
                                children: "DASHBOARD"
                            }, void 0, false, {
                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                href: "/wholesaler/products",
                                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$package$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Package$3e$__["Package"],
                                children: "ALL PRODUCTS"
                            }, void 0, false, {
                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                lineNumber: 71,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NavLink, {
                                href: "/wholesaler/orders",
                                icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$shopping$2d$cart$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ShoppingCart$3e$__["ShoppingCart"],
                                children: "ORDER LIST"
                            }, void 0, false, {
                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                lineNumber: 74,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/WholesalerLayout.jsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col ml-[250px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "flex h-[60px] items-center gap-4 border-b bg-white px-6 sticky top-0 z-30",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                                    className: "h-4 w-4 text-gray-500"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/WholesalerLayout.jsx",
                                    lineNumber: 86,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                variant: "ghost",
                                size: "icon",
                                className: "rounded-full",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$bell$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Bell$3e$__["Bell"], {
                                    className: "h-4 w-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/WholesalerLayout.jsx",
                                    lineNumber: 89,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                lineNumber: 88,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenu"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenuTrigger"], {
                                        asChild: true,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                            variant: "ghost",
                                            size: "icon",
                                            className: "rounded-full",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$avatar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Avatar"], {
                                                className: "h-8 w-8",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$avatar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AvatarImage"], {
                                                        src: "/path-to-avatar.png",
                                                        alt: "Admin"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                        lineNumber: 95,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$avatar$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AvatarFallback"], {
                                                        children: "W"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                        lineNumber: 96,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                lineNumber: 94,
                                                columnNumber: 17
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/WholesalerLayout.jsx",
                                            lineNumber: 93,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                                        lineNumber: 92,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenuContent"], {
                                        align: "end",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenuLabel"], {
                                                children: "My Account"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                lineNumber: 101,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenuSeparator"], {}, void 0, false, {
                                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                lineNumber: 102,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                                asChild: true,
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/profile",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                                                            className: "mr-2 h-4 w-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                            lineNumber: 106,
                                                            columnNumber: 19
                                                        }, this),
                                                        " Profile"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                    lineNumber: 105,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                lineNumber: 104,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                                children: "Settings"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                lineNumber: 110,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dropdown$2d$menu$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DropdownMenuItem"], {
                                                onSelect: handleLogout,
                                                children: "Logout"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                                lineNumber: 112,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                                        lineNumber: 100,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/WholesalerLayout.jsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "flex-1 p-6",
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/src/components/WholesalerLayout.jsx",
                        lineNumber: 121,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/WholesalerLayout.jsx",
                lineNumber: 81,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/WholesalerLayout.jsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_s1(WholesalerLayout, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c1 = WholesalerLayout;
var _c, _c1;
__turbopack_context__.k.register(_c, "NavLink");
__turbopack_context__.k.register(_c1, "WholesalerLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/input.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
const Input = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, type, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/input.jsx",
        lineNumber: 7,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Input;
Input.displayName = "Input";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Input$React.forwardRef");
__turbopack_context__.k.register(_c1, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/badge.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "badgeVariants",
    ()=>badgeVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
;
const badgeVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
            secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
            outline: "text-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function Badge({ className, variant, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])(badgeVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/badge.jsx",
        lineNumber: 31,
        columnNumber: 11
    }, this);
}
_c = Badge;
;
var _c;
__turbopack_context__.k.register(_c, "Badge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/TagsInput.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/components/TagsInput.jsx
__turbopack_context__.s([
    "default",
    ()=>TagsInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/input.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/badge.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [client] (ecmascript) <export default as X>");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
function TagsInput({ tags, setTags }) {
    _s();
    const [inputValue, setInputValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const handleKeyDown = (e)=>{
        // Check for "Enter" or "Comma"
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault(); // Stop the form from submitting
            addTag();
        }
    };
    const addTag = ()=>{
        const newTag = inputValue.trim();
        if (newTag && !tags.includes(newTag)) {
            setTags([
                ...tags,
                newTag
            ]);
        }
        setInputValue(''); // Clear the input
    };
    const removeTag = (tagToRemove)=>{
        setTags(tags.filter((tag)=>tag !== tagToRemove));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                id: "tags-input",
                value: inputValue,
                onChange: (e)=>setInputValue(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: "Type a category or tag and press Enter..."
            }, void 0, false, {
                fileName: "[project]/src/components/TagsInput.jsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-muted-foreground",
                children: "Press Enter or add a comma after each tag."
            }, void 0, false, {
                fileName: "[project]/src/components/TagsInput.jsx",
                lineNumber: 47,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap gap-2 rounded-md border p-2 min-h-[40px]",
                children: tags.map((tag, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$badge$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Badge"], {
                        variant: "secondary",
                        className: "flex items-center gap-1",
                        children: [
                            tag,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                className: "rounded-full hover:bg-muted-foreground/20 p-0.5",
                                onClick: ()=>removeTag(tag),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                    className: "h-3 w-3"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/TagsInput.jsx",
                                    lineNumber: 59,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/TagsInput.jsx",
                                lineNumber: 54,
                                columnNumber: 13
                            }, this)
                        ]
                    }, index, true, {
                        fileName: "[project]/src/components/TagsInput.jsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/TagsInput.jsx",
                lineNumber: 50,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/TagsInput.jsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
}
_s(TagsInput, "SORcW8kVWUa8fZ+un8oXhp/OLnk=");
_c = TagsInput;
var _c;
__turbopack_context__.k.register(_c, "TagsInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/card.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("rounded-xl border bg-card text-card-foreground shadow", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.jsx",
        lineNumber: 6,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Card;
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.jsx",
        lineNumber: 14,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = CardHeader;
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.jsx",
        lineNumber: 22,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = CardTitle;
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.jsx",
        lineNumber: 30,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c7 = CardDescription;
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.jsx",
        lineNumber: 38,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c9 = CardContent;
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.jsx",
        lineNumber: 43,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c11 = CardFooter;
CardFooter.displayName = "CardFooter";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "Card$React.forwardRef");
__turbopack_context__.k.register(_c1, "Card");
__turbopack_context__.k.register(_c2, "CardHeader$React.forwardRef");
__turbopack_context__.k.register(_c3, "CardHeader");
__turbopack_context__.k.register(_c4, "CardTitle$React.forwardRef");
__turbopack_context__.k.register(_c5, "CardTitle");
__turbopack_context__.k.register(_c6, "CardDescription$React.forwardRef");
__turbopack_context__.k.register(_c7, "CardDescription");
__turbopack_context__.k.register(_c8, "CardContent$React.forwardRef");
__turbopack_context__.k.register(_c9, "CardContent");
__turbopack_context__.k.register(_c10, "CardFooter$React.forwardRef");
__turbopack_context__.k.register(_c11, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/textarea.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Textarea",
    ()=>Textarea
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
const Textarea = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/textarea.jsx",
        lineNumber: 7,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Textarea;
Textarea.displayName = "Textarea";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Textarea$React.forwardRef");
__turbopack_context__.k.register(_c1, "Textarea");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/label.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Label",
    ()=>Label
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-label/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
;
;
const labelVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["cva"])("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])(labelVariants(), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/label.jsx",
        lineNumber: 12,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Label;
Label.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$label$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"].displayName;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Label$React.forwardRef");
__turbopack_context__.k.register(_c1, "Label");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/separator.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Separator",
    ()=>Separator
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-separator/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
;
const Separator = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, orientation = "horizontal", decorative = true, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        decorative: decorative,
        orientation: orientation,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/separator.jsx",
        lineNumber: 10,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Separator;
Separator.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$separator$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"].displayName;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Separator$React.forwardRef");
__turbopack_context__.k.register(_c1, "Separator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/alert.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Alert",
    ()=>Alert,
    "AlertDescription",
    ()=>AlertDescription,
    "AlertTitle",
    ()=>AlertTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
;
const alertVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["cva"])("relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7", {
    variants: {
        variant: {
            default: "bg-background text-foreground",
            destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Alert = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, variant, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        role: "alert",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])(alertVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.jsx",
        lineNumber: 23,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Alert;
Alert.displayName = "Alert";
const AlertTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("mb-1 font-medium leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.jsx",
        lineNumber: 32,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = AlertTitle;
AlertTitle.displayName = "AlertTitle";
const AlertDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-sm [&_p]:leading-relaxed", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.jsx",
        lineNumber: 40,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = AlertDescription;
AlertDescription.displayName = "AlertDescription";
;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "Alert$React.forwardRef");
__turbopack_context__.k.register(_c1, "Alert");
__turbopack_context__.k.register(_c2, "AlertTitle$React.forwardRef");
__turbopack_context__.k.register(_c3, "AlertTitle");
__turbopack_context__.k.register(_c4, "AlertDescription$React.forwardRef");
__turbopack_context__.k.register(_c5, "AlertDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/pages/wholesaler/products/new.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/pages/wholesaler/products/new.js
__turbopack_context__.s([
    "default",
    ()=>NewProductPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuthGuard$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useAuthGuard.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WholesalerLayout$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/WholesalerLayout.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TagsInput$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/TagsInput.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/card.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/input.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$textarea$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/textarea.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/label.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/separator.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/alert.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [client] (ecmascript) <export default as PlusCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$locate$2d$fixed$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LocateFixed$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/locate-fixed.js [client] (ecmascript) <export default as LocateFixed>");
// Google Maps/Places API imports
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-google-maps/api/dist/esm.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/use-places-autocomplete/dist/index.esm.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
const libraries = [
    "places"
];
// --- EXTENDED COUNTRY DATA ---
const COUNTRY_DATA = [
    {
        country: "Afghanistan",
        code: "+93",
        flag: "🇦🇫",
        lat: 33.9391,
        lng: 67.7099,
        iso2: "AF"
    },
    {
        country: "Albania",
        code: "+355",
        flag: "🇦🇱",
        lat: 41.1533,
        lng: 20.1683,
        iso2: "AL"
    },
    {
        country: "Algeria",
        code: "+213",
        flag: "🇩🇿",
        lat: 28.0339,
        lng: 1.6596,
        iso2: "DZ"
    },
    {
        country: "Andorra",
        code: "+376",
        flag: "🇦🇩",
        lat: 42.5462,
        lng: 1.6015,
        iso2: "AD"
    },
    {
        country: "Angola",
        code: "+244",
        flag: "🇦🇴",
        lat: -11.2027,
        lng: 17.8739,
        iso2: "AO"
    },
    {
        country: "Antigua and Barbuda",
        code: "+1268",
        flag: "🇦🇬",
        lat: 17.0608,
        lng: -61.7964,
        iso2: "AG"
    },
    {
        country: "Argentina",
        code: "+54",
        flag: "🇦🇷",
        lat: -38.4161,
        lng: -63.6167,
        iso2: "AR"
    },
    {
        country: "Armenia",
        code: "+374",
        flag: "🇦🇲",
        lat: 40.0691,
        lng: 45.0382,
        iso2: "AM"
    },
    {
        country: "Australia",
        code: "+61",
        flag: "🇦🇺",
        lat: -25.2744,
        lng: 133.7751,
        iso2: "AU"
    },
    {
        country: "Austria",
        code: "+43",
        flag: "🇦🇹",
        lat: 47.5162,
        lng: 14.5501,
        iso2: "AT"
    },
    {
        country: "Azerbaijan",
        code: "+994",
        flag: "🇦🇿",
        lat: 40.1431,
        lng: 47.5769,
        iso2: "AZ"
    },
    {
        country: "Bahamas",
        code: "+1242",
        flag: "🇧🇸",
        lat: 25.0343,
        lng: -77.3963,
        iso2: "BS"
    },
    {
        country: "Bahrain",
        code: "+973",
        flag: "🇧🇭",
        lat: 25.9304,
        lng: 50.6378,
        iso2: "BH"
    },
    {
        country: "Bangladesh",
        code: "+880",
        flag: "🇧🇩",
        lat: 23.685,
        lng: 90.3563,
        iso2: "BD"
    },
    {
        country: "Barbados",
        code: "+1246",
        flag: "🇧🇧",
        lat: 13.1939,
        lng: -59.5432,
        iso2: "BB"
    },
    {
        country: "Belarus",
        code: "+375",
        flag: "🇧🇾",
        lat: 53.7098,
        lng: 27.9534,
        iso2: "BY"
    },
    {
        country: "Belgium",
        code: "+32",
        flag: "🇧🇪",
        lat: 50.5039,
        lng: 4.4699,
        iso2: "BE"
    },
    {
        country: "Belize",
        code: "+501",
        flag: "🇧🇿",
        lat: 17.1899,
        lng: -88.4977,
        iso2: "BZ"
    },
    {
        country: "Benin",
        code: "+229",
        flag: "🇧🇯",
        lat: 9.3077,
        lng: 2.3158,
        iso2: "BJ"
    },
    {
        country: "Bhutan",
        code: "+975",
        flag: "🇧🇹",
        lat: 27.5142,
        lng: 90.4336,
        iso2: "BT"
    },
    {
        country: "Bolivia",
        code: "+591",
        flag: "🇧🇴",
        lat: -16.2902,
        lng: -63.5887,
        iso2: "BO"
    },
    {
        country: "Bosnia and Herzegovina",
        code: "+387",
        flag: "🇧🇦",
        lat: 43.9159,
        lng: 17.6791,
        iso2: "BA"
    },
    {
        country: "Botswana",
        code: "+267",
        flag: "🇧🇼",
        lat: -22.3285,
        lng: 24.6849,
        iso2: "BW"
    },
    {
        country: "Brazil",
        code: "+55",
        flag: "🇧🇷",
        lat: -14.235,
        lng: -51.9253,
        iso2: "BR"
    },
    {
        country: "Brunei",
        code: "+673",
        flag: "🇧🇳",
        lat: 4.5353,
        lng: 114.7277,
        iso2: "BN"
    },
    {
        country: "Bulgaria",
        code: "+359",
        flag: "🇧🇬",
        lat: 42.7339,
        lng: 25.4858,
        iso2: "BG"
    },
    {
        country: "Burkina Faso",
        code: "+226",
        flag: "🇧🇫",
        lat: 12.2383,
        lng: -1.5616,
        iso2: "BF"
    },
    {
        country: "Burundi",
        code: "+257",
        flag: "🇧🇮",
        lat: -3.3731,
        lng: 29.9189,
        iso2: "BI"
    },
    {
        country: "Cabo Verde",
        code: "+238",
        flag: "🇨🇻",
        lat: 16.0021,
        lng: -24.0132,
        iso2: "CV"
    },
    {
        country: "Cambodia",
        code: "+855",
        flag: "🇰🇭",
        lat: 12.5657,
        lng: 104.991,
        iso2: "KH"
    },
    {
        country: "Cameroon",
        code: "+237",
        flag: "🇨🇲",
        lat: 7.3697,
        lng: 12.3547,
        iso2: "CM"
    },
    {
        country: "Canada",
        code: "+1",
        flag: "🇨🇦",
        lat: 56.1304,
        lng: -106.3468,
        iso2: "CA"
    },
    {
        country: "Central African Republic",
        code: "+236",
        flag: "🇨🇫",
        lat: 6.6111,
        lng: 20.9394,
        iso2: "CF"
    },
    {
        country: "Chad",
        code: "+235",
        flag: "🇹🇩",
        lat: 15.4542,
        lng: 18.7322,
        iso2: "TD"
    },
    {
        country: "Chile",
        code: "+56",
        flag: "🇨🇱",
        lat: -35.6751,
        lng: -71.543,
        iso2: "CL"
    },
    {
        country: "China",
        code: "+86",
        flag: "🇨🇳",
        lat: 35.8617,
        lng: 104.1954,
        iso2: "CN"
    },
    {
        country: "Colombia",
        code: "+57",
        flag: "🇨🇴",
        lat: 4.5709,
        lng: -74.2973,
        iso2: "CO"
    },
    {
        country: "Comoros",
        code: "+269",
        flag: "🇰🇲",
        lat: -11.875,
        lng: 43.8722,
        iso2: "KM"
    },
    {
        country: "Congo (Brazzaville)",
        code: "+242",
        flag: "🇨🇬",
        lat: -0.228,
        lng: 15.8277,
        iso2: "CG"
    },
    {
        country: "Congo (Kinshasa)",
        code: "+243",
        flag: "🇨🇩",
        lat: -4.0383,
        lng: 21.7587,
        iso2: "CD"
    },
    {
        country: "Costa Rica",
        code: "+506",
        flag: "🇨🇷",
        lat: 9.7489,
        lng: -83.7534,
        iso2: "CR"
    },
    {
        country: "Croatia",
        code: "+385",
        flag: "🇭🇷",
        lat: 45.1,
        lng: 15.2,
        iso2: "HR"
    },
    {
        country: "Cuba",
        code: "+53",
        flag: "🇨🇺",
        lat: 21.5218,
        lng: -77.7812,
        iso2: "CU"
    },
    {
        country: "Cyprus",
        code: "+357",
        flag: "🇨🇾",
        lat: 35.1264,
        lng: 33.4299,
        iso2: "CY"
    },
    {
        country: "Czechia",
        code: "+420",
        flag: "🇨🇿",
        lat: 49.8175,
        lng: 15.4729,
        iso2: "CZ"
    },
    {
        country: "Denmark",
        code: "+45",
        flag: "🇩🇰",
        lat: 56.2639,
        lng: 9.5018,
        iso2: "DK"
    },
    {
        country: "Djibouti",
        code: "+253",
        flag: "🇩🇯",
        lat: 11.8251,
        lng: 42.5903,
        iso2: "DJ"
    },
    {
        country: "Dominica",
        code: "+1767",
        flag: "🇩🇲",
        lat: 15.415,
        lng: -61.371,
        iso2: "DM"
    },
    {
        country: "Dominican Republic",
        code: "+1809",
        flag: "🇩🇴",
        lat: 18.7357,
        lng: -70.1626,
        iso2: "DO"
    },
    {
        country: "East Timor",
        code: "+670",
        flag: "🇹🇱",
        lat: -8.8742,
        lng: 125.7275,
        iso2: "TL"
    },
    {
        country: "Ecuador",
        code: "+593",
        flag: "🇪🇨",
        lat: -1.8312,
        lng: -78.1834,
        iso2: "EC"
    },
    {
        country: "Egypt",
        code: "+20",
        flag: "🇪🇬",
        lat: 26.8206,
        lng: 30.8025,
        iso2: "EG"
    },
    {
        country: "El Salvador",
        code: "+503",
        flag: "🇸🇻",
        lat: 13.7942,
        lng: -88.8965,
        iso2: "SV"
    },
    {
        country: "Equatorial Guinea",
        code: "+240",
        flag: "🇬🇶",
        lat: 1.6508,
        lng: 10.2679,
        iso2: "GQ"
    },
    {
        country: "Eritrea",
        code: "+291",
        flag: "🇪🇷",
        lat: 15.1794,
        lng: 39.7823,
        iso2: "ER"
    },
    {
        country: "Estonia",
        code: "+372",
        flag: "🇪🇪",
        lat: 58.5953,
        lng: 25.0136,
        iso2: "EE"
    },
    {
        country: "Eswatini",
        code: "+268",
        flag: "🇸🇿",
        lat: -26.5225,
        lng: 31.4659,
        iso2: "SZ"
    },
    {
        country: "Ethiopia",
        code: "+251",
        flag: "🇪🇹",
        lat: 9.145,
        lng: 40.4897,
        iso2: "ET"
    },
    {
        country: "Fiji",
        code: "+679",
        flag: "🇫🇯",
        lat: -16.5782,
        lng: 179.4145,
        iso2: "FJ"
    },
    {
        country: "Finland",
        code: "+358",
        flag: "🇫🇮",
        lat: 61.9241,
        lng: 25.7482,
        iso2: "FI"
    },
    {
        country: "France",
        code: "+33",
        flag: "🇫🇷",
        lat: 46.2276,
        lng: 2.2137,
        iso2: "FR"
    },
    {
        country: "Gabon",
        code: "+241",
        flag: "🇬🇦",
        lat: -0.8037,
        lng: 11.6094,
        iso2: "GA"
    },
    {
        country: "Gambia",
        code: "+220",
        flag: "🇬🇲",
        lat: 13.4432,
        lng: -15.3101,
        iso2: "GM"
    },
    {
        country: "Georgia",
        code: "+995",
        flag: "🇬🇪",
        lat: 42.3154,
        lng: 43.3569,
        iso2: "GE"
    },
    {
        country: "Germany",
        code: "+49",
        flag: "🇩🇪",
        lat: 51.1657,
        lng: 10.4515,
        iso2: "DE"
    },
    {
        country: "Ghana",
        code: "+233",
        flag: "🇬🇭",
        lat: 7.9465,
        lng: -1.0232,
        iso2: "GH"
    },
    {
        country: "Greece",
        code: "+30",
        flag: "🇬🇷",
        lat: 39.0742,
        lng: 21.8243,
        iso2: "GR"
    },
    {
        country: "Grenada",
        code: "+1473",
        flag: "🇬🇩",
        lat: 12.2628,
        lng: -61.6042,
        iso2: "GD"
    },
    {
        country: "Guatemala",
        code: "+502",
        flag: "🇬🇹",
        lat: 15.7835,
        lng: -90.2308,
        iso2: "GT"
    },
    {
        country: "Guinea",
        code: "+224",
        flag: "🇬🇳",
        lat: 9.9456,
        lng: -9.6966,
        iso2: "GN"
    },
    {
        country: "Guinea-Bissau",
        code: "+245",
        flag: "🇬🇼",
        lat: 11.8037,
        lng: -15.1804,
        iso2: "GW"
    },
    {
        country: "Guyana",
        code: "+592",
        flag: "🇬🇾",
        lat: 4.8604,
        lng: -58.9302,
        iso2: "GY"
    },
    {
        country: "Haiti",
        code: "+509",
        flag: "🇭🇹",
        lat: 18.9712,
        lng: -72.2852,
        iso2: "HT"
    },
    {
        country: "Honduras",
        code: "+504",
        flag: "🇭🇳",
        lat: 15.1999,
        lng: -86.2419,
        iso2: "HN"
    },
    {
        country: "Hungary",
        code: "+36",
        flag: "🇭🇺",
        lat: 47.1625,
        lng: 19.5033,
        iso2: "HU"
    },
    {
        country: "Iceland",
        code: "+354",
        flag: "🇮🇸",
        lat: 64.9631,
        lng: -19.0208,
        iso2: "IS"
    },
    {
        country: "India",
        code: "+91",
        flag: "🇮🇳",
        lat: 20.5937,
        lng: 78.9629,
        iso2: "IN"
    },
    {
        country: "Indonesia",
        code: "+62",
        flag: "🇮🇩",
        lat: -0.7893,
        lng: 113.9213,
        iso2: "ID"
    },
    {
        country: "Iran",
        code: "+98",
        flag: "🇮🇷",
        lat: 32.4279,
        lng: 53.688,
        iso2: "IR"
    },
    {
        country: "Iraq",
        code: "+964",
        flag: "🇮🇶",
        lat: 33.2232,
        lng: 43.6793,
        iso2: "IQ"
    },
    {
        country: "Ireland",
        code: "+353",
        flag: "🇮🇪",
        lat: 53.4129,
        lng: -8.2439,
        iso2: "IE"
    },
    {
        country: "Israel",
        code: "+972",
        flag: "🇮🇱",
        lat: 31.0461,
        lng: 34.8516,
        iso2: "IL"
    },
    {
        country: "Italy",
        code: "+39",
        flag: "🇮🇹",
        lat: 41.8719,
        lng: 12.5674,
        iso2: "IT"
    },
    {
        country: "Jamaica",
        code: "+1876",
        flag: "🇯🇲",
        lat: 18.1096,
        lng: -77.2975,
        iso2: "JM"
    },
    {
        country: "Japan",
        code: "+81",
        flag: "🇯🇵",
        lat: 36.2048,
        lng: 138.2529,
        iso2: "JP"
    },
    {
        country: "Jordan",
        code: "+962",
        flag: "🇯🇴",
        lat: 30.5852,
        lng: 36.2384,
        iso2: "JO"
    },
    {
        country: "Kazakhstan",
        code: "+7",
        flag: "🇰🇿",
        lat: 48.0196,
        lng: 66.9237,
        iso2: "KZ"
    },
    {
        country: "Kenya",
        code: "+254",
        flag: "🇰🇪",
        lat: -0.0236,
        lng: 37.9062,
        iso2: "KE"
    },
    {
        country: "Kiribati",
        code: "+686",
        flag: "🇰🇮",
        lat: -3.3704,
        lng: -168.734,
        iso2: "KI"
    },
    {
        country: "Kuwait",
        code: "+965",
        flag: "🇰🇼",
        lat: 29.3117,
        lng: 47.4818,
        iso2: "KW"
    },
    {
        country: "Kyrgyzstan",
        code: "+996",
        flag: "🇰🇬",
        lat: 41.2044,
        lng: 74.7661,
        iso2: "KG"
    },
    {
        country: "Laos",
        code: "+856",
        flag: "🇱🇦",
        lat: 19.8563,
        lng: 102.4955,
        iso2: "LA"
    },
    {
        country: "Latvia",
        code: "+371",
        flag: "🇱🇻",
        lat: 56.8796,
        lng: 24.6032,
        iso2: "LV"
    },
    {
        country: "Lebanon",
        code: "+961",
        flag: "🇱🇧",
        lat: 33.8547,
        lng: 35.8623,
        iso2: "LB"
    },
    {
        country: "Lesotho",
        code: "+266",
        flag: "🇱🇸",
        lat: -29.6099,
        lng: 28.2336,
        iso2: "LS"
    },
    {
        country: "Liberia",
        code: "+231",
        flag: "🇱🇷",
        lat: 6.4281,
        lng: -9.4295,
        iso2: "LR"
    },
    {
        country: "Libya",
        code: "+218",
        flag: "🇱🇾",
        lat: 26.3351,
        lng: 17.2283,
        iso2: "LY"
    },
    {
        country: "Liechtenstein",
        code: "+423",
        flag: "🇱🇮",
        lat: 47.166,
        lng: 9.5554,
        iso2: "LI"
    },
    {
        country: "Lithuania",
        code: "+370",
        flag: "🇱🇹",
        lat: 55.1694,
        lng: 23.8813,
        iso2: "LT"
    },
    {
        country: "Luxembourg",
        code: "+352",
        flag: "🇱🇺",
        lat: 49.8153,
        lng: 6.1296,
        iso2: "LU"
    },
    {
        country: "Madagascar",
        code: "+261",
        flag: "🇲🇬",
        lat: -18.7669,
        lng: 46.8691,
        iso2: "MG"
    },
    {
        country: "Malawi",
        code: "+265",
        flag: "🇲🇼",
        lat: -13.2543,
        lng: 34.3015,
        iso2: "MW"
    },
    {
        country: "Malaysia",
        code: "+60",
        flag: "🇲🇾",
        lat: 4.2105,
        lng: 101.9758,
        iso2: "MY"
    },
    {
        country: "Maldives",
        code: "+960",
        flag: "🇲🇻",
        lat: 3.2028,
        lng: 73.2207,
        iso2: "MV"
    },
    {
        country: "Mali",
        code: "+223",
        flag: "🇲🇱",
        lat: 17.5707,
        lng: -3.9962,
        iso2: "ML"
    },
    {
        country: "Malta",
        code: "+356",
        flag: "🇲🇹",
        lat: 35.9375,
        lng: 14.3754,
        iso2: "MT"
    },
    {
        country: "Marshall Islands",
        code: "+692",
        flag: "🇲🇭",
        lat: 7.1315,
        lng: 171.1857,
        iso2: "MH"
    },
    {
        country: "Mauritania",
        code: "+222",
        flag: "🇲🇷",
        lat: 21.0079,
        lng: -10.9408,
        iso2: "MR"
    },
    {
        country: "Mauritius",
        code: "+230",
        flag: "🇲🇺",
        lat: -20.3484,
        lng: 57.5522,
        iso2: "MU"
    },
    {
        country: "Mexico",
        code: "+52",
        flag: "🇲🇽",
        lat: 23.6345,
        lng: -102.5528,
        iso2: "MX"
    },
    {
        country: "Micronesia",
        code: "+691",
        flag: "🇫🇲",
        lat: 7.4256,
        lng: 150.5508,
        iso2: "FM"
    },
    {
        country: "Moldova",
        code: "+373",
        flag: "🇲🇩",
        lat: 47.4116,
        lng: 28.3699,
        iso2: "MD"
    },
    {
        country: "Monaco",
        code: "+377",
        flag: "🇲🇨",
        lat: 43.7333,
        lng: 7.4167,
        iso2: "MC"
    },
    {
        country: "Mongolia",
        code: "+976",
        flag: "🇲🇳",
        lat: 46.8625,
        lng: 103.8467,
        iso2: "MN"
    },
    {
        country: "Montenegro",
        code: "+382",
        flag: "🇲🇪",
        lat: 42.7087,
        lng: 19.3743,
        iso2: "ME"
    },
    {
        country: "Morocco",
        code: "+212",
        flag: "🇲🇦",
        lat: 31.7917,
        lng: -7.0926,
        iso2: "MA"
    },
    {
        country: "Mozambique",
        code: "+258",
        flag: "🇲🇿",
        lat: -18.6657,
        lng: 35.5296,
        iso2: "MZ"
    },
    {
        country: "Myanmar",
        code: "+95",
        flag: "🇲🇲",
        lat: 21.914,
        lng: 95.9562,
        iso2: "MM"
    },
    {
        country: "Namibia",
        code: "+264",
        flag: "🇳🇦",
        lat: -22.9576,
        lng: 18.4904,
        iso2: "NA"
    },
    {
        country: "Nauru",
        code: "+674",
        flag: "🇳🇷",
        lat: -0.5228,
        lng: 166.9315,
        iso2: "NR"
    },
    {
        country: "Nepal",
        code: "+977",
        flag: "🇳🇵",
        lat: 28.3949,
        lng: 84.124,
        iso2: "NP"
    },
    {
        country: "Netherlands",
        code: "+31",
        flag: "🇳🇱",
        lat: 52.1326,
        lng: 5.2913,
        iso2: "NL"
    },
    {
        country: "New Zealand",
        code: "+64",
        flag: "🇳🇿",
        lat: -40.9006,
        lng: 174.886,
        iso2: "NZ"
    },
    {
        country: "Nicaragua",
        code: "+505",
        flag: "🇳🇮",
        lat: 12.8654,
        lng: -85.2072,
        iso2: "NI"
    },
    {
        country: "Niger",
        code: "+227",
        flag: "🇳🇪",
        lat: 17.6078,
        lng: 8.0817,
        iso2: "NE"
    },
    {
        country: "Nigeria",
        code: "+234",
        flag: "🇳🇬",
        lat: 9.082,
        lng: 8.6753,
        iso2: "NG"
    },
    {
        country: "North Korea",
        code: "+850",
        flag: "🇰🇵",
        lat: 40.3399,
        lng: 127.51,
        iso2: "KP"
    },
    {
        country: "North Macedonia",
        code: "+389",
        flag: "🇲🇰",
        lat: 41.6086,
        lng: 21.7453,
        iso2: "MK"
    },
    {
        country: "Norway",
        code: "+47",
        flag: "🇳🇴",
        lat: 60.472,
        lng: 8.4689,
        iso2: "NO"
    },
    {
        country: "Oman",
        code: "+968",
        flag: "🇴🇲",
        lat: 21.4735,
        lng: 55.9768,
        iso2: "OM"
    },
    {
        country: "Pakistan",
        code: "+92",
        flag: "🇵🇰",
        lat: 30.3753,
        lng: 69.3451,
        iso2: "PK"
    },
    {
        country: "Palau",
        code: "+680",
        flag: "🇵🇼",
        lat: 7.515,
        lng: 134.5825,
        iso2: "PW"
    },
    {
        country: "Panama",
        code: "+507",
        flag: "🇵🇦",
        lat: 8.538,
        lng: -80.7821,
        iso2: "PA"
    },
    {
        country: "Papua New Guinea",
        code: "+675",
        flag: "🇵🇬",
        lat: -6.315,
        lng: 143.9555,
        iso2: "PG"
    },
    {
        country: "Paraguay",
        code: "+595",
        flag: "🇵🇾",
        lat: -23.4425,
        lng: -58.4438,
        iso2: "PY"
    },
    {
        country: "Peru",
        code: "+51",
        flag: "🇵🇪",
        lat: -9.19,
        lng: -75.0152,
        iso2: "PE"
    },
    {
        country: "Philippines",
        code: "+63",
        flag: "🇵🇭",
        lat: 12.8797,
        lng: 121.774,
        iso2: "PH"
    },
    {
        country: "Poland",
        code: "+48",
        flag: "🇵🇱",
        lat: 51.9194,
        lng: 19.1451,
        iso2: "PL"
    },
    {
        country: "Portugal",
        code: "+351",
        flag: "🇵🇹",
        lat: 39.3999,
        lng: -8.2245,
        iso2: "PT"
    },
    {
        country: "Qatar",
        code: "+974",
        flag: "🇶🇦",
        lat: 25.3548,
        lng: 51.1839,
        iso2: "QA"
    },
    {
        country: "Romania",
        code: "+40",
        flag: "🇷🇴",
        lat: 45.9432,
        lng: 24.9668,
        iso2: "RO"
    },
    {
        country: "Russia",
        code: "+7",
        flag: "🇷🇺",
        lat: 61.524,
        lng: 105.3188,
        iso2: "RU"
    },
    {
        country: "Rwanda",
        code: "+250",
        flag: "🇷🇼",
        lat: -1.9403,
        lng: 29.8739,
        iso2: "RW"
    },
    {
        country: "Saint Kitts and Nevis",
        code: "+1869",
        flag: "🇰🇳",
        lat: 17.3578,
        lng: -62.783,
        iso2: "KN"
    },
    {
        country: "Saint Lucia",
        code: "+1758",
        flag: "🇱🇨",
        lat: 13.9094,
        lng: -60.9789,
        iso2: "LC"
    },
    {
        country: "Saint Vincent and the Grenadines",
        code: "+1784",
        flag: "🇻🇨",
        lat: 13.2505,
        lng: -61.2008,
        iso2: "VC"
    },
    {
        country: "Samoa",
        code: "+685",
        flag: "🇼🇸",
        lat: -13.759,
        lng: -172.1046,
        iso2: "WS"
    },
    {
        country: "San Marino",
        code: "+378",
        flag: "🇸🇲",
        lat: 43.9424,
        lng: 12.4578,
        iso2: "SM"
    },
    {
        country: "Sao Tome and Principe",
        code: "+239",
        flag: "🇸🇹",
        lat: 0.1864,
        lng: 6.6131,
        iso2: "ST"
    },
    {
        country: "Saudi Arabia",
        code: "+966",
        flag: "🇸🇦",
        lat: 23.8859,
        lng: 45.0792,
        iso2: "SA"
    },
    {
        country: "Senegal",
        code: "+221",
        flag: "🇸🇳",
        lat: 14.4974,
        lng: -14.4524,
        iso2: "SN"
    },
    {
        country: "Serbia",
        code: "+381",
        flag: "🇷🇸",
        lat: 44.0165,
        lng: 21.0059,
        iso2: "RS"
    },
    {
        country: "Seychelles",
        code: "+248",
        flag: "🇸🇨",
        lat: -4.6796,
        lng: 55.492,
        iso2: "SC"
    },
    {
        country: "Sierra Leone",
        code: "+232",
        flag: "🇸🇱",
        lat: 8.4606,
        lng: -11.7799,
        iso2: "SL"
    },
    {
        country: "Singapore",
        code: "+65",
        flag: "🇸🇬",
        lat: 1.3521,
        lng: 103.8198,
        iso2: "SG"
    },
    {
        country: "Slovakia",
        code: "+421",
        flag: "🇸🇰",
        lat: 48.669,
        lng: 19.699,
        iso2: "SK"
    },
    {
        country: "Slovenia",
        code: "+386",
        flag: "🇸🇮",
        lat: 46.1512,
        lng: 14.9955,
        iso2: "SI"
    },
    {
        country: "Solomon Islands",
        code: "+677",
        flag: "🇸🇧",
        lat: -9.6457,
        lng: 160.1562,
        iso2: "SB"
    },
    {
        country: "Somalia",
        code: "+252",
        flag: "🇸🇴",
        lat: 5.1521,
        lng: 46.1996,
        iso2: "SO"
    },
    {
        country: "South Africa",
        code: "+27",
        flag: "🇿🇦",
        lat: -30.5595,
        lng: 22.9375,
        iso2: "ZA"
    },
    {
        country: "South Korea",
        code: "+82",
        flag: "🇰🇷",
        lat: 35.9078,
        lng: 127.7692,
        iso2: "KR"
    },
    {
        country: "South Sudan",
        code: "+211",
        flag: "🇸🇸",
        lat: 6.877,
        lng: 31.307,
        iso2: "SS"
    },
    {
        country: "Spain",
        code: "+34",
        flag: "🇪🇸",
        lat: 40.4637,
        lng: -3.7492,
        iso2: "ES"
    },
    {
        country: "Sri Lanka",
        code: "+94",
        flag: "🇱🇰",
        lat: 7.8731,
        lng: 80.7718,
        iso2: "LK"
    },
    {
        country: "Sudan",
        code: "+249",
        flag: "🇸🇩",
        lat: 12.8628,
        lng: 30.2176,
        iso2: "SD"
    },
    {
        country: "Suriname",
        code: "+597",
        flag: "🇸🇷",
        lat: 3.9193,
        lng: -56.0278,
        iso2: "SR"
    },
    {
        country: "Sweden",
        code: "+46",
        flag: "🇸🇪",
        lat: 60.1282,
        lng: 18.6435,
        iso2: "SE"
    },
    {
        country: "Switzerland",
        code: "+41",
        flag: "🇨🇭",
        lat: 46.8182,
        lng: 8.2275,
        iso2: "CH"
    },
    {
        country: "Syria",
        code: "+963",
        flag: "🇸🇾",
        lat: 34.8021,
        lng: 38.9968,
        iso2: "SY"
    },
    {
        country: "Taiwan",
        code: "+886",
        flag: "🇹🇼",
        lat: 23.6978,
        lng: 120.9605,
        iso2: "TW"
    },
    {
        country: "Tajikistan",
        code: "+992",
        flag: "🇹🇯",
        lat: 38.861,
        lng: 71.2761,
        iso2: "TJ"
    },
    {
        country: "Tanzania",
        code: "+255",
        flag: "🇹🇿",
        lat: -6.369,
        lng: 34.8888,
        iso2: "TZ"
    },
    {
        country: "Thailand",
        code: "+66",
        flag: "🇹🇭",
        lat: 15.87,
        lng: 100.9925,
        iso2: "TH"
    },
    {
        country: "Togo",
        code: "+228",
        flag: "🇹🇬",
        lat: 8.6195,
        lng: 0.8248,
        iso2: "TG"
    },
    {
        country: "Tonga",
        code: "+676",
        flag: "🇹🇴",
        lat: -20.4298,
        lng: -174.989,
        iso2: "TO"
    },
    {
        country: "Trinidad and Tobago",
        code: "+1868",
        flag: "🇹🇹",
        lat: 10.6918,
        lng: -61.2225,
        iso2: "TT"
    },
    {
        country: "Tunisia",
        code: "+216",
        flag: "🇹🇳",
        lat: 33.8869,
        lng: 9.5375,
        iso2: "TN"
    },
    {
        country: "Turkey",
        code: "+90",
        flag: "🇹🇷",
        lat: 38.9637,
        lng: 35.2433,
        iso2: "TR"
    },
    {
        country: "Turkmenistan",
        code: "+993",
        flag: "🇹🇲",
        lat: 38.9697,
        lng: 59.5563,
        iso2: "TM"
    },
    {
        country: "Tuvalu",
        code: "+688",
        flag: "🇹🇻",
        lat: -7.1095,
        lng: 177.6493,
        iso2: "TV"
    },
    {
        country: "Uganda",
        code: "+256",
        flag: "🇺🇬",
        lat: 1.3733,
        lng: 32.2903,
        iso2: "UG"
    },
    {
        country: "Ukraine",
        code: "+380",
        flag: "🇺🇦",
        lat: 48.3794,
        lng: 31.1656,
        iso2: "UA"
    },
    {
        country: "United Arab Emirates",
        code: "+971",
        flag: "🇦🇪",
        lat: 23.4241,
        lng: 53.8478,
        iso2: "AE"
    },
    {
        country: "United Kingdom",
        code: "+44",
        flag: "🇬🇧",
        lat: 55.3781,
        lng: -3.436,
        iso2: "GB"
    },
    {
        country: "United States",
        code: "+1",
        flag: "🇺🇸",
        lat: 39.8283,
        lng: -98.5795,
        iso2: "US"
    },
    {
        country: "Uruguay",
        code: "+598",
        flag: "🇺🇾",
        lat: -32.5228,
        lng: -55.7658,
        iso2: "UY"
    },
    {
        country: "Uzbekistan",
        code: "+998",
        flag: "🇺🇿",
        lat: 41.3775,
        lng: 64.5853,
        iso2: "UZ"
    },
    {
        country: "Vanuatu",
        code: "+678",
        flag: "🇻🇺",
        lat: -15.3768,
        lng: 166.9592,
        iso2: "VU"
    },
    {
        country: "Vatican City",
        code: "+379",
        flag: "🇻🇦",
        lat: 41.9029,
        lng: 12.4534,
        iso2: "VA"
    },
    {
        country: "Venezuela",
        code: "+58",
        flag: "🇻🇪",
        lat: 6.4238,
        lng: -66.5897,
        iso2: "VE"
    },
    {
        country: "Vietnam",
        code: "+84",
        flag: "🇻🇳",
        lat: 14.0583,
        lng: 108.2772,
        iso2: "VN"
    },
    {
        country: "Yemen",
        code: "+967",
        flag: "🇾🇪",
        lat: 15.5527,
        lng: 48.5164,
        iso2: "YE"
    },
    {
        country: "Zambia",
        code: "+260",
        flag: "🇿🇲",
        lat: -13.1339,
        lng: 27.8493,
        iso2: "ZM"
    },
    {
        country: "Zimbabwe",
        code: "+263",
        flag: "🇿🇼",
        lat: -19.0154,
        lng: 29.1549,
        iso2: "ZW"
    }
].sort(_c = (a, b)=>a.country.localeCompare(b.country));
_c1 = COUNTRY_DATA;
// Helper to check if locationData has coordinates (needed for saving)
const isLocationSet = (loc)=>loc && loc.location?.coordinates?.[0] !== 0;
// Helper to map user address fields to product warehouse fields
const mapAddressToWarehouse = (address)=>{
    if (!address || !address.location || !address.location.coordinates) return null;
    return {
        address: `${address.label}: ${address.addressLine1} ${address.addressLine2 || ""}`,
        location: {
            type: "Point",
            coordinates: address.location.coordinates
        },
        city: address.city,
        state: address.state,
        country: address.country
    };
};
// Helper to decode user info for setting initial address form data
function getUserInfoFromToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const token = localStorage.getItem("token");
    if (!token) return {
        id: null,
        email: null,
        name: null,
        phone: null,
        isLoggedIn: false
    };
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return {
            id: payload.id,
            email: payload.email,
            name: payload.name,
            phone: payload.phone,
            isLoggedIn: true
        };
    } catch (e) {
        return {
            id: null,
            email: null,
            name: null,
            phone: null,
            isLoggedIn: false
        };
    }
}
function NewProductPage() {
    _s();
    const { isLoading: isAuthLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuthGuard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAuthGuard"])("WHOLESALER");
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isUploading, setIsUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [addressesLoading, setAddressesLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [userDetails, setUserDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(getUserInfoFromToken());
    // Form State
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [description, setDescription] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [price, setPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [brand, setBrand] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [tags, setTags] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    // Address/Location State
    const [userAddresses, setUserAddresses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedAddressId, setSelectedAddressId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [locationData, setLocationData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Other product state
    const [sizes, setSizes] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([
        {
            size: "S",
            sku: "",
            stock: 0
        }
    ]);
    const [imageFiles, setImageFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [imagePreviews, setImagePreviews] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [sizeChartFile, setSizeChartFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sizeChartPreview, setSizeChartPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [sizeChartName, setSizeChartName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Address selection handler
    const handleAddressSelectFromModal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NewProductPage.useCallback[handleAddressSelectFromModal]": (addressId)=>{
            setSelectedAddressId(addressId);
            setIsAddressModalOpen(false);
            const selected = userAddresses.find({
                "NewProductPage.useCallback[handleAddressSelectFromModal].selected": (addr)=>addr._id.toString() === addressId
            }["NewProductPage.useCallback[handleAddressSelectFromModal].selected"]);
            if (selected) {
                setLocationData(mapAddressToWarehouse(selected));
            } else {
                setLocationData(null);
            }
        }
    }["NewProductPage.useCallback[handleAddressSelectFromModal]"], [
        userAddresses
    ]);
    // Save new address to profile (called from AddressCreationForm via modal)
    const handleSaveNewAddressToProfile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NewProductPage.useCallback[handleSaveNewAddressToProfile]": async (newAddress)=>{
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const profileRes = await fetch("/api/user/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const { user } = await profileRes.json();
                const updatedAddresses = [
                    ...user.addresses || [],
                    newAddress
                ];
                const res = await fetch("/api/user/profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        addresses: updatedAddresses
                    })
                });
                if (!res.ok) throw new Error("Failed to save new address to profile.");
                const { user: updatedUser } = await res.json();
                setUserAddresses(updatedUser.addresses);
                const newAddressId = updatedUser.addresses[updatedUser.addresses.length - 1]._id.toString();
                handleAddressSelectFromModal(newAddressId);
            } catch (err) {
                console.error("Failed to save address:", err);
                setError(`Error saving address: ${err.message}`);
            }
        }
    }["NewProductPage.useCallback[handleSaveNewAddressToProfile]"], [
        handleAddressSelectFromModal
    ]);
    // Fetch addresses from profile
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NewProductPage.useEffect": ()=>{
            if (isAuthLoading) return;
            async function fetchAddresses() {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch("/api/user/profile", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (!res.ok) throw new Error("Failed to fetch profile data.");
                    const { user } = await res.json();
                    setUserDetails(user);
                    if (user?.addresses?.length > 0) {
                        const addresses = user.addresses;
                        setUserAddresses(addresses);
                        const firstAddress = addresses[0];
                        setSelectedAddressId(firstAddress._id.toString());
                        setLocationData(mapAddressToWarehouse(firstAddress));
                    } else {
                        setSelectedAddressId(null);
                        setLocationData(null);
                    }
                } catch (err) {
                    console.error("Failed to fetch user addresses:", err);
                    setError("Failed to load saved addresses. Please check your profile.");
                } finally{
                    setAddressesLoading(false);
                }
            }
            fetchAddresses();
        }
    }["NewProductPage.useEffect"], [
        isAuthLoading
    ]);
    // Helpers for sizes & images
    const addSize = ()=>setSizes((prev)=>[
                ...prev,
                {
                    size: "M",
                    sku: "",
                    stock: 0
                }
            ]);
    const removeSize = (index)=>setSizes((prev)=>prev.filter((_, i)=>i !== index));
    const handleSizeChange = (index, field, value)=>{
        const newSizes = [
            ...sizes
        ];
        newSizes[index][field] = field === "stock" ? Number(value) : value;
        setSizes(newSizes);
    };
    const handleImageChange = (e)=>{
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setImageFiles((prevFiles)=>[
                ...prevFiles,
                ...files
            ]);
        const newPreviews = files.map((file)=>URL.createObjectURL(file));
        setImagePreviews((prev)=>[
                ...prev,
                ...newPreviews
            ]);
    };
    const removeImage = (index)=>{
        setImageFiles((prev)=>prev.filter((_, i)=>i !== index));
        setImagePreviews((prev)=>prev.filter((_, i)=>i !== index));
    };
    const handleSizeChartChange = (e)=>{
        const file = e.target.files?.[0];
        if (file) {
            setSizeChartFile(file);
            setSizeChartPreview(URL.createObjectURL(file));
        }
    };
    const uploadFiles = async (fieldName, files)=>{
        const formData = new FormData();
        files.forEach((file)=>{
            formData.append(fieldName, file);
        });
        const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });
        if (!uploadRes.ok) throw new Error("File upload failed");
        return await uploadRes.json();
    };
    if (isAuthLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WholesalerLayout$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-center items-center py-10",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "h-8 w-8 animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 449,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "ml-2",
                        children: "Verifying access..."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 450,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 448,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/pages/wholesaler/products/new.js",
            lineNumber: 447,
            columnNumber: 7
        }, this);
    }
    // Handle form submission
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!locationData || !isLocationSet(locationData)) {
            setError("Please select a saved address to use as the warehouse location.");
            return;
        }
        setLoading(true);
        setIsUploading(true);
        setError(null);
        let uploadedImageUrls = [];
        let uploadedSizeChartUrl = "";
        try {
            if (imageFiles.length > 0) {
                const uploadData = await uploadFiles("productImages", imageFiles);
                uploadedImageUrls = uploadData.urls?.productImages || [];
            }
            if (sizeChartFile) {
                const uploadData = await uploadFiles("productImage", [
                    sizeChartFile
                ]);
                uploadedSizeChartUrl = uploadData.urls?.productImage?.[0] || "";
            }
            setIsUploading(false);
            const productData = {
                name,
                description,
                price: Number(price),
                brand,
                images: uploadedImageUrls,
                sizes: sizes,
                tags: tags,
                sizeChart: {
                    chartName: sizeChartName,
                    image: uploadedSizeChartUrl
                },
                productDetails: {
                    countryOfOrigin: locationData.country || "Unknown"
                },
                warehouses: [
                    locationData
                ]
            };
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No authorization token found. Please log in again.");
            const res = await fetch("/api/wholesaler/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to create product");
            }
            router.push("/wholesaler/products");
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally{
            setLoading(false);
            setIsUploading(false);
        }
    };
    const currentAddress = locationData;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$WholesalerLayout$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-3xl font-bold",
                                children: "Add New Product (Wholesaler)"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 534,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                        variant: "outline",
                                        type: "button",
                                        onClick: ()=>router.push("/wholesaler/products"),
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 536,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                        type: "submit",
                                        disabled: loading || isUploading,
                                        children: [
                                            (loading || isUploading) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                className: "mr-2 h-4 w-4 animate-spin"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 545,
                                                columnNumber: 17
                                            }, this),
                                            loading ? "Saving..." : isUploading ? "Uploading..." : "Save Product"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 543,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 535,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 533,
                        columnNumber: 9
                    }, this),
                    error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Alert"], {
                        variant: "destructive",
                        className: "mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 558,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertTitle"], {
                                children: "Error"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 559,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 560,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 557,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-2 space-y-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                    children: "Product Details"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                    lineNumber: 569,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 568,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "space-y-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                htmlFor: "name",
                                                                children: "Product Name"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 573,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                id: "name",
                                                                value: name,
                                                                onChange: (e)=>setName(e.target.value),
                                                                required: true
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 574,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 572,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                htmlFor: "description",
                                                                children: "Description"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 582,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$textarea$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Textarea"], {
                                                                id: "description",
                                                                value: description,
                                                                onChange: (e)=>setDescription(e.target.value)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 583,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 581,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "space-y-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                        htmlFor: "price",
                                                                        children: "Price (Wholesale)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 591,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                        id: "price",
                                                                        type: "number",
                                                                        value: price,
                                                                        onChange: (e)=>setPrice(e.target.value),
                                                                        required: true
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 592,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 590,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "space-y-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                        htmlFor: "brand",
                                                                        children: "Brand Name"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 601,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                        id: "brand",
                                                                        value: brand,
                                                                        onChange: (e)=>setBrand(e.target.value)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 602,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 600,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 589,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                children: "Categories / Tags"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 610,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$TagsInput$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                                tags: tags,
                                                                setTags: setTags
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 611,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 609,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 571,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 567,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                        children: "Warehouse Location"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 619,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                                        children: "Select a previously saved address for this product."
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 620,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 618,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "space-y-4",
                                                children: addressesLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center text-muted-foreground",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                            className: "h-4 w-4 animate-spin mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                            lineNumber: 627,
                                                            columnNumber: 21
                                                        }, this),
                                                        "Loading addresses..."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                    lineNumber: 626,
                                                    columnNumber: 19
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "space-y-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                    htmlFor: "address-select",
                                                                    children: "Choose Warehouse Address"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 633,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                    type: "button",
                                                                    variant: "outline",
                                                                    className: "w-full justify-between h-12 text-left",
                                                                    onClick: ()=>setIsAddressModalOpen(true),
                                                                    disabled: addressesLoading,
                                                                    children: [
                                                                        currentAddress && isLocationSet(currentAddress) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "truncate",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "font-bold mr-2 text-primary",
                                                                                    children: currentAddress.address.split(":")[0]
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                                    lineNumber: 644,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                currentAddress.city,
                                                                                ", ",
                                                                                currentAddress.country
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 643,
                                                                            columnNumber: 27
                                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "text-muted-foreground",
                                                                            children: "Click to select or add location..."
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 650,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                                            className: "w-4 h-4"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 654,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 635,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                            lineNumber: 632,
                                                            columnNumber: 21
                                                        }, this),
                                                        !currentAddress && userAddresses.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Alert"], {
                                                            variant: "secondary",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertTitle"], {
                                                                    children: "Address Management"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 660,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                                                    children: "You have no saved addresses. Please use the button to add your first one."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 661,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                            lineNumber: 659,
                                                            columnNumber: 23
                                                        }, this) : currentAddress && isLocationSet(currentAddress) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Alert"], {
                                                            className: "mt-4 text-xs",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                                    className: "h-4 w-4"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 670,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertTitle"], {
                                                                    children: "Address Selected"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 671,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                                                    children: [
                                                                        currentAddress.address,
                                                                        " ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 673,
                                                                            columnNumber: 54
                                                                        }, this),
                                                                        currentAddress.city,
                                                                        ", ",
                                                                        currentAddress.state,
                                                                        ",",
                                                                        " ",
                                                                        currentAddress.country,
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "mt-1 font-medium",
                                                                            children: "Coordinates Set."
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 676,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 672,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                            lineNumber: 669,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true)
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 624,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 617,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                    children: "Size Variants & Stock"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                    lineNumber: 691,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 690,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "space-y-4",
                                                children: [
                                                    sizes.map((size, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "grid grid-cols-12 gap-2 items-end",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "col-span-4 space-y-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                            htmlFor: `size-name-${index}`,
                                                                            children: "Size"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 700,
                                                                            columnNumber: 23
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                            id: `size-name-${index}`,
                                                                            value: size.size,
                                                                            onChange: (e)=>handleSizeChange(index, "size", e.target.value),
                                                                            placeholder: "e.g., M"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 701,
                                                                            columnNumber: 23
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 699,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "col-span-4 space-y-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                            htmlFor: `size-sku-${index}`,
                                                                            children: "SKU (Optional)"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 711,
                                                                            columnNumber: 23
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                            id: `size-sku-${index}`,
                                                                            value: size.sku,
                                                                            onChange: (e)=>handleSizeChange(index, "sku", e.target.value),
                                                                            placeholder: "e.g., BLUE-HOODIE-M"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 712,
                                                                            columnNumber: 23
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 710,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "col-span-3 space-y-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                            htmlFor: `size-stock-${index}`,
                                                                            children: "Stock"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 722,
                                                                            columnNumber: 23
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                            id: `size-stock-${index}`,
                                                                            type: "number",
                                                                            value: size.stock,
                                                                            onChange: (e)=>handleSizeChange(index, "stock", e.target.value),
                                                                            placeholder: "e.g., 10"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 723,
                                                                            columnNumber: 23
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 721,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "col-span-1",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                        variant: "outline",
                                                                        size: "icon",
                                                                        type: "button",
                                                                        onClick: ()=>removeSize(index),
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                            className: "h-4 w-4 text-red-600"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 740,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 734,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                    lineNumber: 733,
                                                                    columnNumber: 21
                                                                }, this)
                                                            ]
                                                        }, index, true, {
                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                            lineNumber: 695,
                                                            columnNumber: 19
                                                        }, this)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Separator"], {}, void 0, false, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 745,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: "outline",
                                                        type: "button",
                                                        onClick: addSize,
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                                                                className: "mr-2 h-4 w-4"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 747,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Add Another Size"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 746,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 693,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 689,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 566,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-1 space-y-6 self-start",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                    children: "Product Gallery"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                    lineNumber: 759,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 758,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-3 gap-2 mb-4",
                                                        children: imagePreviews.map((previewUrl, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "relative",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                        src: previewUrl,
                                                                        alt: `Preview ${index + 1}`,
                                                                        className: "w-full h-24 object-cover rounded-md"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 765,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                        type: "button",
                                                                        variant: "destructive",
                                                                        size: "icon",
                                                                        className: "absolute top-1 right-1 h-6 w-6",
                                                                        onClick: ()=>removeImage(index),
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                                            className: "h-4 w-4"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 777,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 770,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, index, true, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 764,
                                                                columnNumber: 21
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 762,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                        htmlFor: "dropzone-file",
                                                        className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-col items-center justify-center pt-5 pb-6",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                                        className: "w-8 h-8 mb-4 text-gray-500"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 787,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "mb-2 text-sm text-gray-500",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "font-semibold",
                                                                            children: "Click to upload"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 789,
                                                                            columnNumber: 23
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 788,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 786,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                id: "dropzone-file",
                                                                type: "file",
                                                                className: "hidden",
                                                                onChange: handleImageChange,
                                                                accept: "image/png, image/jpeg",
                                                                multiple: true
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 792,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 782,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 761,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 757,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                    children: "Size Chart"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                    lineNumber: 807,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 806,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                                className: "space-y-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "space-y-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                                htmlFor: "sizeChartName",
                                                                children: "Size Chart Name (Optional)"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 811,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                id: "sizeChartName",
                                                                value: sizeChartName,
                                                                onChange: (e)=>setSizeChartName(e.target.value),
                                                                placeholder: "e.g., Men's Hoodie Chart"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 814,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 810,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                        htmlFor: "size-chart-file",
                                                        className: "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 relative",
                                                        children: [
                                                            sizeChartPreview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                src: sizeChartPreview,
                                                                alt: "Size chart preview",
                                                                className: "w-full h-full object-cover rounded-lg"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 826,
                                                                columnNumber: 21
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-col items-center justify-center pt-5 pb-6",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                                        className: "w-8 h-8 mb-4 text-gray-500"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 833,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-sm text-gray-500",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "font-semibold",
                                                                            children: "Upload chart image"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                            lineNumber: 835,
                                                                            columnNumber: 25
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                        lineNumber: 834,
                                                                        columnNumber: 23
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 832,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                                id: "size-chart-file",
                                                                type: "file",
                                                                className: "hidden",
                                                                onChange: handleSizeChartChange,
                                                                accept: "image/png, image/jpeg"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                                lineNumber: 839,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                        lineNumber: 821,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                lineNumber: 809,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 805,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 755,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 564,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 532,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AddressSelectionAndCreationModal, {
                isOpen: isAddressModalOpen,
                onClose: ()=>setIsAddressModalOpen(false),
                addresses: userAddresses,
                currentSelectedId: selectedAddressId,
                onAddressSelect: handleAddressSelectFromModal,
                onSaveNewAddress: handleSaveNewAddressToProfile,
                userDetails: userDetails
            }, void 0, false, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 854,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/wholesaler/products/new.js",
        lineNumber: 531,
        columnNumber: 5
    }, this);
}
_s(NewProductPage, "TXcFTnfcswN5I28jCdjW2kz2eR4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useAuthGuard$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useAuthGuard"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c2 = NewProductPage;
// -----------------------------------------------------------
// Address Selection & Creation Modal
// -----------------------------------------------------------
function AddressSelectionAndCreationModal({ isOpen, onClose, addresses, currentSelectedId, onAddressSelect, onSaveNewAddress, userDetails }) {
    _s1();
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("selection"); // 'selection' or 'creation'
    const [selectedId, setSelectedId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(currentSelectedId);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AddressSelectionAndCreationModal.useEffect": ()=>{
            setSelectedId(currentSelectedId);
            if (isOpen) setMode("selection");
        }
    }["AddressSelectionAndCreationModal.useEffect"], [
        currentSelectedId,
        isOpen
    ]);
    const handleApply = ()=>{
        if (selectedId) {
            onAddressSelect(selectedId);
            onClose();
        }
    };
    const handleNewAddressComplete = (newAddress)=>{
        onSaveNewAddress(newAddress);
        setMode("selection");
    };
    if (mode === "creation") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Dialog, {
            open: isOpen,
            onOpenChange: onClose,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogContent, {
                className: "sm:max-w-[700px] max-h-[90vh] p-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AddressCreationForm, {
                    onCancel: ()=>setMode("selection"),
                    onSaveNewAddress: handleNewAddressComplete,
                    userDetails: userDetails,
                    initialAddress: {
                        label: "New Warehouse",
                        firstName: userDetails.name?.split(" ")[0],
                        lastName: userDetails.name?.split(" ").slice(1).join(" ") || "",
                        phone: userDetails.phone,
                        countryCode: COUNTRY_DATA[0].code,
                        addressLine1: "",
                        addressLine2: "",
                        city: "",
                        state: "",
                        pincode: "",
                        country: COUNTRY_DATA[0].country,
                        location: {
                            type: "Point",
                            coordinates: [
                                0,
                                0
                            ]
                        }
                    }
                }, void 0, false, {
                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                    lineNumber: 904,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 903,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/pages/wholesaler/products/new.js",
            lineNumber: 902,
            columnNumber: 7
        }, this);
    }
    // Selection mode
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Dialog, {
        open: isOpen,
        onOpenChange: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogContent, {
            className: "sm:max-w-[450px] p-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogHeader, {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogTitle, {
                            className: "text-xl",
                            children: "Choose your location"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                            lineNumber: 933,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogDescription, {
                            className: "text-sm mt-1",
                            children: "Select an existing address or add a new one."
                        }, void 0, false, {
                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                            lineNumber: 934,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                    lineNumber: 932,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "space-y-4 max-h-[60vh] overflow-y-auto pt-2",
                    children: [
                        addresses.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-4 text-center text-muted-foreground border rounded-md",
                            children: "No saved addresses found."
                        }, void 0, false, {
                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                            lineNumber: 941,
                            columnNumber: 13
                        }, this) : addresses.map((addr)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                                onClick: ()=>setSelectedId(addr._id.toString()),
                                className: `p-3 cursor-pointer transition-colors ${selectedId === addr._id.toString() ? "border-2 border-blue-500 ring-2 ring-blue-200" : "border border-gray-300 hover:border-blue-300"}`,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-start",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: `font-extrabold text-sm uppercase mr-2 ${selectedId === addr._id.toString() ? "text-blue-600" : "text-gray-800"}`,
                                            children: addr.label || "Default"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                            lineNumber: 956,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex-1 text-sm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "font-semibold",
                                                    children: [
                                                        addr.firstName,
                                                        " ",
                                                        addr.lastName
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                    lineNumber: 966,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-gray-600",
                                                    children: [
                                                        addr.addressLine1,
                                                        ", ",
                                                        addr.city,
                                                        " ",
                                                        addr.pincode
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                                    lineNumber: 969,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                            lineNumber: 965,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                    lineNumber: 955,
                                    columnNumber: 17
                                }, this)
                            }, addr._id.toString(), false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 946,
                                columnNumber: 15
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                            variant: "link",
                            className: "p-0 text-blue-600 justify-start",
                            onClick: ()=>setMode("creation"),
                            children: "+ Add a new address"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                            lineNumber: 978,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                    lineNumber: 939,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogFooter, {
                    className: "mt-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                        type: "button",
                        onClick: handleApply,
                        disabled: !selectedId || addresses.length === 0,
                        className: "w-full",
                        children: "Apply Location"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 988,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                    lineNumber: 987,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/pages/wholesaler/products/new.js",
            lineNumber: 931,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/pages/wholesaler/products/new.js",
        lineNumber: 930,
        columnNumber: 5
    }, this);
}
_s1(AddressSelectionAndCreationModal, "nYXb+/PyuAN7KVU9JN+75alWQTg=");
_c3 = AddressSelectionAndCreationModal;
// -----------------------------------------------------------
// Address Creation Form (Map + Search + Locate Me)
// -----------------------------------------------------------
function AddressCreationForm({ onCancel, onSaveNewAddress, userDetails, initialAddress }) {
    _s2();
    const { isLoaded, loadError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useLoadScript"])({
        googleMapsApiKey: ("TURBOPACK compile-time value", "AIzaSyBHu17-FJ09v_hP5YcfeZS2cbJJaFas5nI"),
        libraries: libraries
    });
    const defaultCenter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AddressCreationForm.useMemo[defaultCenter]": ()=>({
                lat: 21.1458,
                lng: 79.0882
            })
    }["AddressCreationForm.useMemo[defaultCenter]"], []);
    const [address, setAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(initialAddress);
    const [pinAddressText, setPinAddressText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [mapCenter, setMapCenter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(defaultCenter);
    const [markerPosition, setMarkerPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLocating, setIsLocating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Track if user has manually chosen a location (search/click/drag)
    const hasManualLocationRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AddressCreationForm.useEffect": ()=>{
            const initial = initialAddress;
            setAddress(initial);
            hasManualLocationRef.current = false;
            const initialCoords = initial.location?.coordinates;
            if (initialCoords && initialCoords[0] && initialCoords[1] && initialCoords[0] !== 0) {
                const [lng, lat] = initialCoords;
                const latLng = {
                    lat,
                    lng
                };
                setMarkerPosition(latLng);
                setMapCenter(latLng);
                setPinAddressText(initial.addressLine1 ? `Current pin: ${initial.addressLine1}` : "Coordinates set.");
            } else {
                setMarkerPosition(null);
                setMapCenter(defaultCenter);
                if (isLoaded) locateUser(initial);
            }
        }
    }["AddressCreationForm.useEffect"], [
        initialAddress,
        isLoaded,
        defaultCenter
    ]);
    const updateLocationAndAddress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressCreationForm.useCallback[updateLocationAndAddress]": async (lat, lng, pan = true, isGeolocated = false, addressSourceText = null)=>{
            const latLng = {
                lat,
                lng
            };
            setMarkerPosition(latLng);
            setMapCenter(latLng);
            try {
                const results = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getGeocode"])({
                    location: latLng
                });
                const components = results[0]?.address_components || [];
                const addressDescription = results[0]?.formatted_address || "Pinned Location";
                setPinAddressText(`Current pin: ${addressDescription}`);
                let newAddr = {
                    city: "",
                    state: "",
                    country: "",
                    pincode: "",
                    location: {
                        type: "Point",
                        coordinates: [
                            lng,
                            lat
                        ]
                    }
                };
                let countryCodeFound = "";
                for (const component of components){
                    if (component.types.includes("locality")) newAddr.city = component.long_name;
                    if (component.types.includes("administrative_area_level_1")) newAddr.state = component.short_name;
                    if (component.types.includes("country")) {
                        newAddr.country = component.long_name;
                        countryCodeFound = component.short_name;
                    }
                    if (component.types.includes("postal_code")) newAddr.pincode = component.long_name;
                }
                const phoneCodeObj = countryCodeFound ? COUNTRY_DATA.find({
                    "AddressCreationForm.useCallback[updateLocationAndAddress]": (c)=>c.iso2 === countryCodeFound
                }["AddressCreationForm.useCallback[updateLocationAndAddress]"]) : null;
                setAddress({
                    "AddressCreationForm.useCallback[updateLocationAndAddress]": (prev)=>({
                            ...prev,
                            ...newAddr,
                            // Only override addressLine1 when coming from search bar
                            addressLine1: addressSourceText ? addressSourceText.split(",")[0].trim() : prev.addressLine1,
                            countryCode: phoneCodeObj ? phoneCodeObj.code : prev.countryCode,
                            country: newAddr.country || prev.country,
                            phone: isGeolocated ? userDetails.phone : prev.phone,
                            firstName: isGeolocated ? userDetails.name?.split(" ")[0] : prev.firstName
                        })
                }["AddressCreationForm.useCallback[updateLocationAndAddress]"]);
                if (mapRef.current && pan) {
                    mapRef.current.panTo(latLng);
                }
            } catch (error) {
                console.error("Reverse Geocode failed:", error);
                setAddress({
                    "AddressCreationForm.useCallback[updateLocationAndAddress]": (prev)=>({
                            ...prev,
                            location: {
                                type: "Point",
                                coordinates: [
                                    lng,
                                    lat
                                ]
                            }
                        })
                }["AddressCreationForm.useCallback[updateLocationAndAddress]"]);
            }
        }
    }["AddressCreationForm.useCallback[updateLocationAndAddress]"], [
        userDetails
    ]);
    const locateUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressCreationForm.useCallback[locateUser]": (initial)=>{
            if (!navigator.geolocation) return;
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition({
                "AddressCreationForm.useCallback[locateUser]": (position)=>{
                    if (hasManualLocationRef.current) {
                        setIsLocating(false);
                        return;
                    }
                    const { latitude, longitude } = position.coords;
                    updateLocationAndAddress(latitude, longitude, true, true, null);
                    setIsLocating(false);
                }
            }["AddressCreationForm.useCallback[locateUser]"], {
                "AddressCreationForm.useCallback[locateUser]": (error)=>{
                    console.warn("Geolocation failed:", error);
                    const selectedCountry = COUNTRY_DATA.find({
                        "AddressCreationForm.useCallback[locateUser].selectedCountry": (c)=>c.code === initial?.countryCode
                    }["AddressCreationForm.useCallback[locateUser].selectedCountry"]);
                    if (isLoaded && selectedCountry) {
                        setMapCenter({
                            lat: selectedCountry.lat,
                            lng: selectedCountry.lng
                        });
                    } else if (isLoaded) {
                        setMapCenter(defaultCenter);
                    }
                    setIsLocating(false);
                }
            }["AddressCreationForm.useCallback[locateUser]"], {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        }
    }["AddressCreationForm.useCallback[locateUser]"], [
        isLoaded,
        defaultCenter,
        updateLocationAndAddress
    ]);
    const handlePlaceSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressCreationForm.useCallback[handlePlaceSelect]": (addressDescription, latLng)=>{
            hasManualLocationRef.current = true;
            updateLocationAndAddress(latLng.lat, latLng.lng, true, false, addressDescription);
        }
    }["AddressCreationForm.useCallback[handlePlaceSelect]"], [
        updateLocationAndAddress
    ]);
    const handleMapClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressCreationForm.useCallback[handleMapClick]": (e)=>{
            hasManualLocationRef.current = true;
            updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
        }
    }["AddressCreationForm.useCallback[handleMapClick]"], [
        updateLocationAndAddress
    ]);
    const handleMarkerDragEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressCreationForm.useCallback[handleMarkerDragEnd]": (e)=>{
            hasManualLocationRef.current = true;
            updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
        }
    }["AddressCreationForm.useCallback[handleMarkerDragEnd]"], [
        updateLocationAndAddress
    ]);
    const handleChange = (field, value)=>setAddress((prev)=>({
                ...prev,
                [field]: value
            }));
    const handleCountryNameSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressCreationForm.useCallback[handleCountryNameSelect]": (selectedCountryName)=>{
            const selectedCountry = COUNTRY_DATA.find({
                "AddressCreationForm.useCallback[handleCountryNameSelect].selectedCountry": (c)=>c.country === selectedCountryName
            }["AddressCreationForm.useCallback[handleCountryNameSelect].selectedCountry"]);
            if (selectedCountry) {
                setAddress({
                    "AddressCreationForm.useCallback[handleCountryNameSelect]": (prev)=>({
                            ...prev,
                            country: selectedCountryName,
                            countryCode: selectedCountry.code
                        })
                }["AddressCreationForm.useCallback[handleCountryNameSelect]"]);
                setMapCenter({
                    lat: selectedCountry.lat,
                    lng: selectedCountry.lng
                });
                setMarkerPosition(null);
                if (mapRef.current) {
                    mapRef.current.setZoom(5);
                }
            } else {
                setAddress({
                    "AddressCreationForm.useCallback[handleCountryNameSelect]": (prev)=>({
                            ...prev,
                            country: selectedCountryName
                        })
                }["AddressCreationForm.useCallback[handleCountryNameSelect]"]);
            }
        }
    }["AddressCreationForm.useCallback[handleCountryNameSelect]"], []);
    const handleCountryCodeChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressCreationForm.useCallback[handleCountryCodeChange]": (newCode)=>{
            const selectedCountry = COUNTRY_DATA.find({
                "AddressCreationForm.useCallback[handleCountryCodeChange].selectedCountry": (c)=>c.code === newCode
            }["AddressCreationForm.useCallback[handleCountryCodeChange].selectedCountry"]);
            if (selectedCountry) {
                setAddress({
                    "AddressCreationForm.useCallback[handleCountryCodeChange]": (prev)=>({
                            ...prev,
                            countryCode: newCode,
                            country: selectedCountry.country
                        })
                }["AddressCreationForm.useCallback[handleCountryCodeChange]"]);
                if (mapRef.current) {
                    mapRef.current.panTo({
                        lat: selectedCountry.lat,
                        lng: selectedCountry.lng
                    });
                    mapRef.current.setZoom(8);
                }
            } else {
                setAddress({
                    "AddressCreationForm.useCallback[handleCountryCodeChange]": (prev)=>({
                            ...prev,
                            countryCode: newCode
                        })
                }["AddressCreationForm.useCallback[handleCountryCodeChange]"]);
            }
        }
    }["AddressCreationForm.useCallback[handleCountryCodeChange]"], []);
    const handleSave = (e)=>{
        e.preventDefault();
        if (!address.label || !address.addressLine1 || !address.city || !address.country || !address.phone || !address.firstName) {
            alert("Please fill all required address fields.");
            return;
        }
        if (!markerPosition) {
            if (!window.confirm("Address coordinates are not set (pin missing on map). Save without coordinates?")) {
                return;
            }
        }
        onSaveNewAddress(address);
    };
    if (loadError) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Error loading maps."
    }, void 0, false, {
        fileName: "[project]/src/pages/wholesaler/products/new.js",
        lineNumber: 1258,
        columnNumber: 25
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "sm:max-w-[700px] max-h-[90vh] overflow-y-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-lg font-semibold mb-3",
                children: "Add New Address Details"
            }, void 0, false, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 1262,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSave,
                className: "grid gap-4 py-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                htmlFor: "label",
                                children: "Address Label (e.g., Home, Work)"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1266,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                value: address.label || "",
                                onChange: (e)=>handleChange("label", e.target.value),
                                placeholder: "Home",
                                required: true
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1267,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1265,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                htmlFor: "country-search",
                                children: "Country/Region"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1277,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CountryCombobox, {
                                value: address.country || "",
                                onChange: handleCountryNameSelect
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1278,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1276,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-2 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: "firstName",
                                        children: "First Name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1287,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: address.firstName || "",
                                        onChange: (e)=>handleChange("firstName", e.target.value),
                                        placeholder: "First Name",
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1288,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1286,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: "lastName",
                                        children: "Last Name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1296,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: address.lastName || "",
                                        onChange: (e)=>handleChange("lastName", e.target.value),
                                        placeholder: "Last Name"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1297,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1295,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1285,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                htmlFor: "addressSearch",
                                children: "Address (Search & Pin)"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1307,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AddressAutocomplete, {
                                onSelect: handlePlaceSelect
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1308,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                type: "button",
                                variant: "outline",
                                size: "sm",
                                onClick: ()=>locateUser(address),
                                disabled: isLocating || !isLoaded,
                                className: "mt-1 flex items-center justify-center w-full",
                                children: [
                                    isLocating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "animate-spin h-4 w-4 mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1319,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$locate$2d$fixed$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LocateFixed$3e$__["LocateFixed"], {
                                        className: "h-4 w-4 mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1321,
                                        columnNumber: 15
                                    }, this),
                                    isLocating ? "Locating you..." : "Locate Me"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1310,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-[250px] w-full rounded-md overflow-hidden border relative mt-2",
                                children: isLoaded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["GoogleMap"], {
                                    zoom: markerPosition ? 15 : address.country ? 8 : 5,
                                    center: mapCenter,
                                    mapContainerClassName: "w-full h-full",
                                    onClick: handleMapClick,
                                    onLoad: (map)=>mapRef.current = map,
                                    children: [
                                        markerPosition && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Marker"], {
                                            position: markerPosition,
                                            draggable: true,
                                            onDragEnd: handleMarkerDragEnd
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                            lineNumber: 1336,
                                            columnNumber: 19
                                        }, this),
                                        isLocating && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "animate-spin h-8 w-8 absolute top-1/2 left-1/2 -mt-4 -ml-4 z-10"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                            lineNumber: 1343,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                    lineNumber: 1328,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-4 text-center flex justify-center items-center h-full",
                                    children: [
                                        isLocating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "animate-spin h-4 w-4 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                                            lineNumber: 1349,
                                            columnNumber: 19
                                        }, this) : null,
                                        isLocating ? "Locating you..." : "Loading map..."
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                    lineNumber: 1347,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1326,
                                columnNumber: 11
                            }, this),
                            pinAddressText && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Alert"], {
                                className: "mt-2 text-xs",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1358,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                        children: pinAddressText
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1359,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1357,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1306,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                htmlFor: "addressLine2",
                                children: "Apartment, suite, unit, building (Optional)"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1366,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                value: address.addressLine2 || "",
                                onChange: (e)=>handleChange("addressLine2", e.target.value),
                                placeholder: "Apartment, suite, etc."
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1369,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1365,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-3 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: "city",
                                        children: "City"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1379,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: address.city || "",
                                        onChange: (e)=>handleChange("city", e.target.value),
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1380,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1378,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: "state",
                                        children: "State/Region"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1387,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: address.state || "",
                                        onChange: (e)=>handleChange("state", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1388,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1386,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                        htmlFor: "pincode",
                                        children: "PIN code"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1394,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: address.pincode || "",
                                        onChange: (e)=>handleChange("pincode", e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1395,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1393,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1377,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                htmlFor: "addressPhone",
                                children: "Mobile number (for delivery)"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1404,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex space-x-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CountryCodeSelector, {
                                        value: address.countryCode || COUNTRY_DATA[0].code,
                                        onChange: handleCountryCodeChange
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1406,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                        value: address.phone || "",
                                        onChange: (e)=>handleChange("phone", e.target.value),
                                        placeholder: "Mobile number",
                                        type: "tel",
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                                        lineNumber: 1410,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1405,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1403,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogFooter, {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                type: "button",
                                variant: "outline",
                                onClick: onCancel,
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1421,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                type: "submit",
                                children: "Save and Select Address"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/wholesaler/products/new.js",
                                lineNumber: 1424,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1420,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 1263,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/wholesaler/products/new.js",
        lineNumber: 1261,
        columnNumber: 5
    }, this);
}
_s2(AddressCreationForm, "RKuh++cGN9cQ3sO8SznpLsB2oYY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useLoadScript"]
    ];
});
_c4 = AddressCreationForm;
// -----------------------------------------------------------
// Utility Components (CountryCombobox, CountryCodeSelector, AddressAutocomplete)
// -----------------------------------------------------------
function CountryCombobox({ value, onChange }) {
    _s3();
    const [inputValue, setInputValue] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(value);
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const wrapperRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CountryCombobox.useEffect": ()=>{
            setInputValue(value);
        }
    }["CountryCombobox.useEffect"], [
        value
    ]);
    const filteredCountries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "CountryCombobox.useMemo[filteredCountries]": ()=>{
            if (!inputValue) return COUNTRY_DATA;
            return COUNTRY_DATA.filter({
                "CountryCombobox.useMemo[filteredCountries]": (c)=>c.country.toLowerCase().includes(inputValue.toLowerCase()) || c.code.includes(inputValue)
            }["CountryCombobox.useMemo[filteredCountries]"]);
        }
    }["CountryCombobox.useMemo[filteredCountries]"], [
        inputValue
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CountryCombobox.useEffect": ()=>{
            function handleClickOutside(event) {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                    setIsMenuOpen(false);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            return ({
                "CountryCombobox.useEffect": ()=>document.removeEventListener("mousedown", handleClickOutside)
            })["CountryCombobox.useEffect"];
        }
    }["CountryCombobox.useEffect"], []);
    const handleInputChange = (e)=>{
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsMenuOpen(true);
        onChange(newValue);
    };
    const handleSelect = (countryName)=>{
        setInputValue(countryName);
        setIsMenuOpen(false);
        onChange(countryName);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative z-30",
        ref: wrapperRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                value: inputValue,
                onChange: handleInputChange,
                onFocus: ()=>setIsMenuOpen(true),
                placeholder: "Type country name or select...",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 1478,
                columnNumber: 7
            }, this),
            isMenuOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                className: "absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border max-h-60 overflow-y-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "divide-y",
                    children: filteredCountries.length > 0 ? filteredCountries.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            onClick: ()=>handleSelect(c.country),
                            className: "p-3 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-medium",
                                    children: [
                                        c.flag,
                                        " ",
                                        c.country
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                    lineNumber: 1496,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-muted-foreground text-xs",
                                    children: c.code
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                                    lineNumber: 1499,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, c.country, true, {
                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                            lineNumber: 1491,
                            columnNumber: 17
                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "p-3 text-sm text-muted-foreground",
                        children: "No matches found."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/wholesaler/products/new.js",
                        lineNumber: 1505,
                        columnNumber: 15
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                    lineNumber: 1488,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 1487,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/wholesaler/products/new.js",
        lineNumber: 1477,
        columnNumber: 5
    }, this);
}
_s3(CountryCombobox, "JQ+AroPm8cVd9xLfEqJ353ziOL8=");
_c5 = CountryCombobox;
function CountryCodeSelector({ value, onChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
        value: value,
        onChange: (e)=>onChange(e.target.value),
        className: "flex h-9 w-40 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm shrink-0",
        children: COUNTRY_DATA.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                value: c.code,
                children: [
                    c.flag,
                    " ",
                    c.country,
                    " (",
                    c.code,
                    ")"
                ]
            }, c.code, true, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 1524,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/pages/wholesaler/products/new.js",
        lineNumber: 1518,
        columnNumber: 5
    }, this);
}
_c6 = CountryCodeSelector;
function AddressAutocomplete({ onSelect }) {
    _s4();
    const { ready, value, setValue, suggestions: { status, data }, clearSuggestions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])({
        debounce: 300
    });
    const handleSelect = async (addressDescription)=>{
        setValue(addressDescription, false);
        clearSuggestions();
        try {
            const geocodeResults = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getGeocode"])({
                address: addressDescription
            });
            const { lat, lng } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getLatLng"])(geocodeResults[0]);
            onSelect(addressDescription, {
                lat,
                lng
            });
        } catch (error) {
            console.error("Error fetching coordinates: ", error);
            alert("Could not fetch coordinates for the selected address.");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative z-20",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                id: "addressSearch",
                value: value,
                onChange: (e)=>setValue(e.target.value),
                disabled: !ready,
                placeholder: "Start typing your street address..."
            }, void 0, false, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 1559,
                columnNumber: 7
            }, this),
            status === "OK" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                className: "absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border max-h-60 overflow-y-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "divide-y",
                    children: data.map(({ place_id, description })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            onClick: ()=>handleSelect(description),
                            className: "p-3 hover:bg-gray-50 cursor-pointer text-sm",
                            children: description
                        }, place_id, false, {
                            fileName: "[project]/src/pages/wholesaler/products/new.js",
                            lineNumber: 1571,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/pages/wholesaler/products/new.js",
                    lineNumber: 1569,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/wholesaler/products/new.js",
                lineNumber: 1568,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/wholesaler/products/new.js",
        lineNumber: 1558,
        columnNumber: 5
    }, this);
}
_s4(AddressAutocomplete, "VYk15tlxiXLVJywwctl4rg+HLak=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]
    ];
});
_c7 = AddressAutocomplete;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7;
__turbopack_context__.k.register(_c, 'COUNTRY_DATA$[\r\n  { country: "Afghanistan", code: "+93", flag: "🇦🇫", lat: 33.9391, lng: 67.7099, iso2: "AF" },\r\n  { country: "Albania", code: "+355", flag: "🇦🇱", lat: 41.1533, lng: 20.1683, iso2: "AL" },\r\n  { country: "Algeria", code: "+213", flag: "🇩🇿", lat: 28.0339, lng: 1.6596, iso2: "DZ" },\r\n  { country: "Andorra", code: "+376", flag: "🇦🇩", lat: 42.5462, lng: 1.6015, iso2: "AD" },\r\n  { country: "Angola", code: "+244", flag: "🇦🇴", lat: -11.2027, lng: 17.8739, iso2: "AO" },\r\n  { country: "Antigua and Barbuda", code: "+1268", flag: "🇦🇬", lat: 17.0608, lng: -61.7964, iso2: "AG" },\r\n  { country: "Argentina", code: "+54", flag: "🇦🇷", lat: -38.4161, lng: -63.6167, iso2: "AR" },\r\n  { country: "Armenia", code: "+374", flag: "🇦🇲", lat: 40.0691, lng: 45.0382, iso2: "AM" },\r\n  { country: "Australia", code: "+61", flag: "🇦🇺", lat: -25.2744, lng: 133.7751, iso2: "AU" },\r\n  { country: "Austria", code: "+43", flag: "🇦🇹", lat: 47.5162, lng: 14.5501, iso2: "AT" },\r\n  { country: "Azerbaijan", code: "+994", flag: "🇦🇿", lat: 40.1431, lng: 47.5769, iso2: "AZ" },\r\n  { country: "Bahamas", code: "+1242", flag: "🇧🇸", lat: 25.0343, lng: -77.3963, iso2: "BS" },\r\n  { country: "Bahrain", code: "+973", flag: "🇧🇭", lat: 25.9304, lng: 50.6378, iso2: "BH" },\r\n  { country: "Bangladesh", code: "+880", flag: "🇧🇩", lat: 23.685, lng: 90.3563, iso2: "BD" },\r\n  { country: "Barbados", code: "+1246", flag: "🇧🇧", lat: 13.1939, lng: -59.5432, iso2: "BB" },\r\n  { country: "Belarus", code: "+375", flag: "🇧🇾", lat: 53.7098, lng: 27.9534, iso2: "BY" },\r\n  { country: "Belgium", code: "+32", flag: "🇧🇪", lat: 50.5039, lng: 4.4699, iso2: "BE" },\r\n  { country: "Belize", code: "+501", flag: "🇧🇿", lat: 17.1899, lng: -88.4977, iso2: "BZ" },\r\n  { country: "Benin", code: "+229", flag: "🇧🇯", lat: 9.3077, lng: 2.3158, iso2: "BJ" },\r\n  { country: "Bhutan", code: "+975", flag: "🇧🇹", lat: 27.5142, lng: 90.4336, iso2: "BT" },\r\n  { country: "Bolivia", code: "+591", flag: "🇧🇴", lat: -16.2902, lng: -63.5887, iso2: "BO" },\r\n  { country: "Bosnia and Herzegovina", code: "+387", flag: "🇧🇦", lat: 43.9159, lng: 17.6791, iso2: "BA" },\r\n  { country: "Botswana", code: "+267", flag: "🇧🇼", lat: -22.3285, lng: 24.6849, iso2: "BW" },\r\n  { country: "Brazil", code: "+55", flag: "🇧🇷", lat: -14.235, lng: -51.9253, iso2: "BR" },\r\n  { country: "Brunei", code: "+673", flag: "🇧🇳", lat: 4.5353, lng: 114.7277, iso2: "BN" },\r\n  { country: "Bulgaria", code: "+359", flag: "🇧🇬", lat: 42.7339, lng: 25.4858, iso2: "BG" },\r\n  { country: "Burkina Faso", code: "+226", flag: "🇧🇫", lat: 12.2383, lng: -1.5616, iso2: "BF" },\r\n  { country: "Burundi", code: "+257", flag: "🇧🇮", lat: -3.3731, lng: 29.9189, iso2: "BI" },\r\n  { country: "Cabo Verde", code: "+238", flag: "🇨🇻", lat: 16.0021, lng: -24.0132, iso2: "CV" },\r\n  { country: "Cambodia", code: "+855", flag: "🇰🇭", lat: 12.5657, lng: 104.991, iso2: "KH" },\r\n  { country: "Cameroon", code: "+237", flag: "🇨🇲", lat: 7.3697, lng: 12.3547, iso2: "CM" },\r\n  { country: "Canada", code: "+1", flag: "🇨🇦", lat: 56.1304, lng: -106.3468, iso2: "CA" },\r\n  { country: "Central African Republic", code: "+236", flag: "🇨🇫", lat: 6.6111, lng: 20.9394, iso2: "CF" },\r\n  { country: "Chad", code: "+235", flag: "🇹🇩", lat: 15.4542, lng: 18.7322, iso2: "TD" },\r\n  { country: "Chile", code: "+56", flag: "🇨🇱", lat: -35.6751, lng: -71.543, iso2: "CL" },\r\n  { country: "China", code: "+86", flag: "🇨🇳", lat: 35.8617, lng: 104.1954, iso2: "CN" },\r\n  { country: "Colombia", code: "+57", flag: "🇨🇴", lat: 4.5709, lng: -74.2973, iso2: "CO" },\r\n  { country: "Comoros", code: "+269", flag: "🇰🇲", lat: -11.875, lng: 43.8722, iso2: "KM" },\r\n  { country: "Congo (Brazzaville)", code: "+242", flag: "🇨🇬", lat: -0.228, lng: 15.8277, iso2: "CG" },\r\n  { country: "Congo (Kinshasa)", code: "+243", flag: "🇨🇩", lat: -4.0383, lng: 21.7587, iso2: "CD" },\r\n  { country: "Costa Rica", code: "+506", flag: "🇨🇷", lat: 9.7489, lng: -83.7534, iso2: "CR" },\r\n  { country: "Croatia", code: "+385", flag: "🇭🇷", lat: 45.1, lng: 15.2, iso2: "HR" },\r\n  { country: "Cuba", code: "+53", flag: "🇨🇺", lat: 21.5218, lng: -77.7812, iso2: "CU" },\r\n  { country: "Cyprus", code: "+357", flag: "🇨🇾", lat: 35.1264, lng: 33.4299, iso2: "CY" },\r\n  { country: "Czechia", code: "+420", flag: "🇨🇿", lat: 49.8175, lng: 15.4729, iso2: "CZ" },\r\n  { country: "Denmark", code: "+45", flag: "🇩🇰", lat: 56.2639, lng: 9.5018, iso2: "DK" },\r\n  { country: "Djibouti", code: "+253", flag: "🇩🇯", lat: 11.8251, lng: 42.5903, iso2: "DJ" },\r\n  { country: "Dominica", code: "+1767", flag: "🇩🇲", lat: 15.415, lng: -61.371, iso2: "DM" },\r\n  { country: "Dominican Republic", code: "+1809", flag: "🇩🇴", lat: 18.7357, lng: -70.1626, iso2: "DO" },\r\n  { country: "East Timor", code: "+670", flag: "🇹🇱", lat: -8.8742, lng: 125.7275, iso2: "TL" },\r\n  { country: "Ecuador", code: "+593", flag: "🇪🇨", lat: -1.8312, lng: -78.1834, iso2: "EC" },\r\n  { country: "Egypt", code: "+20", flag: "🇪🇬", lat: 26.8206, lng: 30.8025, iso2: "EG" },\r\n  { country: "El Salvador", code: "+503", flag: "🇸🇻", lat: 13.7942, lng: -88.8965, iso2: "SV" },\r\n  { country: "Equatorial Guinea", code: "+240", flag: "🇬🇶", lat: 1.6508, lng: 10.2679, iso2: "GQ" },\r\n  { country: "Eritrea", code: "+291", flag: "🇪🇷", lat: 15.1794, lng: 39.7823, iso2: "ER" },\r\n  { country: "Estonia", code: "+372", flag: "🇪🇪", lat: 58.5953, lng: 25.0136, iso2: "EE" },\r\n  { country: "Eswatini", code: "+268", flag: "🇸🇿", lat: -26.5225, lng: 31.4659, iso2: "SZ" },\r\n  { country: "Ethiopia", code: "+251", flag: "🇪🇹", lat: 9.145, lng: 40.4897, iso2: "ET" },\r\n  { country: "Fiji", code: "+679", flag: "🇫🇯", lat: -16.5782, lng: 179.4145, iso2: "FJ" },\r\n  { country: "Finland", code: "+358", flag: "🇫🇮", lat: 61.9241, lng: 25.7482, iso2: "FI" },\r\n  { country: "France", code: "+33", flag: "🇫🇷", lat: 46.2276, lng: 2.2137, iso2: "FR" },\r\n  { country: "Gabon", code: "+241", flag: "🇬🇦", lat: -0.8037, lng: 11.6094, iso2: "GA" },\r\n  { country: "Gambia", code: "+220", flag: "🇬🇲", lat: 13.4432, lng: -15.3101, iso2: "GM" },\r\n  { country: "Georgia", code: "+995", flag: "🇬🇪", lat: 42.3154, lng: 43.3569, iso2: "GE" },\r\n  { country: "Germany", code: "+49", flag: "🇩🇪", lat: 51.1657, lng: 10.4515, iso2: "DE" },\r\n  { country: "Ghana", code: "+233", flag: "🇬🇭", lat: 7.9465, lng: -1.0232, iso2: "GH" },\r\n  { country: "Greece", code: "+30", flag: "🇬🇷", lat: 39.0742, lng: 21.8243, iso2: "GR" },\r\n  { country: "Grenada", code: "+1473", flag: "🇬🇩", lat: 12.2628, lng: -61.6042, iso2: "GD" },\r\n  { country: "Guatemala", code: "+502", flag: "🇬🇹", lat: 15.7835, lng: -90.2308, iso2: "GT" },\r\n  { country: "Guinea", code: "+224", flag: "🇬🇳", lat: 9.9456, lng: -9.6966, iso2: "GN" },\r\n  { country: "Guinea-Bissau", code: "+245", flag: "🇬🇼", lat: 11.8037, lng: -15.1804, iso2: "GW" },\r\n  { country: "Guyana", code: "+592", flag: "🇬🇾", lat: 4.8604, lng: -58.9302, iso2: "GY" },\r\n  { country: "Haiti", code: "+509", flag: "🇭🇹", lat: 18.9712, lng: -72.2852, iso2: "HT" },\r\n  { country: "Honduras", code: "+504", flag: "🇭🇳", lat: 15.1999, lng: -86.2419, iso2: "HN" },\r\n  { country: "Hungary", code: "+36", flag: "🇭🇺", lat: 47.1625, lng: 19.5033, iso2: "HU" },\r\n  { country: "Iceland", code: "+354", flag: "🇮🇸", lat: 64.9631, lng: -19.0208, iso2: "IS" },\r\n  { country: "India", code: "+91", flag: "🇮🇳", lat: 20.5937, lng: 78.9629, iso2: "IN" },\r\n  { country: "Indonesia", code: "+62", flag: "🇮🇩", lat: -0.7893, lng: 113.9213, iso2: "ID" },\r\n  { country: "Iran", code: "+98", flag: "🇮🇷", lat: 32.4279, lng: 53.688, iso2: "IR" },\r\n  { country: "Iraq", code: "+964", flag: "🇮🇶", lat: 33.2232, lng: 43.6793, iso2: "IQ" },\r\n  { country: "Ireland", code: "+353", flag: "🇮🇪", lat: 53.4129, lng: -8.2439, iso2: "IE" },\r\n  { country: "Israel", code: "+972", flag: "🇮🇱", lat: 31.0461, lng: 34.8516, iso2: "IL" },\r\n  { country: "Italy", code: "+39", flag: "🇮🇹", lat: 41.8719, lng: 12.5674, iso2: "IT" },\r\n  { country: "Jamaica", code: "+1876", flag: "🇯🇲", lat: 18.1096, lng: -77.2975, iso2: "JM" },\r\n  { country: "Japan", code: "+81", flag: "🇯🇵", lat: 36.2048, lng: 138.2529, iso2: "JP" },\r\n  { country: "Jordan", code: "+962", flag: "🇯🇴", lat: 30.5852, lng: 36.2384, iso2: "JO" },\r\n  { country: "Kazakhstan", code: "+7", flag: "🇰🇿", lat: 48.0196, lng: 66.9237, iso2: "KZ" },\r\n  { country: "Kenya", code: "+254", flag: "🇰🇪", lat: -0.0236, lng: 37.9062, iso2: "KE" },\r\n  { country: "Kiribati", code: "+686", flag: "🇰🇮", lat: -3.3704, lng: -168.734, iso2: "KI" },\r\n  { country: "Kuwait", code: "+965", flag: "🇰🇼", lat: 29.3117, lng: 47.4818, iso2: "KW" },\r\n  { country: "Kyrgyzstan", code: "+996", flag: "🇰🇬", lat: 41.2044, lng: 74.7661, iso2: "KG" },\r\n  { country: "Laos", code: "+856", flag: "🇱🇦", lat: 19.8563, lng: 102.4955, iso2: "LA" },\r\n  { country: "Latvia", code: "+371", flag: "🇱🇻", lat: 56.8796, lng: 24.6032, iso2: "LV" },\r\n  { country: "Lebanon", code: "+961", flag: "🇱🇧", lat: 33.8547, lng: 35.8623, iso2: "LB" },\r\n  { country: "Lesotho", code: "+266", flag: "🇱🇸", lat: -29.6099, lng: 28.2336, iso2: "LS" },\r\n  { country: "Liberia", code: "+231", flag: "🇱🇷", lat: 6.4281, lng: -9.4295, iso2: "LR" },\r\n  { country: "Libya", code: "+218", flag: "🇱🇾", lat: 26.3351, lng: 17.2283, iso2: "LY" },\r\n  { country: "Liechtenstein", code: "+423", flag: "🇱🇮", lat: 47.166, lng: 9.5554, iso2: "LI" },\r\n  { country: "Lithuania", code: "+370", flag: "🇱🇹", lat: 55.1694, lng: 23.8813, iso2: "LT" },\r\n  { country: "Luxembourg", code: "+352", flag: "🇱🇺", lat: 49.8153, lng: 6.1296, iso2: "LU" },\r\n  { country: "Madagascar", code: "+261", flag: "🇲🇬", lat: -18.7669, lng: 46.8691, iso2: "MG" },\r\n  { country: "Malawi", code: "+265", flag: "🇲🇼", lat: -13.2543, lng: 34.3015, iso2: "MW" },\r\n  { country: "Malaysia", code: "+60", flag: "🇲🇾", lat: 4.2105, lng: 101.9758, iso2: "MY" },\r\n  { country: "Maldives", code: "+960", flag: "🇲🇻", lat: 3.2028, lng: 73.2207, iso2: "MV" },\r\n  { country: "Mali", code: "+223", flag: "🇲🇱", lat: 17.5707, lng: -3.9962, iso2: "ML" },\r\n  { country: "Malta", code: "+356", flag: "🇲🇹", lat: 35.9375, lng: 14.3754, iso2: "MT" },\r\n  { country: "Marshall Islands", code: "+692", flag: "🇲🇭", lat: 7.1315, lng: 171.1857, iso2: "MH" },\r\n  { country: "Mauritania", code: "+222", flag: "🇲🇷", lat: 21.0079, lng: -10.9408, iso2: "MR" },\r\n  { country: "Mauritius", code: "+230", flag: "🇲🇺", lat: -20.3484, lng: 57.5522, iso2: "MU" },\r\n  { country: "Mexico", code: "+52", flag: "🇲🇽", lat: 23.6345, lng: -102.5528, iso2: "MX" },\r\n  { country: "Micronesia", code: "+691", flag: "🇫🇲", lat: 7.4256, lng: 150.5508, iso2: "FM" },\r\n  { country: "Moldova", code: "+373", flag: "🇲🇩", lat: 47.4116, lng: 28.3699, iso2: "MD" },\r\n  { country: "Monaco", code: "+377", flag: "🇲🇨", lat: 43.7333, lng: 7.4167, iso2: "MC" },\r\n  { country: "Mongolia", code: "+976", flag: "🇲🇳", lat: 46.8625, lng: 103.8467, iso2: "MN" },\r\n  { country: "Montenegro", code: "+382", flag: "🇲🇪", lat: 42.7087, lng: 19.3743, iso2: "ME" },\r\n  { country: "Morocco", code: "+212", flag: "🇲🇦", lat: 31.7917, lng: -7.0926, iso2: "MA" },\r\n  { country: "Mozambique", code: "+258", flag: "🇲🇿", lat: -18.6657, lng: 35.5296, iso2: "MZ" },\r\n  { country: "Myanmar", code: "+95", flag: "🇲🇲", lat: 21.914, lng: 95.9562, iso2: "MM" },\r\n  { country: "Namibia", code: "+264", flag: "🇳🇦", lat: -22.9576, lng: 18.4904, iso2: "NA" },\r\n  { country: "Nauru", code: "+674", flag: "🇳🇷", lat: -0.5228, lng: 166.9315, iso2: "NR" },\r\n  { country: "Nepal", code: "+977", flag: "🇳🇵", lat: 28.3949, lng: 84.124, iso2: "NP" },\r\n  { country: "Netherlands", code: "+31", flag: "🇳🇱", lat: 52.1326, lng: 5.2913, iso2: "NL" },\r\n  { country: "New Zealand", code: "+64", flag: "🇳🇿", lat: -40.9006, lng: 174.886, iso2: "NZ" },\r\n  { country: "Nicaragua", code: "+505", flag: "🇳🇮", lat: 12.8654, lng: -85.2072, iso2: "NI" },\r\n  { country: "Niger", code: "+227", flag: "🇳🇪", lat: 17.6078, lng: 8.0817, iso2: "NE" },\r\n  { country: "Nigeria", code: "+234", flag: "🇳🇬", lat: 9.082, lng: 8.6753, iso2: "NG" },\r\n  { country: "North Korea", code: "+850", flag: "🇰🇵", lat: 40.3399, lng: 127.51, iso2: "KP" },\r\n  { country: "North Macedonia", code: "+389", flag: "🇲🇰", lat: 41.6086, lng: 21.7453, iso2: "MK" },\r\n  { country: "Norway", code: "+47", flag: "🇳🇴", lat: 60.472, lng: 8.4689, iso2: "NO" },\r\n  { country: "Oman", code: "+968", flag: "🇴🇲", lat: 21.4735, lng: 55.9768, iso2: "OM" },\r\n  { country: "Pakistan", code: "+92", flag: "🇵🇰", lat: 30.3753, lng: 69.3451, iso2: "PK" },\r\n  { country: "Palau", code: "+680", flag: "🇵🇼", lat: 7.515, lng: 134.5825, iso2: "PW" },\r\n  { country: "Panama", code: "+507", flag: "🇵🇦", lat: 8.538, lng: -80.7821, iso2: "PA" },\r\n  { country: "Papua New Guinea", code: "+675", flag: "🇵🇬", lat: -6.315, lng: 143.9555, iso2: "PG" },\r\n  { country: "Paraguay", code: "+595", flag: "🇵🇾", lat: -23.4425, lng: -58.4438, iso2: "PY" },\r\n  { country: "Peru", code: "+51", flag: "🇵🇪", lat: -9.19, lng: -75.0152, iso2: "PE" },\r\n  { country: "Philippines", code: "+63", flag: "🇵🇭", lat: 12.8797, lng: 121.774, iso2: "PH" },\r\n  { country: "Poland", code: "+48", flag: "🇵🇱", lat: 51.9194, lng: 19.1451, iso2: "PL" },\r\n  { country: "Portugal", code: "+351", flag: "🇵🇹", lat: 39.3999, lng: -8.2245, iso2: "PT" },\r\n  { country: "Qatar", code: "+974", flag: "🇶🇦", lat: 25.3548, lng: 51.1839, iso2: "QA" },\r\n  { country: "Romania", code: "+40", flag: "🇷🇴", lat: 45.9432, lng: 24.9668, iso2: "RO" },\r\n  { country: "Russia", code: "+7", flag: "🇷🇺", lat: 61.524, lng: 105.3188, iso2: "RU" },\r\n  { country: "Rwanda", code: "+250", flag: "🇷🇼", lat: -1.9403, lng: 29.8739, iso2: "RW" },\r\n  { country: "Saint Kitts and Nevis", code: "+1869", flag: "🇰🇳", lat: 17.3578, lng: -62.783, iso2: "KN" },\r\n  { country: "Saint Lucia", code: "+1758", flag: "🇱🇨", lat: 13.9094, lng: -60.9789, iso2: "LC" },\r\n  { country: "Saint Vincent and the Grenadines", code: "+1784", flag: "🇻🇨", lat: 13.2505, lng: -61.2008, iso2: "VC" },\r\n  { country: "Samoa", code: "+685", flag: "🇼🇸", lat: -13.759, lng: -172.1046, iso2: "WS" },\r\n  { country: "San Marino", code: "+378", flag: "🇸🇲", lat: 43.9424, lng: 12.4578, iso2: "SM" },\r\n  { country: "Sao Tome and Principe", code: "+239", flag: "🇸🇹", lat: 0.1864, lng: 6.6131, iso2: "ST" },\r\n  { country: "Saudi Arabia", code: "+966", flag: "🇸🇦", lat: 23.8859, lng: 45.0792, iso2: "SA" },\r\n  { country: "Senegal", code: "+221", flag: "🇸🇳", lat: 14.4974, lng: -14.4524, iso2: "SN" },\r\n  { country: "Serbia", code: "+381", flag: "🇷🇸", lat: 44.0165, lng: 21.0059, iso2: "RS" },\r\n  { country: "Seychelles", code: "+248", flag: "🇸🇨", lat: -4.6796, lng: 55.492, iso2: "SC" },\r\n  { country: "Sierra Leone", code: "+232", flag: "🇸🇱", lat: 8.4606, lng: -11.7799, iso2: "SL" },\r\n  { country: "Singapore", code: "+65", flag: "🇸🇬", lat: 1.3521, lng: 103.8198, iso2: "SG" },\r\n  { country: "Slovakia", code: "+421", flag: "🇸🇰", lat: 48.669, lng: 19.699, iso2: "SK" },\r\n  { country: "Slovenia", code: "+386", flag: "🇸🇮", lat: 46.1512, lng: 14.9955, iso2: "SI" },\r\n  { country: "Solomon Islands", code: "+677", flag: "🇸🇧", lat: -9.6457, lng: 160.1562, iso2: "SB" },\r\n  { country: "Somalia", code: "+252", flag: "🇸🇴", lat: 5.1521, lng: 46.1996, iso2: "SO" },\r\n  { country: "South Africa", code: "+27", flag: "🇿🇦", lat: -30.5595, lng: 22.9375, iso2: "ZA" },\r\n  { country: "South Korea", code: "+82", flag: "🇰🇷", lat: 35.9078, lng: 127.7692, iso2: "KR" },\r\n  { country: "South Sudan", code: "+211", flag: "🇸🇸", lat: 6.877, lng: 31.307, iso2: "SS" },\r\n  { country: "Spain", code: "+34", flag: "🇪🇸", lat: 40.4637, lng: -3.7492, iso2: "ES" },\r\n  { country: "Sri Lanka", code: "+94", flag: "🇱🇰", lat: 7.8731, lng: 80.7718, iso2: "LK" },\r\n  { country: "Sudan", code: "+249", flag: "🇸🇩", lat: 12.8628, lng: 30.2176, iso2: "SD" },\r\n  { country: "Suriname", code: "+597", flag: "🇸🇷", lat: 3.9193, lng: -56.0278, iso2: "SR" },\r\n  { country: "Sweden", code: "+46", flag: "🇸🇪", lat: 60.1282, lng: 18.6435, iso2: "SE" },\r\n  { country: "Switzerland", code: "+41", flag: "🇨🇭", lat: 46.8182, lng: 8.2275, iso2: "CH" },\r\n  { country: "Syria", code: "+963", flag: "🇸🇾", lat: 34.8021, lng: 38.9968, iso2: "SY" },\r\n  { country: "Taiwan", code: "+886", flag: "🇹🇼", lat: 23.6978, lng: 120.9605, iso2: "TW" },\r\n  { country: "Tajikistan", code: "+992", flag: "🇹🇯", lat: 38.861, lng: 71.2761, iso2: "TJ" },\r\n  { country: "Tanzania", code: "+255", flag: "🇹🇿", lat: -6.369, lng: 34.8888, iso2: "TZ" },\r\n  { country: "Thailand", code: "+66", flag: "🇹🇭", lat: 15.87, lng: 100.9925, iso2: "TH" },\r\n  { country: "Togo", code: "+228", flag: "🇹🇬", lat: 8.6195, lng: 0.8248, iso2: "TG" },\r\n  { country: "Tonga", code: "+676", flag: "🇹🇴", lat: -20.4298, lng: -174.989, iso2: "TO" },\r\n  { country: "Trinidad and Tobago", code: "+1868", flag: "🇹🇹", lat: 10.6918, lng: -61.2225, iso2: "TT" },\r\n  { country: "Tunisia", code: "+216", flag: "🇹🇳", lat: 33.8869, lng: 9.5375, iso2: "TN" },\r\n  { country: "Turkey", code: "+90", flag: "🇹🇷", lat: 38.9637, lng: 35.2433, iso2: "TR" },\r\n  { country: "Turkmenistan", code: "+993", flag: "🇹🇲", lat: 38.9697, lng: 59.5563, iso2: "TM" },\r\n  { country: "Tuvalu", code: "+688", flag: "🇹🇻", lat: -7.1095, lng: 177.6493, iso2: "TV" },\r\n  { country: "Uganda", code: "+256", flag: "🇺🇬", lat: 1.3733, lng: 32.2903, iso2: "UG" },\r\n  { country: "Ukraine", code: "+380", flag: "🇺🇦", lat: 48.3794, lng: 31.1656, iso2: "UA" },\r\n  { country: "United Arab Emirates", code: "+971", flag: "🇦🇪", lat: 23.4241, lng: 53.8478, iso2: "AE" },\r\n  { country: "United Kingdom", code: "+44", flag: "🇬🇧", lat: 55.3781, lng: -3.436, iso2: "GB" },\r\n  { country: "United States", code: "+1", flag: "🇺🇸", lat: 39.8283, lng: -98.5795, iso2: "US" },\r\n  { country: "Uruguay", code: "+598", flag: "🇺🇾", lat: -32.5228, lng: -55.7658, iso2: "UY" },\r\n  { country: "Uzbekistan", code: "+998", flag: "🇺🇿", lat: 41.3775, lng: 64.5853, iso2: "UZ" },\r\n  { country: "Vanuatu", code: "+678", flag: "🇻🇺", lat: -15.3768, lng: 166.9592, iso2: "VU" },\r\n  { country: "Vatican City", code: "+379", flag: "🇻🇦", lat: 41.9029, lng: 12.4534, iso2: "VA" },\r\n  { country: "Venezuela", code: "+58", flag: "🇻🇪", lat: 6.4238, lng: -66.5897, iso2: "VE" },\r\n  { country: "Vietnam", code: "+84", flag: "🇻🇳", lat: 14.0583, lng: 108.2772, iso2: "VN" },\r\n  { country: "Yemen", code: "+967", flag: "🇾🇪", lat: 15.5527, lng: 48.5164, iso2: "YE" },\r\n  { country: "Zambia", code: "+260", flag: "🇿🇲", lat: -13.1339, lng: 27.8493, iso2: "ZM" },\r\n  { country: "Zimbabwe", code: "+263", flag: "🇿🇼", lat: -19.0154, lng: 29.1549, iso2: "ZW" },\r\n].sort');
__turbopack_context__.k.register(_c1, "COUNTRY_DATA");
__turbopack_context__.k.register(_c2, "NewProductPage");
__turbopack_context__.k.register(_c3, "AddressSelectionAndCreationModal");
__turbopack_context__.k.register(_c4, "AddressCreationForm");
__turbopack_context__.k.register(_c5, "CountryCombobox");
__turbopack_context__.k.register(_c6, "CountryCodeSelector");
__turbopack_context__.k.register(_c7, "AddressAutocomplete");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/wholesaler/products/new.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/wholesaler/products/new";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/src/pages/wholesaler/products/new.js [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/src/pages/wholesaler/products/new.js\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/wholesaler/products/new.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f0c68992._.js.map