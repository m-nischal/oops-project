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
"[project]/src/components/ui/dialog.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Dialog",
    ()=>Dialog,
    "DialogClose",
    ()=>DialogClose,
    "DialogContent",
    ()=>DialogContent,
    "DialogDescription",
    ()=>DialogDescription,
    "DialogFooter",
    ()=>DialogFooter,
    "DialogHeader",
    ()=>DialogHeader,
    "DialogOverlay",
    ()=>DialogOverlay,
    "DialogPortal",
    ()=>DialogPortal,
    "DialogTitle",
    ()=>DialogTitle,
    "DialogTrigger",
    ()=>DialogTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.js [client] (ecmascript)");
;
;
;
;
;
const Dialog = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Root"];
const DialogTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Trigger"];
const DialogPortal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Portal"];
const DialogClose = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Close"];
const DialogOverlay = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Overlay"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.jsx",
        lineNumber: 16,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c = DialogOverlay;
DialogOverlay.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Overlay"].displayName;
const DialogContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c1 = ({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogOverlay, {}, void 0, false, {
                fileName: "[project]/src/components/ui/dialog.jsx",
                lineNumber: 28,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"], {
                ref: ref,
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className),
                ...props,
                children: [
                    children,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Close"], {
                        className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/dialog.jsx",
                                lineNumber: 39,
                                columnNumber: 9
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/dialog.jsx",
                                lineNumber: 40,
                                columnNumber: 9
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui/dialog.jsx",
                        lineNumber: 37,
                        columnNumber: 7
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui/dialog.jsx",
                lineNumber: 29,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/dialog.jsx",
        lineNumber: 27,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c2 = DialogContent;
DialogContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Content"].displayName;
const DialogHeader = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 text-center sm:text-left", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.jsx",
        lineNumber: 51,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c3 = DialogHeader;
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.jsx",
        lineNumber: 61,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c4 = DialogFooter;
DialogFooter.displayName = "DialogFooter";
const DialogTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c5 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-lg font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.jsx",
        lineNumber: 68,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c6 = DialogTitle;
DialogTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Title"].displayName;
const DialogDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["forwardRef"](_c7 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$js__$5b$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/dialog.jsx",
        lineNumber: 76,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c8 = DialogDescription;
DialogDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__["Description"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
__turbopack_context__.k.register(_c, "DialogOverlay");
__turbopack_context__.k.register(_c1, "DialogContent$React.forwardRef");
__turbopack_context__.k.register(_c2, "DialogContent");
__turbopack_context__.k.register(_c3, "DialogHeader");
__turbopack_context__.k.register(_c4, "DialogFooter");
__turbopack_context__.k.register(_c5, "DialogTitle$React.forwardRef");
__turbopack_context__.k.register(_c6, "DialogTitle");
__turbopack_context__.k.register(_c7, "DialogDescription$React.forwardRef");
__turbopack_context__.k.register(_c8, "DialogDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/pages/profile.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProfilePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/user.js [client] (ecmascript) <export default as User>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mail.js [client] (ecmascript) <export default as Mail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-plus.js [client] (ecmascript) <export default as PlusCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/save.js [client] (ecmascript) <export default as Save>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/phone.js [client] (ecmascript) <export default as Phone>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/map-pin.js [client] (ecmascript) <export default as MapPin>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$locate$2d$fixed$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LocateFixed$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/locate-fixed.js [client] (ecmascript) <export default as LocateFixed>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/card.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/input.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/label.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/alert.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/dialog.jsx [client] (ecmascript)");
// Google Maps/Places API imports
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-google-maps/api/dist/esm.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/use-places-autocomplete/dist/index.esm.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
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
// --- EXTENDED COUNTRY DATA (Approx. 250 Countries) ---
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
function getUserInfoFromToken() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const token = localStorage.getItem("token");
    if (!token) return {
        isLoggedIn: false
    };
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return {
            isLoggedIn: true,
            name: payload.email || payload.name || "Customer"
        };
    } catch (e) {
        return {
            isLoggedIn: false
        };
    }
}
function ProfilePage() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isSaving, setIsSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [phone, setPhone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [addresses, setAddresses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isModalOpen, setIsModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editingAddress, setEditingAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [editingIndex, setEditingIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(-1);
    const [sessionUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(getUserInfoFromToken());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfilePage.useEffect": ()=>{
            if (!sessionUser.isLoggedIn) {
                router.replace('/login');
                return;
            }
            async function fetchProfile() {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch('/api/user/profile', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (!res.ok) throw new Error('Failed to fetch profile data.');
                    const { user: userData } = await res.json();
                    setUser(userData);
                    setName(userData.name || '');
                    setPhone(userData.phone || '');
                    setAddresses(userData.addresses || []);
                } catch (err) {
                    setError(err.message);
                } finally{
                    setLoading(false);
                }
            }
            fetchProfile();
        }
    }["ProfilePage.useEffect"], [
        sessionUser.isLoggedIn,
        router
    ]);
    const handleSaveProfile = async (e)=>{
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    phone,
                    addresses
                })
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update profile.');
            }
            const { user: updatedUser } = await res.json();
            setUser(updatedUser);
            setPhone(updatedUser.phone);
            setAddresses(updatedUser.addresses);
            alert('Profile updated successfully! ✅');
        } catch (err) {
            setError(err.message);
        } finally{
            setIsSaving(false);
        }
    };
    const handleAddressSave = (newAddress)=>{
        const newAddresses = [
            ...addresses
        ];
        if (editingIndex > -1) {
            newAddresses[editingIndex] = newAddress;
        } else {
            newAddresses.push(newAddress);
        }
        setAddresses(newAddresses);
        setIsModalOpen(false);
    };
    const handleAddAddress = ()=>{
        const defaultNameParts = user?.name ? user.name.split(' ') : [];
        setEditingAddress({
            label: "Home",
            firstName: defaultNameParts[0] || '',
            lastName: defaultNameParts.slice(1).join(' ') || '',
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            pincode: "",
            country: COUNTRY_DATA[0].country,
            phone: user.phone || "",
            countryCode: COUNTRY_DATA[0].code,
            location: {
                type: 'Point',
                coordinates: [
                    0,
                    0
                ]
            }
        });
        setEditingIndex(-1);
        setIsModalOpen(true);
    };
    const handleEditAddress = (addr, index)=>{
        setEditingAddress(addr);
        setEditingIndex(index);
        setIsModalOpen(true);
    };
    const removeAddress = (index)=>{
        if (window.confirm("Are you sure you want to remove this address?")) {
            setAddresses(addresses.filter((_, i)=>i !== index));
        }
    };
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-center items-center h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                className: "h-8 w-8 animate-spin"
            }, void 0, false, {
                fileName: "[project]/src/pages/profile.js",
                lineNumber: 350,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/pages/profile.js",
            lineNumber: 349,
            columnNumber: 7
        }, this);
    }
    if (!user) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "p-10",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Alert"], {
                variant: "destructive",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertTitle"], {
                        children: "Error"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/profile.js",
                        lineNumber: 359,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                        children: "Could not load user profile."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/profile.js",
                        lineNumber: 360,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/profile.js",
                lineNumber: 358,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/pages/profile.js",
            lineNumber: 357,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50/50 p-6 md:p-10",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-4xl mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-3xl font-bold mb-6 flex items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$user$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__User$3e$__["User"], {
                            className: "mr-3 h-6 w-6"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 370,
                            columnNumber: 11
                        }, this),
                        " My Profile"
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 369,
                    columnNumber: 9
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Alert"], {
                    variant: "destructive",
                    className: "mb-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertTitle"], {
                            children: "Error"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 375,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 376,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 374,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    onSubmit: handleSaveProfile,
                    className: "space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                            children: "Basic Information"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 384,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                            children: "Update your personal details."
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 385,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 383,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                    className: "space-y-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                    htmlFor: "name",
                                                    children: "Name"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 389,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                    id: "name",
                                                    value: name,
                                                    onChange: (e)=>setName(e.target.value),
                                                    required: true
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 390,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 388,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                    htmlFor: "phone",
                                                    children: "Phone Number"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 393,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center text-muted-foreground",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$phone$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Phone$3e$__["Phone"], {
                                                            className: "h-4 w-4 mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/profile.js",
                                                            lineNumber: 395,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                            id: "phone",
                                                            value: phone,
                                                            onChange: (e)=>setPhone(e.target.value),
                                                            type: "tel",
                                                            placeholder: "Your contact number"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/profile.js",
                                                            lineNumber: 396,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 394,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 392,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                                    htmlFor: "email",
                                                    children: "Email"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 400,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center text-muted-foreground",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mail$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mail$3e$__["Mail"], {
                                                            className: "h-4 w-4 mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/profile.js",
                                                            lineNumber: 402,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                                            id: "email",
                                                            value: user.email,
                                                            disabled: true,
                                                            className: "bg-gray-100"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/profile.js",
                                                            lineNumber: 403,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 401,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-muted-foreground",
                                                    children: "Email address cannot be changed."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 405,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 399,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 387,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 382,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                            className: "flex items-center justify-between",
                                            children: [
                                                "Shipping Addresses",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    type: "button",
                                                    onClick: handleAddAddress,
                                                    variant: "secondary",
                                                    size: "sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$plus$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__PlusCircle$3e$__["PlusCircle"], {
                                                            className: "h-4 w-4 mr-2"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/pages/profile.js",
                                                            lineNumber: 416,
                                                            columnNumber: 19
                                                        }, this),
                                                        " Add Address"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/pages/profile.js",
                                                    lineNumber: 415,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 413,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                            children: "Manage your saved delivery and billing addresses."
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 419,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 412,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                    className: "space-y-4",
                                    children: [
                                        addresses.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-muted-foreground italic",
                                            children: "No addresses saved."
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 422,
                                            columnNumber: 42
                                        }, this),
                                        addresses.map((addr, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border p-4 rounded-lg bg-white space-y-3 flex justify-between items-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "font-bold text-base flex items-center",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$map$2d$pin$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MapPin$3e$__["MapPin"], {
                                                                        className: "h-4 w-4 mr-2 text-primary"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/src/pages/profile.js",
                                                                        lineNumber: 428,
                                                                        columnNumber: 23
                                                                    }, this),
                                                                    addr.label || 'Other'
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/pages/profile.js",
                                                                lineNumber: 427,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-gray-700 mt-1",
                                                                children: [
                                                                    addr.addressLine1,
                                                                    " ",
                                                                    addr.addressLine2,
                                                                    ", ",
                                                                    addr.city,
                                                                    " - ",
                                                                    addr.pincode,
                                                                    " (",
                                                                    addr.country,
                                                                    ")"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/pages/profile.js",
                                                                lineNumber: 431,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-xs text-muted-foreground",
                                                                children: [
                                                                    "Recipient: ",
                                                                    addr.firstName,
                                                                    " ",
                                                                    addr.lastName,
                                                                    " | Phone: ",
                                                                    addr.countryCode,
                                                                    " ",
                                                                    addr.phone || 'N/A'
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/src/pages/profile.js",
                                                                lineNumber: 434,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/profile.js",
                                                        lineNumber: 426,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex space-x-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                type: "button",
                                                                onClick: ()=>handleEditAddress(addr, index),
                                                                variant: "outline",
                                                                size: "sm",
                                                                children: "Edit"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/profile.js",
                                                                lineNumber: 439,
                                                                columnNumber: 21
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                                                type: "button",
                                                                onClick: ()=>removeAddress(index),
                                                                variant: "ghost",
                                                                size: "icon",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                    className: "h-4 w-4 text-red-500"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/pages/profile.js",
                                                                    lineNumber: 448,
                                                                    columnNumber: 23
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/pages/profile.js",
                                                                lineNumber: 447,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/src/pages/profile.js",
                                                        lineNumber: 438,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, addr._id || index, true, {
                                                fileName: "[project]/src/pages/profile.js",
                                                lineNumber: 425,
                                                columnNumber: 17
                                            }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 421,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 411,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-end",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                type: "submit",
                                disabled: isSaving,
                                children: [
                                    isSaving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                        className: "h-4 w-4 mr-2 animate-spin"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/profile.js",
                                        lineNumber: 459,
                                        columnNumber: 27
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                        className: "h-4 w-4 mr-2"
                                    }, void 0, false, {
                                        fileName: "[project]/src/pages/profile.js",
                                        lineNumber: 459,
                                        columnNumber: 79
                                    }, this),
                                    "Save Changes"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/pages/profile.js",
                                lineNumber: 458,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 457,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 380,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AddressModal, {
                    isOpen: isModalOpen,
                    onClose: ()=>setIsModalOpen(false),
                    onSave: handleAddressSave,
                    initialAddress: editingAddress,
                    isNew: editingIndex === -1
                }, void 0, false, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 466,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/pages/profile.js",
            lineNumber: 368,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/pages/profile.js",
        lineNumber: 367,
        columnNumber: 5
    }, this);
}
_s(ProfilePage, "KKyTYXw7m0rLzEerOU8q42yas2Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c2 = ProfilePage;
// --- Address Modal ---
function AddressModal({ isOpen, onClose, onSave, initialAddress, isNew }) {
    _s1();
    const { isLoaded, loadError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useLoadScript"])({
        googleMapsApiKey: ("TURBOPACK compile-time value", "AIzaSyBHu17-FJ09v_hP5YcfeZS2cbJJaFas5nI"),
        libraries: libraries
    });
    const [address, setAddress] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(initialAddress || {});
    const defaultCenter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AddressModal.useMemo[defaultCenter]": ()=>({
                lat: 21.1458,
                lng: 79.0882
            })
    }["AddressModal.useMemo[defaultCenter]"], []);
    const [mapCenter, setMapCenter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(defaultCenter);
    const [markerPosition, setMarkerPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLocating, setIsLocating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const mapRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // NEW: Ref to hold the setValue function from AddressAutocomplete
    const addressSearchSetValueRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null); // <--- ADDED REF
    // Track if user has manually chosen a location
    const hasManualLocationRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const updateLocationAndAddress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[updateLocationAndAddress]": async (lat, lng, pan = true)=>{
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
                // NEW: Update Address Autocomplete search box text
                if (addressSearchSetValueRef.current) {
                    // Set the value without triggering the suggestions search (false argument)
                    addressSearchSetValueRef.current(addressDescription, false);
                }
                let newAddr = {
                    addressLine1: addressDescription.split(',')[0].trim(),
                    city: '',
                    state: '',
                    country: '',
                    pincode: '',
                    location: {
                        type: 'Point',
                        coordinates: [
                            lng,
                            lat
                        ]
                    }
                };
                let countryCodeFound = '';
                for (const component of components){
                    if (component.types.includes('locality')) newAddr.city = component.long_name;
                    if (component.types.includes('administrative_area_level_1')) newAddr.state = component.short_name;
                    if (component.types.includes('country')) {
                        newAddr.country = component.long_name;
                        countryCodeFound = component.short_name;
                    }
                    if (component.types.includes('postal_code')) newAddr.pincode = component.long_name;
                }
                if (!newAddr.addressLine1) newAddr.addressLine1 = addressDescription.split(',')[0].trim();
                const phoneCodeObj = countryCodeFound ? COUNTRY_DATA.find({
                    "AddressModal.useCallback[updateLocationAndAddress]": (c)=>c.iso2 === countryCodeFound
                }["AddressModal.useCallback[updateLocationAndAddress]"]) : null;
                setAddress({
                    "AddressModal.useCallback[updateLocationAndAddress]": (prev)=>({
                            ...prev,
                            ...newAddr,
                            countryCode: phoneCodeObj ? phoneCodeObj.code : prev.countryCode
                        })
                }["AddressModal.useCallback[updateLocationAndAddress]"]);
                if (mapRef.current && pan) {
                    mapRef.current.panTo(latLng);
                }
            } catch (error) {
                console.error("Reverse Geocode failed:", error);
                setAddress({
                    "AddressModal.useCallback[updateLocationAndAddress]": (prev)=>({
                            ...prev,
                            location: {
                                type: 'Point',
                                coordinates: [
                                    lng,
                                    lat
                                ]
                            }
                        })
                }["AddressModal.useCallback[updateLocationAndAddress]"]);
            }
        }
    }["AddressModal.useCallback[updateLocationAndAddress]"], []);
    const locateUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[locateUser]": ()=>{
            if (!navigator.geolocation) return;
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition({
                "AddressModal.useCallback[locateUser]": (position)=>{
                    // Don't override if user already picked a location
                    if (hasManualLocationRef.current) {
                        setIsLocating(false);
                        return;
                    }
                    const { latitude, longitude } = position.coords;
                    updateLocationAndAddress(latitude, longitude, true);
                    setIsLocating(false);
                }
            }["AddressModal.useCallback[locateUser]"], {
                "AddressModal.useCallback[locateUser]": (error)=>{
                    console.warn("Geolocation failed:", error);
                    const selectedCountry = COUNTRY_DATA.find({
                        "AddressModal.useCallback[locateUser].selectedCountry": (c)=>c.code === address.countryCode
                    }["AddressModal.useCallback[locateUser].selectedCountry"]);
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
            }["AddressModal.useCallback[locateUser]"], {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        }
    }["AddressModal.useCallback[locateUser]"], [
        updateLocationAndAddress,
        isLoaded,
        defaultCenter,
        address.countryCode
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AddressModal.useEffect": ()=>{
            const initial = initialAddress || {
                label: "Home",
                firstName: "",
                lastName: "",
                addressLine1: "",
                addressLine2: "",
                city: "",
                state: "",
                pincode: "",
                country: "",
                phone: "",
                countryCode: COUNTRY_DATA[0].code,
                location: {
                    type: 'Point',
                    coordinates: [
                        0,
                        0
                    ]
                }
            };
            setAddress(initial);
            // Reset manual flag for this modal open
            hasManualLocationRef.current = false;
            const initialCoords = initial.location?.coordinates;
            const hasInitialCoords = initialCoords && initialCoords[0] && initialCoords[1] && initialCoords[0] !== 0;
            if (hasInitialCoords) {
                const [lng, lat] = initialCoords;
                setMarkerPosition({
                    lat,
                    lng
                });
                setMapCenter({
                    lat,
                    lng
                });
            } else {
                setMarkerPosition(null);
                setMapCenter(defaultCenter);
            }
        }
    }["AddressModal.useEffect"], [
        initialAddress,
        defaultCenter
    ]);
    const onMapLoad = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[onMapLoad]": (map)=>{
            mapRef.current = map;
            const hasInitialCoords = initialAddress?.location?.coordinates && initialAddress.location.coordinates[0] !== 0;
            if (hasInitialCoords) {
                const [lng, lat] = initialAddress.location.coordinates;
                map.panTo({
                    lat,
                    lng
                });
            }
        }
    }["AddressModal.useCallback[onMapLoad]"], [
        initialAddress
    ]);
    const handlePlaceSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[handlePlaceSelect]": (addressDescription, latLng)=>{
            hasManualLocationRef.current = true;
            updateLocationAndAddress(latLng.lat, latLng.lng);
        }
    }["AddressModal.useCallback[handlePlaceSelect]"], [
        updateLocationAndAddress
    ]);
    const handleMapClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[handleMapClick]": (e)=>{
            hasManualLocationRef.current = true;
            updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
        }
    }["AddressModal.useCallback[handleMapClick]"], [
        updateLocationAndAddress
    ]);
    const handleMarkerDragEnd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[handleMarkerDragEnd]": (e)=>{
            hasManualLocationRef.current = true;
            updateLocationAndAddress(e.latLng.lat(), e.latLng.lng());
        }
    }["AddressModal.useCallback[handleMarkerDragEnd]"], [
        updateLocationAndAddress
    ]);
    const handleCountryNameSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[handleCountryNameSelect]": (selectedCountryName)=>{
            const selectedCountry = COUNTRY_DATA.find({
                "AddressModal.useCallback[handleCountryNameSelect].selectedCountry": (c)=>c.country === selectedCountryName
            }["AddressModal.useCallback[handleCountryNameSelect].selectedCountry"]);
            if (selectedCountry) {
                setAddress({
                    "AddressModal.useCallback[handleCountryNameSelect]": (prev)=>({
                            ...prev,
                            country: selectedCountryName,
                            countryCode: selectedCountry.code
                        })
                }["AddressModal.useCallback[handleCountryNameSelect]"]);
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
                    "AddressModal.useCallback[handleCountryNameSelect]": (prev)=>({
                            ...prev,
                            country: selectedCountryName
                        })
                }["AddressModal.useCallback[handleCountryNameSelect]"]);
            }
        }
    }["AddressModal.useCallback[handleCountryNameSelect]"], []);
    const handleCountryCodeChange = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AddressModal.useCallback[handleCountryCodeChange]": (newCode)=>{
            const selectedCountry = COUNTRY_DATA.find({
                "AddressModal.useCallback[handleCountryCodeChange].selectedCountry": (c)=>c.code === newCode
            }["AddressModal.useCallback[handleCountryCodeChange].selectedCountry"]);
            if (selectedCountry) {
                setAddress({
                    "AddressModal.useCallback[handleCountryCodeChange]": (prev)=>({
                            ...prev,
                            countryCode: newCode,
                            country: selectedCountry.country
                        })
                }["AddressModal.useCallback[handleCountryCodeChange]"]);
                if (mapRef.current) {
                    mapRef.current.panTo({
                        lat: selectedCountry.lat,
                        lng: selectedCountry.lng
                    });
                    mapRef.current.setZoom(8);
                }
            } else {
                setAddress({
                    "AddressModal.useCallback[handleCountryCodeChange]": (prev)=>({
                            ...prev,
                            countryCode: newCode
                        })
                }["AddressModal.useCallback[handleCountryCodeChange]"]);
            }
        }
    }["AddressModal.useCallback[handleCountryCodeChange]"], []);
    const handleChange = (field, value)=>{
        setAddress((prev)=>({
                ...prev,
                [field]: value
            }));
    };
    const handleSave = (e)=>{
        e.preventDefault();
        if (!address.addressLine1 || !address.city || !address.country || !address.phone || !address.firstName) {
            alert("Please fill all required fields: Name, Address, City, Country, and Phone.");
            return;
        }
        if (!markerPosition) {
            if (!window.confirm("Address coordinates are not set (pin missing on map). Continue without coordinates?")) {
                return;
            }
        }
        onSave(address);
    };
    if (loadError) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Error loading maps."
    }, void 0, false, {
        fileName: "[project]/src/pages/profile.js",
        lineNumber: 702,
        columnNumber: 25
    }, this);
    if (!address) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Dialog"], {
        open: isOpen,
        onOpenChange: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DialogContent"], {
            className: "sm:max-w-[700px] max-h-[90vh] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                            children: isNew ? "Add New Address" : "Edit Address"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 709,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DialogDescription"], {
                            children: "Provide the complete details for this shipping location."
                        }, void 0, false, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 710,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 708,
                    columnNumber: 9
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
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 718,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                    id: "label",
                                    value: address.label || '',
                                    onChange: (e)=>handleChange('label', e.target.value),
                                    placeholder: "Home",
                                    required: true
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 719,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 717,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                    htmlFor: "country",
                                    children: "Country/Region"
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 724,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CountryCombobox, {
                                    value: address.country || '',
                                    onChange: handleCountryNameSelect
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 725,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-muted-foreground",
                                    children: "Type to search, or select from the dropdown. Choosing a country centers the map."
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 729,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 723,
                            columnNumber: 11
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
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 735,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                            id: "firstName",
                                            value: address.firstName || '',
                                            onChange: (e)=>handleChange('firstName', e.target.value),
                                            placeholder: "First Name",
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 736,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 734,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "lastName",
                                            children: "Last Name"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 739,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                            id: "lastName",
                                            value: address.lastName || '',
                                            onChange: (e)=>handleChange('lastName', e.target.value),
                                            placeholder: "Last Name"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 740,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 738,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 733,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                    htmlFor: "addressSearch",
                                    children: "Address (Search & Pin)"
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 746,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AddressAutocomplete, {
                                    onSelect: handlePlaceSelect,
                                    setExternalValueRef: addressSearchSetValueRef
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 748,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "outline",
                                    size: "sm",
                                    onClick: locateUser,
                                    disabled: isLocating || !isLoaded,
                                    className: "mt-1 flex items-center justify-center w-full",
                                    children: [
                                        isLocating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                            className: "animate-spin h-4 w-4 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 762,
                                            columnNumber: 29
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$locate$2d$fixed$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__LocateFixed$3e$__["LocateFixed"], {
                                            className: "h-4 w-4 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 762,
                                            columnNumber: 81
                                        }, this),
                                        isLocating ? "Locating you..." : "Locate Me"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 754,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "h-[250px] w-full rounded-md overflow-hidden border relative mt-2",
                                    children: isLoaded ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["GoogleMap"], {
                                        zoom: markerPosition ? 15 : address.country ? 8 : 5,
                                        center: mapCenter,
                                        mapContainerClassName: "w-full h-full",
                                        onClick: handleMapClick,
                                        onLoad: onMapLoad,
                                        children: [
                                            markerPosition && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Marker"], {
                                                position: markerPosition,
                                                draggable: true,
                                                onDragEnd: handleMarkerDragEnd
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/profile.js",
                                                lineNumber: 777,
                                                columnNumber: 21
                                            }, this),
                                            isLocating && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                className: "animate-spin h-8 w-8 absolute top-1/2 left-1/2 -mt-4 -ml-4 z-10"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/profile.js",
                                                lineNumber: 783,
                                                columnNumber: 34
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/profile.js",
                                        lineNumber: 769,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "p-4 text-center flex justify-center items-center h-full",
                                        children: [
                                            isLocating ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                                className: "animate-spin h-4 w-4 mr-2"
                                            }, void 0, false, {
                                                fileName: "[project]/src/pages/profile.js",
                                                lineNumber: 787,
                                                columnNumber: 33
                                            }, this) : null,
                                            isLocating ? "Locating you..." : "Loading map..."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/pages/profile.js",
                                        lineNumber: 786,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 767,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 745,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                    htmlFor: "addressLine2",
                                    children: "Apartment, suite, unit, building (Optional)"
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 796,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                    id: "addressLine2",
                                    value: address.addressLine2 || '',
                                    onChange: (e)=>handleChange('addressLine2', e.target.value),
                                    placeholder: "Apartment, suite, etc."
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 797,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 795,
                            columnNumber: 11
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
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 808,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                            id: "city",
                                            value: address.city || '',
                                            onChange: (e)=>handleChange('city', e.target.value),
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 809,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 807,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "state",
                                            children: "State/Region"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 812,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                            id: "state",
                                            value: address.state || '',
                                            onChange: (e)=>handleChange('state', e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 813,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 811,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                            htmlFor: "pincode",
                                            children: "PIN code"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 816,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                            id: "pincode",
                                            value: address.pincode || '',
                                            onChange: (e)=>handleChange('pincode', e.target.value)
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 817,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 815,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 806,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$label$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Label"], {
                                    htmlFor: "addressPhone",
                                    children: "Mobile number (for delivery)"
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 823,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex space-x-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CountryCodeSelector, {
                                            value: address.countryCode || COUNTRY_DATA[0].code,
                                            onChange: handleCountryCodeChange
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 825,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$input$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Input"], {
                                            id: "addressPhone",
                                            value: address.phone || '',
                                            onChange: (e)=>handleChange('phone', e.target.value),
                                            placeholder: "Mobile number",
                                            type: "tel",
                                            required: true
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 826,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 824,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 822,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["DialogFooter"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "button",
                                    variant: "outline",
                                    onClick: onClose,
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 838,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Button"], {
                                    type: "submit",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                            className: "h-4 w-4 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/profile.js",
                                            lineNumber: 840,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        isNew ? "Add Address" : "Save Address"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 839,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 837,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 714,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/pages/profile.js",
            lineNumber: 707,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/pages/profile.js",
        lineNumber: 706,
        columnNumber: 5
    }, this);
}
_s1(AddressModal, "xMNDQZULlG4xCCbykGAtFhdD93c=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$google$2d$maps$2f$api$2f$dist$2f$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useLoadScript"]
    ];
});
_c3 = AddressModal;
// --- Country Combobox (UNCHANGED) ---
function CountryCombobox({ value, onChange }) {
    _s2();
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
    }["CountryCombobox.useEffect"], [
        wrapperRef
    ]);
    const handleInputChange = (e)=>{
        setInputValue(e.target.value);
        setIsMenuOpen(true);
        onChange(e.target.value);
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
                id: "country",
                value: inputValue,
                onChange: handleInputChange,
                onFocus: ()=>setIsMenuOpen(true),
                placeholder: "Type country name or select...",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/pages/profile.js",
                lineNumber: 892,
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
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 911,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-muted-foreground text-xs",
                                    children: c.code
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/profile.js",
                                    lineNumber: 914,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, c.country, true, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 906,
                            columnNumber: 17
                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "p-3 text-sm text-muted-foreground",
                        children: "No matches found."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/profile.js",
                        lineNumber: 918,
                        columnNumber: 15
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 903,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/profile.js",
                lineNumber: 902,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/profile.js",
        lineNumber: 891,
        columnNumber: 5
    }, this);
}
_s2(CountryCombobox, "JQ+AroPm8cVd9xLfEqJ353ziOL8=");
_c4 = CountryCombobox;
// --- Country Code Selector (UNCHANGED) ---
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
                fileName: "[project]/src/pages/profile.js",
                lineNumber: 936,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/pages/profile.js",
        lineNumber: 930,
        columnNumber: 5
    }, this);
}
_c5 = CountryCodeSelector;
// --- Address Autocomplete (UPDATED) ---
function AddressAutocomplete({ onSelect, setExternalValueRef }) {
    _s3();
    const { ready, value, setValue, suggestions: { status, data }, clearSuggestions } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"])({
        // FIX: Removed componentRestrictions to enable global search
        debounce: 300
    });
    // NEW: Expose setValue to parent via ref
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AddressAutocomplete.useEffect": ()=>{
            if (setExternalValueRef) {
                setExternalValueRef.current = setValue;
                return ({
                    "AddressAutocomplete.useEffect": ()=>setExternalValueRef.current = null
                })["AddressAutocomplete.useEffect"]; // Cleanup
            }
        }
    }["AddressAutocomplete.useEffect"], [
        setValue,
        setExternalValueRef
    ]);
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
                fileName: "[project]/src/pages/profile.js",
                lineNumber: 981,
                columnNumber: 7
            }, this),
            status === "OK" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["Card"], {
                className: "absolute top-full mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden border",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "divide-y",
                    children: data.map(({ place_id, description })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            onClick: ()=>handleSelect(description),
                            className: "p-3 hover:bg-gray-50 cursor-pointer text-sm",
                            children: description
                        }, place_id, false, {
                            fileName: "[project]/src/pages/profile.js",
                            lineNumber: 993,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/pages/profile.js",
                    lineNumber: 991,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/profile.js",
                lineNumber: 990,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/pages/profile.js",
        lineNumber: 980,
        columnNumber: 5
    }, this);
}
_s3(AddressAutocomplete, "JQXwpp/YX8XLmvDDhc53EtrTVII=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$use$2d$places$2d$autocomplete$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"]
    ];
});
_c6 = AddressAutocomplete;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, 'COUNTRY_DATA$[\n  { country: "Afghanistan", code: "+93", flag: "🇦🇫", lat: 33.9391, lng: 67.7099, iso2: "AF" },\n  { country: "Albania", code: "+355", flag: "🇦🇱", lat: 41.1533, lng: 20.1683, iso2: "AL" },\n  { country: "Algeria", code: "+213", flag: "🇩🇿", lat: 28.0339, lng: 1.6596, iso2: "DZ" },\n  { country: "Andorra", code: "+376", flag: "🇦🇩", lat: 42.5462, lng: 1.6015, iso2: "AD" },\n  { country: "Angola", code: "+244", flag: "🇦🇴", lat: -11.2027, lng: 17.8739, iso2: "AO" },\n  { country: "Antigua and Barbuda", code: "+1268", flag: "🇦🇬", lat: 17.0608, lng: -61.7964, iso2: "AG" },\n  { country: "Argentina", code: "+54", flag: "🇦🇷", lat: -38.4161, lng: -63.6167, iso2: "AR" },\n  { country: "Armenia", code: "+374", flag: "🇦🇲", lat: 40.0691, lng: 45.0382, iso2: "AM" },\n  { country: "Australia", code: "+61", flag: "🇦🇺", lat: -25.2744, lng: 133.7751, iso2: "AU" },\n  { country: "Austria", code: "+43", flag: "🇦🇹", lat: 47.5162, lng: 14.5501, iso2: "AT" },\n  { country: "Azerbaijan", code: "+994", flag: "🇦🇿", lat: 40.1431, lng: 47.5769, iso2: "AZ" },\n  { country: "Bahamas", code: "+1242", flag: "🇧🇸", lat: 25.0343, lng: -77.3963, iso2: "BS" },\n  { country: "Bahrain", code: "+973", flag: "🇧🇭", lat: 25.9304, lng: 50.6378, iso2: "BH" },\n  { country: "Bangladesh", code: "+880", flag: "🇧🇩", lat: 23.685, lng: 90.3563, iso2: "BD" },\n  { country: "Barbados", code: "+1246", flag: "🇧🇧", lat: 13.1939, lng: -59.5432, iso2: "BB" },\n  { country: "Belarus", code: "+375", flag: "🇧🇾", lat: 53.7098, lng: 27.9534, iso2: "BY" },\n  { country: "Belgium", code: "+32", flag: "🇧🇪", lat: 50.5039, lng: 4.4699, iso2: "BE" },\n  { country: "Belize", code: "+501", flag: "🇧🇿", lat: 17.1899, lng: -88.4977, iso2: "BZ" },\n  { country: "Benin", code: "+229", flag: "🇧🇯", lat: 9.3077, lng: 2.3158, iso2: "BJ" },\n  { country: "Bhutan", code: "+975", flag: "🇧🇹", lat: 27.5142, lng: 90.4336, iso2: "BT" },\n  { country: "Bolivia", code: "+591", flag: "🇧🇴", lat: -16.2902, lng: -63.5887, iso2: "BO" },\n  { country: "Bosnia and Herzegovina", code: "+387", flag: "🇧🇦", lat: 43.9159, lng: 17.6791, iso2: "BA" },\n  { country: "Botswana", code: "+267", flag: "🇧🇼", lat: -22.3285, lng: 24.6849, iso2: "BW" },\n  { country: "Brazil", code: "+55", flag: "🇧🇷", lat: -14.235, lng: -51.9253, iso2: "BR" },\n  { country: "Brunei", code: "+673", flag: "🇧🇳", lat: 4.5353, lng: 114.7277, iso2: "BN" },\n  { country: "Bulgaria", code: "+359", flag: "🇧🇬", lat: 42.7339, lng: 25.4858, iso2: "BG" },\n  { country: "Burkina Faso", code: "+226", flag: "🇧🇫", lat: 12.2383, lng: -1.5616, iso2: "BF" },\n  { country: "Burundi", code: "+257", flag: "🇧🇮", lat: -3.3731, lng: 29.9189, iso2: "BI" },\n  { country: "Cabo Verde", code: "+238", flag: "🇨🇻", lat: 16.0021, lng: -24.0132, iso2: "CV" },\n  { country: "Cambodia", code: "+855", flag: "🇰🇭", lat: 12.5657, lng: 104.991, iso2: "KH" },\n  { country: "Cameroon", code: "+237", flag: "🇨🇲", lat: 7.3697, lng: 12.3547, iso2: "CM" },\n  { country: "Canada", code: "+1", flag: "🇨🇦", lat: 56.1304, lng: -106.3468, iso2: "CA" },\n  { country: "Central African Republic", code: "+236", flag: "🇨🇫", lat: 6.6111, lng: 20.9394, iso2: "CF" },\n  { country: "Chad", code: "+235", flag: "🇹🇩", lat: 15.4542, lng: 18.7322, iso2: "TD" },\n  { country: "Chile", code: "+56", flag: "🇨🇱", lat: -35.6751, lng: -71.543, iso2: "CL" },\n  { country: "China", code: "+86", flag: "🇨🇳", lat: 35.8617, lng: 104.1954, iso2: "CN" },\n  { country: "Colombia", code: "+57", flag: "🇨🇴", lat: 4.5709, lng: -74.2973, iso2: "CO" },\n  { country: "Comoros", code: "+269", flag: "🇰🇲", lat: -11.875, lng: 43.8722, iso2: "KM" },\n  { country: "Congo (Brazzaville)", code: "+242", flag: "🇨🇬", lat: -0.228, lng: 15.8277, iso2: "CG" },\n  { country: "Congo (Kinshasa)", code: "+243", flag: "🇨🇩", lat: -4.0383, lng: 21.7587, iso2: "CD" },\n  { country: "Costa Rica", code: "+506", flag: "🇨🇷", lat: 9.7489, lng: -83.7534, iso2: "CR" },\n  { country: "Croatia", code: "+385", flag: "🇭🇷", lat: 45.1, lng: 15.2, iso2: "HR" },\n  { country: "Cuba", code: "+53", flag: "🇨🇺", lat: 21.5218, lng: -77.7812, iso2: "CU" },\n  { country: "Cyprus", code: "+357", flag: "🇨🇾", lat: 35.1264, lng: 33.4299, iso2: "CY" },\n  { country: "Czechia", code: "+420", flag: "🇨🇿", lat: 49.8175, lng: 15.4729, iso2: "CZ" },\n  { country: "Denmark", code: "+45", flag: "🇩🇰", lat: 56.2639, lng: 9.5018, iso2: "DK" },\n  { country: "Djibouti", code: "+253", flag: "🇩🇯", lat: 11.8251, lng: 42.5903, iso2: "DJ" },\n  { country: "Dominica", code: "+1767", flag: "🇩🇲", lat: 15.415, lng: -61.371, iso2: "DM" },\n  { country: "Dominican Republic", code: "+1809", flag: "🇩🇴", lat: 18.7357, lng: -70.1626, iso2: "DO" },\n  { country: "East Timor", code: "+670", flag: "🇹🇱", lat: -8.8742, lng: 125.7275, iso2: "TL" },\n  { country: "Ecuador", code: "+593", flag: "🇪🇨", lat: -1.8312, lng: -78.1834, iso2: "EC" },\n  { country: "Egypt", code: "+20", flag: "🇪🇬", lat: 26.8206, lng: 30.8025, iso2: "EG" },\n  { country: "El Salvador", code: "+503", flag: "🇸🇻", lat: 13.7942, lng: -88.8965, iso2: "SV" },\n  { country: "Equatorial Guinea", code: "+240", flag: "🇬🇶", lat: 1.6508, lng: 10.2679, iso2: "GQ" },\n  { country: "Eritrea", code: "+291", flag: "🇪🇷", lat: 15.1794, lng: 39.7823, iso2: "ER" },\n  { country: "Estonia", code: "+372", flag: "🇪🇪", lat: 58.5953, lng: 25.0136, iso2: "EE" },\n  { country: "Eswatini", code: "+268", flag: "🇸🇿", lat: -26.5225, lng: 31.4659, iso2: "SZ" },\n  { country: "Ethiopia", code: "+251", flag: "🇪🇹", lat: 9.145, lng: 40.4897, iso2: "ET" },\n  { country: "Fiji", code: "+679", flag: "🇫🇯", lat: -16.5782, lng: 179.4145, iso2: "FJ" },\n  { country: "Finland", code: "+358", flag: "🇫🇮", lat: 61.9241, lng: 25.7482, iso2: "FI" },\n  { country: "France", code: "+33", flag: "🇫🇷", lat: 46.2276, lng: 2.2137, iso2: "FR" },\n  { country: "Gabon", code: "+241", flag: "🇬🇦", lat: -0.8037, lng: 11.6094, iso2: "GA" },\n  { country: "Gambia", code: "+220", flag: "🇬🇲", lat: 13.4432, lng: -15.3101, iso2: "GM" },\n  { country: "Georgia", code: "+995", flag: "🇬🇪", lat: 42.3154, lng: 43.3569, iso2: "GE" },\n  { country: "Germany", code: "+49", flag: "🇩🇪", lat: 51.1657, lng: 10.4515, iso2: "DE" },\n  { country: "Ghana", code: "+233", flag: "🇬🇭", lat: 7.9465, lng: -1.0232, iso2: "GH" },\n  { country: "Greece", code: "+30", flag: "🇬🇷", lat: 39.0742, lng: 21.8243, iso2: "GR" },\n  { country: "Grenada", code: "+1473", flag: "🇬🇩", lat: 12.2628, lng: -61.6042, iso2: "GD" },\n  { country: "Guatemala", code: "+502", flag: "🇬🇹", lat: 15.7835, lng: -90.2308, iso2: "GT" },\n  { country: "Guinea", code: "+224", flag: "🇬🇳", lat: 9.9456, lng: -9.6966, iso2: "GN" },\n  { country: "Guinea-Bissau", code: "+245", flag: "🇬🇼", lat: 11.8037, lng: -15.1804, iso2: "GW" },\n  { country: "Guyana", code: "+592", flag: "🇬🇾", lat: 4.8604, lng: -58.9302, iso2: "GY" },\n  { country: "Haiti", code: "+509", flag: "🇭🇹", lat: 18.9712, lng: -72.2852, iso2: "HT" },\n  { country: "Honduras", code: "+504", flag: "🇭🇳", lat: 15.1999, lng: -86.2419, iso2: "HN" },\n  { country: "Hungary", code: "+36", flag: "🇭🇺", lat: 47.1625, lng: 19.5033, iso2: "HU" },\n  { country: "Iceland", code: "+354", flag: "🇮🇸", lat: 64.9631, lng: -19.0208, iso2: "IS" },\n  { country: "India", code: "+91", flag: "🇮🇳", lat: 20.5937, lng: 78.9629, iso2: "IN" },\n  { country: "Indonesia", code: "+62", flag: "🇮🇩", lat: -0.7893, lng: 113.9213, iso2: "ID" },\n  { country: "Iran", code: "+98", flag: "🇮🇷", lat: 32.4279, lng: 53.688, iso2: "IR" },\n  { country: "Iraq", code: "+964", flag: "🇮🇶", lat: 33.2232, lng: 43.6793, iso2: "IQ" },\n  { country: "Ireland", code: "+353", flag: "🇮🇪", lat: 53.4129, lng: -8.2439, iso2: "IE" },\n  { country: "Israel", code: "+972", flag: "🇮🇱", lat: 31.0461, lng: 34.8516, iso2: "IL" },\n  { country: "Italy", code: "+39", flag: "🇮🇹", lat: 41.8719, lng: 12.5674, iso2: "IT" },\n  { country: "Jamaica", code: "+1876", flag: "🇯🇲", lat: 18.1096, lng: -77.2975, iso2: "JM" },\n  { country: "Japan", code: "+81", flag: "🇯🇵", lat: 36.2048, lng: 138.2529, iso2: "JP" },\n  { country: "Jordan", code: "+962", flag: "🇯🇴", lat: 30.5852, lng: 36.2384, iso2: "JO" },\n  { country: "Kazakhstan", code: "+7", flag: "🇰🇿", lat: 48.0196, lng: 66.9237, iso2: "KZ" },\n  { country: "Kenya", code: "+254", flag: "🇰🇪", lat: -0.0236, lng: 37.9062, iso2: "KE" },\n  { country: "Kiribati", code: "+686", flag: "🇰🇮", lat: -3.3704, lng: -168.734, iso2: "KI" },\n  { country: "Kuwait", code: "+965", flag: "🇰🇼", lat: 29.3117, lng: 47.4818, iso2: "KW" },\n  { country: "Kyrgyzstan", code: "+996", flag: "🇰🇬", lat: 41.2044, lng: 74.7661, iso2: "KG" },\n  { country: "Laos", code: "+856", flag: "🇱🇦", lat: 19.8563, lng: 102.4955, iso2: "LA" },\n  { country: "Latvia", code: "+371", flag: "🇱🇻", lat: 56.8796, lng: 24.6032, iso2: "LV" },\n  { country: "Lebanon", code: "+961", flag: "🇱🇧", lat: 33.8547, lng: 35.8623, iso2: "LB" },\n  { country: "Lesotho", code: "+266", flag: "🇱🇸", lat: -29.6099, lng: 28.2336, iso2: "LS" },\n  { country: "Liberia", code: "+231", flag: "🇱🇷", lat: 6.4281, lng: -9.4295, iso2: "LR" },\n  { country: "Libya", code: "+218", flag: "🇱🇾", lat: 26.3351, lng: 17.2283, iso2: "LY" },\n  { country: "Liechtenstein", code: "+423", flag: "🇱🇮", lat: 47.166, lng: 9.5554, iso2: "LI" },\n  { country: "Lithuania", code: "+370", flag: "🇱🇹", lat: 55.1694, lng: 23.8813, iso2: "LT" },\n  { country: "Luxembourg", code: "+352", flag: "🇱🇺", lat: 49.8153, lng: 6.1296, iso2: "LU" },\n  { country: "Madagascar", code: "+261", flag: "🇲🇬", lat: -18.7669, lng: 46.8691, iso2: "MG" },\n  { country: "Malawi", code: "+265", flag: "🇲🇼", lat: -13.2543, lng: 34.3015, iso2: "MW" },\n  { country: "Malaysia", code: "+60", flag: "🇲🇾", lat: 4.2105, lng: 101.9758, iso2: "MY" },\n  { country: "Maldives", code: "+960", flag: "🇲🇻", lat: 3.2028, lng: 73.2207, iso2: "MV" },\n  { country: "Mali", code: "+223", flag: "🇲🇱", lat: 17.5707, lng: -3.9962, iso2: "ML" },\n  { country: "Malta", code: "+356", flag: "🇲🇹", lat: 35.9375, lng: 14.3754, iso2: "MT" },\n  { country: "Marshall Islands", code: "+692", flag: "🇲🇭", lat: 7.1315, lng: 171.1857, iso2: "MH" },\n  { country: "Mauritania", code: "+222", flag: "🇲🇷", lat: 21.0079, lng: -10.9408, iso2: "MR" },\n  { country: "Mauritius", code: "+230", flag: "🇲🇺", lat: -20.3484, lng: 57.5522, iso2: "MU" },\n  { country: "Mexico", code: "+52", flag: "🇲🇽", lat: 23.6345, lng: -102.5528, iso2: "MX" },\n  { country: "Micronesia", code: "+691", flag: "🇫🇲", lat: 7.4256, lng: 150.5508, iso2: "FM" },\n  { country: "Moldova", code: "+373", flag: "🇲🇩", lat: 47.4116, lng: 28.3699, iso2: "MD" },\n  { country: "Monaco", code: "+377", flag: "🇲🇨", lat: 43.7333, lng: 7.4167, iso2: "MC" },\n  { country: "Mongolia", code: "+976", flag: "🇲🇳", lat: 46.8625, lng: 103.8467, iso2: "MN" },\n  { country: "Montenegro", code: "+382", flag: "🇲🇪", lat: 42.7087, lng: 19.3743, iso2: "ME" },\n  { country: "Morocco", code: "+212", flag: "🇲🇦", lat: 31.7917, lng: -7.0926, iso2: "MA" },\n  { country: "Mozambique", code: "+258", flag: "🇲🇿", lat: -18.6657, lng: 35.5296, iso2: "MZ" },\n  { country: "Myanmar", code: "+95", flag: "🇲🇲", lat: 21.914, lng: 95.9562, iso2: "MM" },\n  { country: "Namibia", code: "+264", flag: "🇳🇦", lat: -22.9576, lng: 18.4904, iso2: "NA" },\n  { country: "Nauru", code: "+674", flag: "🇳🇷", lat: -0.5228, lng: 166.9315, iso2: "NR" },\n  { country: "Nepal", code: "+977", flag: "🇳🇵", lat: 28.3949, lng: 84.124, iso2: "NP" },\n  { country: "Netherlands", code: "+31", flag: "🇳🇱", lat: 52.1326, lng: 5.2913, iso2: "NL" },\n  { country: "New Zealand", code: "+64", flag: "🇳🇿", lat: -40.9006, lng: 174.886, iso2: "NZ" },\n  { country: "Nicaragua", code: "+505", flag: "🇳🇮", lat: 12.8654, lng: -85.2072, iso2: "NI" },\n  { country: "Niger", code: "+227", flag: "🇳🇪", lat: 17.6078, lng: 8.0817, iso2: "NE" },\n  { country: "Nigeria", code: "+234", flag: "🇳🇬", lat: 9.082, lng: 8.6753, iso2: "NG" },\n  { country: "North Korea", code: "+850", flag: "🇰🇵", lat: 40.3399, lng: 127.51, iso2: "KP" },\n  { country: "North Macedonia", code: "+389", flag: "🇲🇰", lat: 41.6086, lng: 21.7453, iso2: "MK" },\n  { country: "Norway", code: "+47", flag: "🇳🇴", lat: 60.472, lng: 8.4689, iso2: "NO" },\n  { country: "Oman", code: "+968", flag: "🇴🇲", lat: 21.4735, lng: 55.9768, iso2: "OM" },\n  { country: "Pakistan", code: "+92", flag: "🇵🇰", lat: 30.3753, lng: 69.3451, iso2: "PK" },\n  { country: "Palau", code: "+680", flag: "🇵🇼", lat: 7.515, lng: 134.5825, iso2: "PW" },\n  { country: "Panama", code: "+507", flag: "🇵🇦", lat: 8.538, lng: -80.7821, iso2: "PA" },\n  { country: "Papua New Guinea", code: "+675", flag: "🇵🇬", lat: -6.315, lng: 143.9555, iso2: "PG" },\n  { country: "Paraguay", code: "+595", flag: "🇵🇾", lat: -23.4425, lng: -58.4438, iso2: "PY" },\n  { country: "Peru", code: "+51", flag: "🇵🇪", lat: -9.19, lng: -75.0152, iso2: "PE" },\n  { country: "Philippines", code: "+63", flag: "🇵🇭", lat: 12.8797, lng: 121.774, iso2: "PH" },\n  { country: "Poland", code: "+48", flag: "🇵🇱", lat: 51.9194, lng: 19.1451, iso2: "PL" },\n  { country: "Portugal", code: "+351", flag: "🇵🇹", lat: 39.3999, lng: -8.2245, iso2: "PT" },\n  { country: "Qatar", code: "+974", flag: "🇶🇦", lat: 25.3548, lng: 51.1839, iso2: "QA" },\n  { country: "Romania", code: "+40", flag: "🇷🇴", lat: 45.9432, lng: 24.9668, iso2: "RO" },\n  { country: "Russia", code: "+7", flag: "🇷🇺", lat: 61.524, lng: 105.3188, iso2: "RU" },\n  { country: "Rwanda", code: "+250", flag: "🇷🇼", lat: -1.9403, lng: 29.8739, iso2: "RW" },\n  { country: "Saint Kitts and Nevis", code: "+1869", flag: "🇰🇳", lat: 17.3578, lng: -62.783, iso2: "KN" },\n  { country: "Saint Lucia", code: "+1758", flag: "🇱🇨", lat: 13.9094, lng: -60.9789, iso2: "LC" },\n  { country: "Saint Vincent and the Grenadines", code: "+1784", flag: "🇻🇨", lat: 13.2505, lng: -61.2008, iso2: "VC" },\n  { country: "Samoa", code: "+685", flag: "🇼🇸", lat: -13.759, lng: -172.1046, iso2: "WS" },\n  { country: "San Marino", code: "+378", flag: "🇸🇲", lat: 43.9424, lng: 12.4578, iso2: "SM" },\n  { country: "Sao Tome and Principe", code: "+239", flag: "🇸🇹", lat: 0.1864, lng: 6.6131, iso2: "ST" },\n  { country: "Saudi Arabia", code: "+966", flag: "🇸🇦", lat: 23.8859, lng: 45.0792, iso2: "SA" },\n  { country: "Senegal", code: "+221", flag: "🇸🇳", lat: 14.4974, lng: -14.4524, iso2: "SN" },\n  { country: "Serbia", code: "+381", flag: "🇷🇸", lat: 44.0165, lng: 21.0059, iso2: "RS" },\n  { country: "Seychelles", code: "+248", flag: "🇸🇨", lat: -4.6796, lng: 55.492, iso2: "SC" },\n  { country: "Sierra Leone", code: "+232", flag: "🇸🇱", lat: 8.4606, lng: -11.7799, iso2: "SL" },\n  { country: "Singapore", code: "+65", flag: "🇸🇬", lat: 1.3521, lng: 103.8198, iso2: "SG" },\n  { country: "Slovakia", code: "+421", flag: "🇸🇰", lat: 48.669, lng: 19.699, iso2: "SK" },\n  { country: "Slovenia", code: "+386", flag: "🇸🇮", lat: 46.1512, lng: 14.9955, iso2: "SI" },\n  { country: "Solomon Islands", code: "+677", flag: "🇸🇧", lat: -9.6457, lng: 160.1562, iso2: "SB" },\n  { country: "Somalia", code: "+252", flag: "🇸🇴", lat: 5.1521, lng: 46.1996, iso2: "SO" },\n  { country: "South Africa", code: "+27", flag: "🇿🇦", lat: -30.5595, lng: 22.9375, iso2: "ZA" },\n  { country: "South Korea", code: "+82", flag: "🇰🇷", lat: 35.9078, lng: 127.7692, iso2: "KR" },\n  { country: "South Sudan", code: "+211", flag: "🇸🇸", lat: 6.877, lng: 31.307, iso2: "SS" },\n  { country: "Spain", code: "+34", flag: "🇪🇸", lat: 40.4637, lng: -3.7492, iso2: "ES" },\n  { country: "Sri Lanka", code: "+94", flag: "🇱🇰", lat: 7.8731, lng: 80.7718, iso2: "LK" },\n  { country: "Sudan", code: "+249", flag: "🇸🇩", lat: 12.8628, lng: 30.2176, iso2: "SD" },\n  { country: "Suriname", code: "+597", flag: "🇸🇷", lat: 3.9193, lng: -56.0278, iso2: "SR" },\n  { country: "Sweden", code: "+46", flag: "🇸🇪", lat: 60.1282, lng: 18.6435, iso2: "SE" },\n  { country: "Switzerland", code: "+41", flag: "🇨🇭", lat: 46.8182, lng: 8.2275, iso2: "CH" },\n  { country: "Syria", code: "+963", flag: "🇸🇾", lat: 34.8021, lng: 38.9968, iso2: "SY" },\n  { country: "Taiwan", code: "+886", flag: "🇹🇼", lat: 23.6978, lng: 120.9605, iso2: "TW" },\n  { country: "Tajikistan", code: "+992", flag: "🇹🇯", lat: 38.861, lng: 71.2761, iso2: "TJ" },\n  { country: "Tanzania", code: "+255", flag: "🇹🇿", lat: -6.369, lng: 34.8888, iso2: "TZ" },\n  { country: "Thailand", code: "+66", flag: "🇹🇭", lat: 15.87, lng: 100.9925, iso2: "TH" },\n  { country: "Togo", code: "+228", flag: "🇹🇬", lat: 8.6195, lng: 0.8248, iso2: "TG" },\n  { country: "Tonga", code: "+676", flag: "🇹🇴", lat: -20.4298, lng: -174.989, iso2: "TO" },\n  { country: "Trinidad and Tobago", code: "+1868", flag: "🇹🇹", lat: 10.6918, lng: -61.2225, iso2: "TT" },\n  { country: "Tunisia", code: "+216", flag: "🇹🇳", lat: 33.8869, lng: 9.5375, iso2: "TN" },\n  { country: "Turkey", code: "+90", flag: "🇹🇷", lat: 38.9637, lng: 35.2433, iso2: "TR" },\n  { country: "Turkmenistan", code: "+993", flag: "🇹🇲", lat: 38.9697, lng: 59.5563, iso2: "TM" },\n  { country: "Tuvalu", code: "+688", flag: "🇹🇻", lat: -7.1095, lng: 177.6493, iso2: "TV" },\n  { country: "Uganda", code: "+256", flag: "🇺🇬", lat: 1.3733, lng: 32.2903, iso2: "UG" },\n  { country: "Ukraine", code: "+380", flag: "🇺🇦", lat: 48.3794, lng: 31.1656, iso2: "UA" },\n  { country: "United Arab Emirates", code: "+971", flag: "🇦🇪", lat: 23.4241, lng: 53.8478, iso2: "AE" },\n  { country: "United Kingdom", code: "+44", flag: "🇬🇧", lat: 55.3781, lng: -3.436, iso2: "GB" },\n  { country: "United States", code: "+1", flag: "🇺🇸", lat: 39.8283, lng: -98.5795, iso2: "US" },\n  { country: "Uruguay", code: "+598", flag: "🇺🇾", lat: -32.5228, lng: -55.7658, iso2: "UY" },\n  { country: "Uzbekistan", code: "+998", flag: "🇺🇿", lat: 41.3775, lng: 64.5853, iso2: "UZ" },\n  { country: "Vanuatu", code: "+678", flag: "🇻🇺", lat: -15.3768, lng: 166.9592, iso2: "VU" },\n  { country: "Vatican City", code: "+379", flag: "🇻🇦", lat: 41.9029, lng: 12.4534, iso2: "VA" },\n  { country: "Venezuela", code: "+58", flag: "🇻🇪", lat: 6.4238, lng: -66.5897, iso2: "VE" },\n  { country: "Vietnam", code: "+84", flag: "🇻🇳", lat: 14.0583, lng: 108.2772, iso2: "VN" },\n  { country: "Yemen", code: "+967", flag: "🇾🇪", lat: 15.5527, lng: 48.5164, iso2: "YE" },\n  { country: "Zambia", code: "+260", flag: "🇿🇲", lat: -13.1339, lng: 27.8493, iso2: "ZM" },\n  { country: "Zimbabwe", code: "+263", flag: "🇿🇼", lat: -19.0154, lng: 29.1549, iso2: "ZW" },\n].sort');
__turbopack_context__.k.register(_c1, "COUNTRY_DATA");
__turbopack_context__.k.register(_c2, "ProfilePage");
__turbopack_context__.k.register(_c3, "AddressModal");
__turbopack_context__.k.register(_c4, "CountryCombobox");
__turbopack_context__.k.register(_c5, "CountryCodeSelector");
__turbopack_context__.k.register(_c6, "AddressAutocomplete");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/profile.js [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/profile";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/src/pages/profile.js [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/src/pages/profile\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/profile.js [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ca8a239c._.js.map