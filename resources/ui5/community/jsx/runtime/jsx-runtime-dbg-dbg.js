sap.ui.define(["./runtime/installViewScopeBridge", "./runtime/runtime"], function (___runtime_installViewScopeBridge, ___runtime_runtime) {
  "use strict";

  /**
   * `ui5.community.jsx.runtime/jsx-runtime`. Babel automatic-runtime entry point.
   *
   * Babel emits
   *
   *   import { jsx as _jsx, jsxs as _jsxs } from "ui5/community/jsx/runtime/jsx-runtime";
   *
   * for every `.tsx` file in a consuming app whose Babel config sets
   * `importSource: "ui5/community/jsx/runtime"`. This module therefore *must*
   * exist at exactly this path; it is not a free choice.
   *
   * The actual implementation lives in the [runtime/](./runtime/) sub-namespace.
   * This barrel re-exports:
   *
   *  - {@link jsx}, {@link jsxs}, {@link Fragment}, used by the Babel transform
   *  - `<For>`, `<If>`, core structural directives (always available)
   *  - `withScope`, `defineSentinel`, plugin-SPI types, the plugin contract
   *  - `JSX` namespace, used by the TypeScript JSX checker
   *
   * ## Top-level side effects
   *
   * Importing this module installs the JSX/View prototype bridge (see
   * [installViewScopeBridge.ts](./runtime/installViewScopeBridge.ts))
   * so `view.getAutoPrefixId()` behaves transparently, every view
   * whose `createContent()` returns JSX gets automatic id-prefixing
   * for the child controls, without wrapping every return in
   * `withScope({ view: this }, …)` at the call site.
   *
   * @namespace ui5.community.jsx.runtime
   */
  const installViewScopeBridge = ___runtime_installViewScopeBridge["installViewScopeBridge"]; // One-time side effect. Runs on first import, before any JSX view
  // can construct its content, because the JSX runtime is imported
  // transitively by the consumer's own `.tsx` files (and directly by
  // this barrel).
  installViewScopeBridge();

  // Type-only re-exports for plugin authors. Babel's transform strips these,
  // so they cost nothing at runtime.
  var __exports = {
    __esModule: true
  };
  __exports.jsx = ___runtime_runtime.jsx;
  __exports.jsxs = ___runtime_runtime.jsxs;
  __exports.Fragment = ___runtime_runtime.Fragment;
  __exports.For = ___runtime_runtime.For;
  __exports.If = ___runtime_runtime.If;
  __exports.withScope = ___runtime_runtime.withScope;
  __exports.currentScope = ___runtime_runtime.currentScope;
  __exports.currentRenderer = ___runtime_runtime.currentRenderer;
  __exports.currentIntrinsics = ___runtime_runtime.currentIntrinsics;
  __exports.currentPropertyAppliers = ___runtime_runtime.currentPropertyAppliers;
  __exports.currentChildrenProcessors = ___runtime_runtime.currentChildrenProcessors;
  __exports.currentHtmlIntrinsic = ___runtime_runtime.currentHtmlIntrinsic;
  __exports.defineSentinel = ___runtime_runtime.defineSentinel;
  __exports.isSentinelNode = ___runtime_runtime.isSentinelNode;
  __exports.defaultRenderer = ___runtime_runtime.defaultRenderer;
  return __exports;
});
//# sourceMappingURL=jsx-runtime-dbg-dbg.js.map
