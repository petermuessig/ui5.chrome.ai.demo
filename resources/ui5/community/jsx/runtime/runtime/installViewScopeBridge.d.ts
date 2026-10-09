declare module "ui5/community/jsx/runtime/runtime/installViewScopeBridge" {
    /**
     * # `installViewScopeBridge`, transparent JSX / View integration
     *
     * When a JSX view is constructed, UI5 calls its `createContent()`
     * method. That method returns JSX, which in turn calls our
     * `jsx()` factory for every control it constructs. For features
     * like automatic id-prefixing (`view.getAutoPrefixId() === true`
     * → wrap every child id in `view.createId(id)`), the runtime
     * needs to know **which view is currently being constructed**
     * during those `jsx()` calls.
     *
     * The clean way to expose that context is to wrap the
     * subclass's `createContent()` in a `withScope({ view: this },
     * …)`. This module installs a one-time prototype patch on
     * `View.prototype.onControllerConnected` that does exactly that:
     * before delegating to the original `onControllerConnected`, it
     * installs a per-instance wrapper on `this.createContent` that
     * opens the scope and catches errors, then cleans up via `finally`.
     *
     * ## Why patch `onControllerConnected`, not `createContent`
     *
     * UI5's `onControllerConnected` calls `this.createContent(e)`,
     * which dynamically dispatches to the **subclass** prototype
     * (e.g. `MyJsxView.prototype.createContent`). Patching
     * `View.prototype.createContent` only intercepts code that
     * explicitly calls `super.createContent()` — no View subclass
     * ever does that (the base method is a no-op returning `null`).
     *
     * By patching `onControllerConnected` instead, we install a
     * per-instance own-property on `this.createContent` *before*
     * the original `onControllerConnected` body runs. Own-properties
     * shadow prototype properties, so `this.createContent(...)` in
     * `runWithPreprocessors` routes through our wrapper regardless
     * of which subclass is in play.
     *
     * XMLView / JSONView / TypedView override `createContent()` and
     * don't call `jsx()`, so the added `withScope` is a no-op for
     * them. Error-logging is equally transparent — only JSX views
     * are likely to throw novel errors, and the log entry will
     * clearly identify the view by id.
     *
     * ## The idempotence guard
     *
     * `installed` prevents double-wrapping if this module is loaded
     * twice (e.g. via two different resource-root mappings, or from
     * a test harness that reloads the runtime).
     *
     * @namespace ui5.community.jsx.runtime.jsx-runtime
     */
    const COMPONENT = "ui5.community.jsx.runtime";
    let installed: boolean;
    /**
     * Install the prototype patch. Call once from the runtime's entry
     * module top level so the bridge lands before any view
     * instantiates. Safe to call multiple times, subsequent calls
     * are no-ops.
     */
    export function installViewScopeBridge(): void;
}
//# sourceMappingURL=installViewScopeBridge.d.ts.map