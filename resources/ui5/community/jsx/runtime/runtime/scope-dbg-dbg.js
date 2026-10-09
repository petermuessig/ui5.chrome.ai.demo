sap.ui.define([], function () {
  "use strict";

  /**
   * `Scope`, the explicit, stack-saved context described in
   * [docs/jsx-runtime.md](../../../../docs/jsx-runtime.md) and
   * [docs/requirements.md §3](../../../../docs/requirements.md) (architectural
   * invariants, in particular the "no invisible ambient state" rule).
   *
   * It groups together every cross-cut a plugin might want to inject:
   * the active output `renderer`, intrinsic-attribute handlers, special
   * property appliers, structural directive processors, plus any
   * extension slot a future plugin defines.
   *
   * Two non-obvious choices, both deliberate:
   *
   *  - **No invisible defaults.** A `Scope` value with `renderer === undefined`
   *    means "use the default control-instance renderer registered at module
   *    load time." Plugins that want a different renderer have to pass it in
   *    explicitly via `withScope`. The "no invisible ambient state"
   *    invariant wins over a tidier inheritance chain.
   *
   *  - **Synchronous-only.** `withScope` saves the previous scope on entry
   *    and restores it on `fn`'s synchronous return. An `await` inside the
   *    callback would silently leak a scope across an async boundary on
   *    runtimes without `AsyncLocalStorage`. The chosen resolution is to
   *    keep the core synchronous and let plugins that need
   *    `AsyncLocalStorage` (e.g. an XML output adapter) wrap the `Scope`
   *    in their own `withAsyncScope` helper, opting *in* to the runtime
   *    cost rather than imposing it on every consumer.
   *
   * @namespace ui5.community.jsx.runtime.jsx-runtime
   */

  /**
   * The owner-control slot is a frequent enough plugin extension that we
   * type it explicitly even though the runtime itself doesn't read it.
   * Plugins that need it should narrow `Scope` like
   * `(currentScope() as Scope & ScopeWithOwner)`.
   */

  // --- Stack -----------------------------------------------------------------

  /**
   * The active scope stack. The bottom of the stack is the *default scope*,
   * populated by the runtime at module load with the default renderer
   * and the core's built-in intrinsics / processors. Calls to `withScope`
   * push a merged copy on top; `fn`'s synchronous return pops it back off.
   *
   * Module-scoped mutable state is the one AP-1 carve-out. The roadmap
   * (§3.2) acknowledges this: the alternative, threading scope through
   * every nested `jsx()` call, is the explicit-context approach the
   * personas rejected as ergonomically worse than a careful stack.
   *
   * The stack itself is never exposed; only `currentScope` (read) and
   * `withScope` (push/pop) are public.
   */
  const stack = [{}];

  /**
   * The default scope's writable handle, used by the runtime's module
   * loader to install the built-in `Renderer`, the `class` and `binding`
   * intrinsic handlers, and the `<Fragment>` / `<For>` / `<If>` children
   * processors. Plugins MUST NOT touch this; they go through `withScope`
   * instead so the user can see (and reverse) the change at the call site.
   */
  function _defaultScopeForRuntimeInit() {
    return stack[0];
  }

  /**
   * The active scope, merged from the bottom up.
   *
   * Returns the topmost frame. `withScope` already merged it on entry;
   * we don't re-merge here, both for speed and so a plugin that *unsets*
   * a slot (`renderer: undefined`) wins over the default.
   */
  function currentScope() {
    return stack[stack.length - 1];
  }

  /**
   * Resolve the active renderer. The default scope always carries one,
   * so this is non-null in practice; the `??` keeps TypeScript happy
   * and gives us a clear error if a plugin ever installs an empty default.
   */
  function currentRenderer() {
    const scope = currentScope();
    if (!scope.renderer) {
      throw new Error("ui5/community/jsx/runtime jsx-runtime: no active Renderer. Did the default scope " + "fail to initialise? Re-import 'jsx-runtime/runtime' to bootstrap.");
    }
    return scope.renderer;
  }

  /**
   * Resolve the active HTML intrinsic handler, or `undefined` if none is
   * registered. The default scope deliberately registers none, `<div>` /
   * `<svg>` / `<my-tag>` are not valid in the live control-instance mode.
   * The runtime's `jsx()` calls this and produces a clear error when a
   * string-typed JSX expression is encountered without a handler.
   */
  function currentHtmlIntrinsic() {
    return currentScope().htmlIntrinsic;
  }

  /**
   * The intrinsic handlers visible at this point in the construction.
   * Returns the *registered* list, order matches registration order.
   *
   * Plugins layer on top of the core handlers by spreading them in the
   * scope: `withScope({ intrinsics: [...currentScope().intrinsics ?? [], myHandler] }, fn)`.
   * The matcher loop in `runtime.ts` walks first-match-wins, so a plugin
   * that pushes onto the *front* claims a prop ahead of the core; a
   * plugin that appends defers to the core when both match.
   */
  function currentIntrinsics() {
    return currentScope().intrinsics ?? [];
  }

  /**
   * The post-construction property appliers visible at this point.
   * Same first-match-wins ordering as `currentIntrinsics`.
   */
  function currentPropertyAppliers() {
    return currentScope().propertyAppliers ?? [];
  }

  /**
   * The structural-directive processors visible at this point.
   * Identity-matched against sentinel nodes inside `processChildren`.
   */
  function currentChildrenProcessors() {
    return currentScope().childrenProcessors ?? [];
  }

  /**
   * Run `fn` with `partial` merged on top of the current scope. Restores
   * the previous scope on `fn`'s synchronous return *and on exception*
   * (the `try/finally`).
   *
   * Why merge rather than overwrite: a plugin commonly wants to add an
   * intrinsic handler without throwing away the core's `class` /
   * `binding` defaults. We merge slot-by-slot, list-typed slots
   * concatenate (caller-provided handlers come *first*, so they get
   * first dibs at matching), object-typed slots `{...}`-merge (plugin
   * extensions land alongside `formatterContext`/`ownerControl`).
   *
   * The legacy `withContext` in `sap.fe.base/jsx-runtime` reset the
   * scope to `{}` on exit instead of restoring the previous frame.
   * The function name change to `withScope` is deliberate: old call
   * sites cannot accidentally call this with the old expectations.
   *
   * `withScope` is **synchronous only** — see the "withScope is
   * synchronous only" entry in [docs/gotchas.md](../../../../docs/gotchas.md).
   * An `await` inside `fn` silently leaks scope on runtimes without
   * `AsyncLocalStorage`.
   *
   * @example
   * import { withScope } from "ui5/community/jsx/runtime/jsx-runtime";
   * import { switchProcessor } from "ui5/community/jsx/runtime/plugins/switch/index";
   *
   * return withScope({ childrenProcessors: [switchProcessor] }, () => (
   *   <Switch on={{ path: "/kind" }}>
   *     <Case when="info">    <Text text="ℹ️ info" />    </Case>
   *     <Case when="warning"> <Text text="⚠️ warning" /> </Case>
   *     <Default>             <Text text="(none)" />     </Default>
   *   </Switch>
   * ));
   */
  function withScope(partial, fn) {
    const parent = currentScope();
    const merged = mergeScopes(parent, partial);
    stack.push(merged);
    try {
      return fn();
    } finally {
      stack.pop();
    }
  }

  /**
   * Slots merged by list-concatenation (caller's entries first, so a
   * plugin outranks the core defaults at match time). Every other
   * slot on `Scope` uses the default `{...}`-merge behaviour from
   * `Object.assign` above.
   *
   * Kept as a top-level constant so `mergeScopes` reads as a table of
   * behaviours rather than a chain of if-branches; also makes adding a
   * new list-typed slot to `Scope` a one-line change.
   */
  const LIST_SLOTS = ["intrinsics", "propertyAppliers", "childrenProcessors"];

  /**
   * Merge `partial` on top of `parent`. List-typed slots
   * (see `LIST_SLOTS`) concatenate with the caller's entries first;
   * everything else takes the shallow `{...}` merge.
   */
  function mergeScopes(parent, partial) {
    const merged = {
      ...parent,
      ...partial
    };
    for (const slot of LIST_SLOTS) {
      const p = partial[slot];
      if (p !== undefined) {
        const inherited = parent[slot] ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        merged[slot] = [...p, ...inherited];
      }
    }
    return merged;
  }
  var __exports = {
    __esModule: true
  };
  __exports._defaultScopeForRuntimeInit = _defaultScopeForRuntimeInit;
  __exports.currentScope = currentScope;
  __exports.currentRenderer = currentRenderer;
  __exports.currentHtmlIntrinsic = currentHtmlIntrinsic;
  __exports.currentIntrinsics = currentIntrinsics;
  __exports.currentPropertyAppliers = currentPropertyAppliers;
  __exports.currentChildrenProcessors = currentChildrenProcessors;
  __exports.withScope = withScope;
  return __exports;
});
//# sourceMappingURL=scope-dbg-dbg.js.map
