declare module "ui5/community/jsx/runtime/runtime/runtime" {
    import ManagedObject from "sap/ui/base/ManagedObject";
    import type Element from "sap/ui/core/Element";
    import type Event from "sap/ui/base/Event";
    import type { ChildrenProcessor, ControlClass, ControlMetadata, IntrinsicHandler } from "./plugin";
    /**
     * Minimal JSX runtime for UI5 controls, the actual `jsx`/`jsxs`/`Fragment`
     * implementation. The package's *entry point* (`webapp/jsx-runtime.ts`) is a
     * thin barrel that re-exports from this file; Babel's automatic JSX transform
     * imports from the barrel and never reaches in here directly.
     *
     * ## How Babel wires this up
     *
     * `babel.config.json` configures `@babel/plugin-transform-react-jsx` with
     * `runtime: "automatic"` and `importSource: "ui5/community/jsx/runtime"`. So
     *
     *   ```tsx
     *   <Page>
     *     <Button press=".onPress" />
     *   </Page>
     *   ```
     *
     * compiles to
     *
     *   ```js
     *   import { jsx as _jsx, jsxs as _jsxs } from "ui5/community/jsx/runtime/jsx-runtime";
     *   _jsx(Page, { children: _jsx(Button, { press: ".onPress" }) });
     *   ```
     *
     * The `tsconfig.json` `paths` mapping resolves `ui5/community/jsx/runtime/jsx-runtime` →
     * `webapp/jsx-runtime.ts` (the barrel) for the type-checker. At runtime, UI5's
     * AMD loader resolves the same path under the `ui5/community/jsx/runtime` namespace.
     *
     * ## How the plugin SPI is wired
     *
     * `jsx()` is a thin shell. It dispatches sentinel directives to
     * registered `ChildrenProcessor`s, runs the prop loop through registered
     * `IntrinsicHandler`s, hands the resolved settings to the active
     * `Renderer.construct(...)`, and lets registered `PropertyApplier`s
     * post-process. Every "what to do with X" decision lives in a plugin,
     * including the core's own `<Fragment>`, `<For>`, `<If>`, `class=`,
     * and `binding="{/...}"`. See [plugin.ts](./plugin.ts) for the
     * extension-point types and [scope.ts](./scope.ts) for `withScope`.
     *
     * Apps that don't import any plugin pay zero ergonomic cost: this
     * file initialises the default scope at module load with the core
     * processors and intrinsics, and `currentRenderer()` returns the
     * default control-instance renderer.
     *
     * ## Children → default aggregation
     *
     * JSX children land on `props.children` (single child or array). They are
     * appended to the control's *default aggregation*, looked up via
     * `ControlMetadata.getDefaultAggregationName()`. Named aggregations are
     * expressed as regular props (e.g. `additionalContent={[...]}`).
     *
     * ## Bound aggregations + JSX template
     *
     * If a prop already populated the default aggregation with a BindingInfo
     * (typically `items={listRef}` from the OData/JSON helpers), we don't clobber
     * the binding with the JSX child. Instead, the child becomes the binding's
     * `template` (the row factory). UI5's `GrowingEnablement` then clones it for
     * each row.
     *
     * @namespace ui5.community.jsx.runtime.jsx-runtime
     */
    /** Anything that exposes `getController()`, i.e. an `sap.ui.core.mvc.View`. */
    /**
     * The shape the runtime uses when it resolves a dot-handler string
     * or wires a function-typed event handler: a bag of named handler
     * methods. Typically a UI5 `Controller`, but we don't constrain it:
     * a JSXView returning `this` from `getController()` fits, and so
     * does any object with named methods installed via `withScope`.
     */
    type ControllerLike = Record<string, unknown>;
    /**
     * Resolve the pinned controller from the active scope, if any. Set via
     * `withScope({ controller }, fn)`, see `scope.ts` for the intended use
     * (fragment factories, tests, and any JSX built off-tree that needs
     * event handlers to resolve to a specific controller instance).
     */
    function pinnedController(): ControllerLike | undefined;
    /**
     * Walk up the element ancestry from `start`, returning the first
     * `sap.ui.core.mvc.View`'s controller. Used to resolve `".onPress"`-style
     * handler strings against the surrounding view, matching XMLView's
     * `EventHandlerResolver` behaviour (which always resolves against
     * `oView._oContainingView.oController`).
     *
     * We stop at the first `View` ancestor, earlier iterations of this
     * function stopped at any object exposing `getController()`, which
     * worked in practice but was less predictable. Narrowing to `View`
     * matches what XMLView does and eliminates the (theoretical) case
     * where a non-View control happens to expose the same method.
     *
     * Returns `undefined` if the control hasn't been added to a view yet
     * (e.g. during the initial `createContent()` synchronous
     * construction). In that case `makeHandler` will have already returned
     * a function that performs the same walk on event-fire, by which
     * point the tree is wired up. Callers should consult
     * `pinnedController()` first if they want the XMLView-parity
     * "captured-at-construction" behaviour.
     */
    function findController(start: Element): ControllerLike | undefined;
    /**
     * Build the actual event-handler function we hand to UI5 for a
     * `".dotHandler"` string.
     *
     * Resolution order at fire time:
     *
     *   1. `currentScope().controller` (captured at *JSX-construction*
     *      time via `withScope({ controller }, …)`) if any, the
     *      XMLView-parity path for fragment factories and off-tree
     *      constructions.
     *   2. Otherwise, walk the parent ancestry to find the surrounding
     *      view's controller. This is the default path and handles the
     *      99% case: JSX built inside `createContent()` is added to the
     *      view before any event fires, so the walk always finds the
     *      view's controller.
     *
     * We can't just capture the controller at JSX-construction time in
     * the default case because there *is* no parent chain yet, the
     * control isn't in any tree. The pin escape hatch exists for authors
     * who need "capture now" semantics anyway (e.g. dialogs opened from
     * a shared controller that mount under different views).
     */
    function makeHandler(handlerName: string): (this: Element, event: Event) => void;
    /**
     * The runtime entry called for every JSX element.
     *
     * `type` is the control class (e.g. `Button`); `props` is the merged set of
     * attributes plus a `children` field for nested JSX. We translate this into
     * a `currentRenderer().construct(type, settings)` call. UI5 takes care of
     * the rest (binding extraction, aggregation wiring, applying defaults) under
     * the default control-instance renderer.
     *
     * Babel may pass an extra `key` argument for keyed lists. When the target
     * control declares a property named `key` (e.g. `sap.ui.core.CustomData`),
     * the value is forwarded to that property. Otherwise it is ignored — UI5 has
     * no concept of React-style list reconciliation keys.
     *
     * @example
     * // Consumers never call jsx() directly; Babel's automatic runtime
     * // rewrites <Button text="Hi" /> into _jsx(Button, { text: "Hi" }),
     * // which the runtime turns into `new Button({ text: "Hi" })`.
     * import Button from "sap/m/Button";
     * const btn = <Button text="Hi" press={() => console.log("pressed")} />;
     */
    export function jsx<T extends ManagedObject>(type: ControlClass<T> | typeof Fragment | typeof For | typeof If | SentinelTag<any> | string, props: (Record<string, unknown> & {
        children?: unknown;
    }) | null, _key?: string): T;
    /**
     * Walk the registered intrinsics and return the first one that claims
     * `(propName, value)`. The match decision can depend on the target
     * metadata (e.g. the dot-handler matcher only fires on event props).
     */
    function matchIntrinsic(intrinsics: readonly IntrinsicHandler[], propName: string, value: unknown, metadata: ControlMetadata): IntrinsicHandler | undefined;
    /**
     * Babel uses `jsxs` for elements with multiple static children. Our
     * implementation handles single and multiple children identically, so this is
     * just an alias.
     */
    export const jsxs: typeof jsx;
    /**
     * The brand symbol every plugin sentinel carries. The runtime checks
     * `tag[SENTINEL_TAG] === true` (strict-true) to decide whether to
     * route a `jsx(tag, props)` call through the sentinel/processor path.
     *
     * Exported for plugin authors via `defineSentinel`. Apps don't import
     * the symbol directly.
     */
    export const SENTINEL_TAG: any;
    /**
     * The shape every plugin sentinel must satisfy: a function-type "type"
     * (so JSX accepts it) carrying the `SENTINEL_TAG` brand.
     *
     * The phantom call signature `(props: P) => never` is what TypeScript's
     * JSX checker reads when it builds `LibraryManagedAttributes` for the
     * sentinel, the `SettingsOf` helper picks up the call's parameter
     * type and uses it as the prop schema. So a plugin author who writes
     * `defineSentinel<{ on: unknown; children?: unknown }>("Switch")` gets
     * `<Switch on={...}>...</Switch>` typed correctly. The body never runs;
     * `jsx()` short-circuits on the brand.
     */
    export type SentinelTag<P = Record<string, unknown>> = ((props: P) => never) & {
        /** Display name for error messages. */
        displayName: string;
    };
    function isSentinelTag(value: unknown): value is SentinelTag;
    /**
     * Helper for plugin authors. Builds a `SentinelTag<P>` whose call body
     * throws (sentinels are never invoked, `jsx()` short-circuits on the
     * brand) and whose `displayName` is used in errors. The generic `P`
     * propagates through `LibraryManagedAttributes` for typed JSX usage.
     *
     * The `<P>` generic is load-bearing. Dropping it makes TS fall back to
     * `any` and prop typos stop being caught, see the "defineSentinel<P>
     * needs its generic" entry in [docs/gotchas.md](../../../../docs/gotchas.md).
     *
     * @example
     * export const Switch = defineSentinel<{
     *   on: unknown;
     *   children?: unknown;
     * }>("Switch");
     * // now <Switch on={...}>...</Switch> typechecks and rejects prop typos
     */
    export function defineSentinel<P = Record<string, unknown>>(name: string): SentinelTag<P>;
    /**
     * The marker node a plugin sentinel produces when invoked via
     * `jsx(tag, props)`. The plugin's `ChildrenProcessor` recognises it
     * by `tag` identity (`node.tag === Switch`) and processes it.
     *
     * Exposed in this file so `processChildren` can build it generically.
     */
    export interface SentinelNode {
        __ui5JsxSentinel: true;
        tag: SentinelTag<any>;
        props: Record<string, unknown>;
    }
    function makeSentinelNode(tag: SentinelTag<any>, props: (Record<string, unknown> & {
        children?: unknown;
    }) | null): SentinelNode;
    export function isSentinelNode(value: unknown): value is SentinelNode;
    /**
     * Check whether `value` is an object carrying the well-known
     * marker `brand: true`. Shared by every sentinel-node predicate
     * (`isSentinelNode`, `isFragmentNode`, `isForNode`, `isIfNode`)
     * so the null-check + type-cast dance lives in one place.
     */
    function hasBrand<K extends string>(value: unknown, brand: K): value is Record<K, true> & Record<string, unknown>;
    /**
     * Sentinel value used as the `type` argument when Babel compiles `<>...</>`.
     *
     * Babel's automatic runtime emits roughly
     *
     *   _jsx(Fragment, { children: [<A/>, <B/>] })
     *
     * for a fragment. We detect that call shape inside `jsx()` and short-circuit
     * to a `FragmentNode` marker that the `FragmentProcessor` (registered in the
     * default scope) inlines into the surrounding parent's aggregation.
     *
     * It is exported as a plain object (not a Symbol) so the runtime check
     * `type === Fragment` works after module re-export and JSON-style copy paths.
     */
    export const Fragment: {
        readonly __ui5JsxFragment: true;
    };
    /**
     * The intermediate node returned by `jsx(Fragment, ...)`. It is *not* a UI5
     * control, it never reaches a UI5 aggregation. The FragmentProcessor
     * recognises it and inlines its children into the parent.
     */
    type FragmentNode = {
        __ui5JsxFragment: true;
        children: unknown;
    };
    function makeFragmentNode(props: (Record<string, unknown> & {
        children?: unknown;
    }) | null): FragmentNode;
    function isFragmentNode(value: unknown): value is FragmentNode;
    /**
     * `<For each={listRef}>{() => <Row/>}</For>`, sugar over the
     * "bound-aggregation child becomes binding template" mechanism (FR-CON-04).
     *
     * The runtime detects `For` by identity inside `jsx()` and produces a
     * `ForNode` marker. The core's `ForProcessor` then installs `each` (a
     * `ListBindingRef` / `BindingInfo`) into the targeted aggregation and
     * uses the render-prop's return value as the row template.
     *
     * The render-prop receives a placeholder argument by convention; UI5
     * binding contexts already drive per-row property resolution at runtime
     * (via relative paths / `o.rel(...)`), so the argument is unused.
     *
     *   <Table columns={[<Column><Label text="Name"/></Column>]}>
     *     <For each={o.list("/Products")}>{() =>
     *       <ColumnListItem><Text text={o.rel("ProductName")}/></ColumnListItem>
     *     }</For>
     *   </Table>
     *
     * By default the binding is installed into the parent's *default*
     * aggregation (e.g. `Table.items`). Pass `aggregation="cells"` to target
     * a different one.
     *
     * @example
     * // Explicit form, render-prop returns the row template.
     * <List>
     *   <For each={{ path: "/items" }}>{() =>
     *     <StandardListItem title="{label}" description="ID: {id}" />
     *   }</For>
     * </List>
     */
    export function For(_props: {
        each: unknown;
        aggregation?: string;
        children: (item: unknown) => unknown;
    }): never;
    type ForNode = {
        __ui5JsxFor: true;
        each: unknown;
        aggregation: string | undefined;
        children: unknown;
    };
    function makeForNode(props: (Record<string, unknown> & {
        children?: unknown;
    }) | null): ForNode;
    function isForNode(value: unknown): value is ForNode;
    /**
     * `<If condition={cond}>...</If>`. JSX-native conditional rendering.
     *
     * Two cases handled by the core's `IfProcessor`:
     *
     *  - **Literal condition** (a plain `true`/`false`): include the children
     *    in the parent's aggregation, or omit them, at construction time.
     *
     *  - **Bound condition** (a `BindingValue` or BindingInfo-shaped object):
     *    bind `visible` on each child directly via the `Control.bindProperty`
     *    primitive every UI5 control inherits from `ManagedObject`. UI5's
     *    standard binding-driven rerender handles show/hide.
     *
     * If a child already binds (or hard-pins) its own `visible`, `<If>`
     * throws rather than silently overriding the inner intent. Combine the
     * conditions in an expression binding instead, or wrap the group in
     * your own layout.
     *
     * @example
     * // Literal — decided at construction time, no wrapper control.
     * <If condition={featureFlag}>
     *   <Title text="Behind a flag" level="H4" />
     * </If>
     *
     * // Bound — visible flips as the model changes.
     * <If condition={{ path: "/showDetails" }}>
     *   <Text text="Reactive detail block." />
     * </If>
     */
    export function If(_props: {
        condition: unknown;
        children?: unknown;
    }): never;
    type IfNode = {
        __ui5JsxIf: true;
        condition: unknown;
        children: unknown;
    };
    function makeIfNode(props: (Record<string, unknown> & {
        children?: unknown;
    }) | null): IfNode;
    function isIfNode(value: unknown): value is IfNode;
    /**
     * A `BindingInfo`-shaped value carries a `path` field. Both UI5 and our
     * own `BindingValue` proxy use this signal. Typed as a type-guard so
     * callers get `path: unknown` narrowing (and the sibling `template`
     * slot the runtime's default-aggregation logic touches) without a
     * second cast.
     */
    function isBindingLike(value: unknown): value is Record<string, unknown> & {
        path: unknown;
        template?: unknown;
    };
    /**
     * If `value` is a binding *string* (e.g. `"{/path}"`, `"{model>path}"`,
     * `"{= ${a} > 5 }"`), parse it into a binding-info object so the
     * object-only `isBindingLike` gate accepts it. A plain literal string,
     * a string without `{`, or a malformed binding (where `complexParser`
     * throws) is returned unchanged — same contract as the string-aggregation
     * fix (commit 28f2e36).
     */
    function coerceBindingString(value: unknown): unknown;
    /**
     * Walk `children` once, dispatching each child to the registered
     * `ChildrenProcessor` whose `matches` claims it. Any child that no
     * processor claims is forwarded to the leftover-list, where the default
     * aggregation logic will pick it up.
     *
     * The processors operate on a *flat* view of the children, fragments
     * are recursively unwrapped by `flattenSentinelLevel` first so a
     * processor sees `<For>` even if it was the lone child of a `<Fragment>`.
     */
    function processChildren(children: unknown, settings: Record<string, unknown>, defaultAggregation: string): unknown;
    /**
     * Return the child list a node should be *expanded into*, or
     * `undefined` if it should be kept as-is. Shared by
     * `flattenSentinelLevel` and `flattenChildren` for the two universal
     * expansions (arrays produced by Babel from JSX map/spread; fragment
     * marker nodes). `flattenChildren` layers its `<If>` inlining on top
     * of this after checking here first.
     */
    function expandChild(node: unknown): unknown[] | undefined;
    /**
     * Flatten one level of fragments / arrays so structural-directive sentinels
     * (e.g. a `<For>` wrapped in `<>`) reach `processChildren` directly. Falsy
     * filtering happens later in `flattenChildren`, keeping the two passes
     * separate means a `null` produced by `{flag && <X/>}` doesn't accidentally
     * eat the surrounding `<For>`.
     */
    function flattenSentinelLevel(children: unknown): unknown[];
    /**
     * Walk a children value (single child, array, or fragment) and return a flat
     * array of real UI5 controls. Filters out falsy entries (`null`, `undefined`,
     * `false`, `""`) so `{flag && <X/>}` works the way every JSX-trained
     * developer expects, and recursively unwraps `<>...</>` fragments so they
     * never escape into a real aggregation.
     */
    function flattenChildren(children: unknown): unknown[];
    /**
     * For literal `<If condition={true|false}>...</If>` reached during
     * `flattenChildren`. A `true` condition inlines the children; `false`
     * (and any other falsy literal) drops them.
     */
    function resolveLiteralIf(node: IfNode): unknown;
    /**
     * `class="..."` → `addStyleClass(...)` post-construction.
     *
     * UI5's `applySettings` doesn't itself recognise `class` (it's not on
     * `$ControlSettings`), but the framework's settings parser routes it
     * through `addStyleClass` historically, and apps depend on it. We
     * codify that as the first explicit intrinsic of the core SPI.
     *
     * Returning `undefined` removes the prop from `settings` so UI5 doesn't
     * see an unknown key.
     */
    const classIntrinsic: IntrinsicHandler;
    /**
     * Dot-handler intrinsic: resolve `".onTap"`-style event strings
     * against the surrounding view's controller.
     *
     * Only strings that **start with a dot** are claimed. Bare
     * (`"onTap"`) and dotted (`"some.path.fn"`) forms flow through to
     * UI5 untouched. UI5 will either treat them as literal values or
     * reject them, which is what we want. XMLView-parity for global /
     * bare-name handlers was reverted after the concept-review meeting
     * (July 2026); TSX imports handle module-level function references
     * at the JSX call site, so the runtime doesn't need a `window`
     * lookup.
     *
     * The matcher's identifier-path shape check also guards against
     * odd text-shaped event props (`press="Push button"` etc.), the
     * leading-dot requirement plus valid identifier characters means a
     * non-handler string can't accidentally claim.
     */
    const HANDLER_STRING_RE: RegExp;
    const dotHandlerIntrinsic: IntrinsicHandler;
    /**
     * `binding="{/Foo}"` → `bindElement("/Foo")` (FR-INT-02).
     *
     * UI5 itself parses `{ ... }` strings inside settings, so we accept both
     * the binding-string form and a pre-built BindingInfo object. The
     * applicable `bindElement` method exists on every `Element` (i.e. every
     * Control); using it here keeps the runtime library-agnostic.
     */
    const bindingIntrinsic: IntrinsicHandler;
    /**
     * `ref={cb}` (FR-INT-03): a function prop that gets called with the
     * constructed instance. Mirrors React's callback-ref pattern. Useful
     * when an app needs a typed handle without a `byId` lookup.
     */
    const refIntrinsic: IntrinsicHandler;
    /**
     * Function-typed event handler intrinsic: `press={this.onTap}` without
     * the redundant `.bind(this)`.
     *
     * UI5's own event attach signature is `attachPress(fn, listener?)`, and
     * `applySettings` accepts `{ press: [fn, listener] }`, this is exactly
     * how XMLView's `EventHandlerResolver` passes the controller as the
     * listener context. We rewrite `press={fn}` into the same array shape
     * at JSX-time so `this` inside the handler resolves to the controller
     * without any authorial ceremony.
     *
     * Two resolution paths for the listener:
     *
     *   1. If `currentScope().controller` was pinned via
     *      `withScope({ controller }, …)`, emit `[fn, controller]`
     *      directly, no wrapper closure, no runtime cost on the hot path.
     *   2. Otherwise, emit a small wrapper closure that resolves the
     *      controller via the ancestor walk at fire time. Adds one
     *      function frame per event, but keeps `press={this.onTap}` working
     *      inside a plain `View.createContent()` with no `withScope`.
     *
     * Does **not** clobber a user's own `.bind(this)`: a bound function
     * inside `[fn, listener]` ignores the listener at fire time (bound
     * `this` wins over UI5's listener argument). So
     * `press={this.onTap.bind(this)}` and `press={this.onTap}` produce
     * identical behaviour under this intrinsic, one is just less noisy.
     *
     * Registered *after* `refIntrinsic` so `ref={cb}` (also a function
     * prop) claims first, but the two never collide because `ref` isn't
     * an event on any UI5 metadata.
     */
    const fnHandlerIntrinsic: IntrinsicHandler;
    /**
     * Property-type intrinsic: JSX-site error attribution.
     *
     * **Primary value: error message quality.** UI5's `ManagedObject.applySettings`
     * already coerces string prop values to their declared `DataType` (so
     * `"10"` → `10` for an `int`-typed property, `"false"` → `false` for a
     * `boolean`, and enum names are validated against their union). What UI5
     * does *not* do is name the *JSX site* when coercion or validation fails.
     * A typo like `<Button type="Empahsized" />` throws deep inside
     * `applySettings`, with a framework stack the app author has to unpack
     * to find their own file.
     *
     * This intrinsic runs the same `DataType.parseValue` / `DataType.isValid`
     * pipeline UI5 would run, but on the *JSX side of the boundary*, so the
     * `TypeError` it throws names the control class, the prop, the expected
     * type, and the offending value in one line. Example:
     *
     *   <Button type="Empahsized" />
     *   //  → TypeError: <sap.m.Button type={…}>: expected sap.m.ButtonType,
     *   //    got "Empahsized"
     *
     * **Secondary: eager coercion for post-hooks and other intrinsics.**
     * Because coercion happens *before* `applySettings`, any post-construct
     * hook or downstream intrinsic that reads `settings[propName]` sees the
     * coerced value (e.g. `10`, not `"10"`). Without this intrinsic, they'd
     * see the raw string and would have to re-coerce themselves.
     *
     * Where the type-checker is the *first* line of defence:
     * `@openui5/types` already narrows enum-shaped settings to the union
     * (e.g. `$ButtonSettings.type?: ButtonType | keyof typeof ButtonType`),
     * so a literal typo on a control class typed against the standard
     * settings interface fails at `tsc`. But three real cases slip past
     * the type-checker and land here:
     *
     *   - Values that originate as `any` (JSON config, untyped fetches).
     *   - Spread props (`<Button {...props} />`) that wash type info out.
     *   - The escape hatch where someone authored a prop value as a string
     *     literal because the type was wide and `@openui5/types` couldn't
     *     narrow further.
     *
     * **Scope: strings only.** The intrinsic only intervenes on plain
     * string values that don't look like binding expressions. Every other
     * shape, `BindingValue` objects, simple `{path}` and composite
     * `{parts, formatter}` BindingInfos, constant `{value, formatter}`
     * bindings, numbers, booleans, arrays, functions, flows through to
     * UI5's `applySettings`, which already validates them. Trying to
     * enumerate every UI5 BindingInfo shape here would be a long-running
     * footgun (composite bindings have no `.path`; constant bindings have
     * no `.path` either; an `extractBindingInfo` adapter could legitimately
     * accept new shapes in the future). The string-narrow contract avoids
     * that maintenance burden entirely.
     *
     * Strings that look like UI5 binding expressions are skipped too,
     * anything `BindingParser.complexParser(str)` recognises as a
     * binding-shaped result (an object) is left alone; only strings the
     * parser resolves to a plain literal (or that contain no `{` at all)
     * are considered candidates for coercion. That covers the obvious
     * cases (`"{path}"`, `"{= ${a} > 5 }"`, `"{i18n>key}"`) **and** the
     * composite forms with leading literal text (`"Hello {/firstname}"`,
     * `"Total: {= ${count} * 2 } EUR"`). An author who needs a *literal*
     * `{` in a non-binding string escapes it as `\{`, same convention
     * UI5 itself uses, and the parser handles it as a plain string, so
     * we agree with `applySettings` by construction.
     *
     * Delegating to `BindingParser` (the same primitive
     * `ManagedObject.extractBindingInfo` uses internally) removes the
     * last regex-vs-parser mismatch surface. A cheap `.includes("{")`
     * prescreen keeps the hot path free: 99% of prop strings contain no
     * `{` at all and never reach the parser. When there *is* a `{`, the
     * parser was going to run anyway inside `applySettings`, so we're
     * not adding measurable cost.
     *
     * Registered at the **end** of the default-scope intrinsic list, so
     * `class` / dot-handler / `binding` / `ref` claim their props first. A
     * plugin that wants a different validation policy can register a
     * handler at the front of the scope's intrinsic list and outrank this
     * one, first-match-wins precedence is the override mechanism.
     */
    /**
     * Format an about-to-be-reported offending value for the `TypeError`
     * message thrown by `propertyTypeIntrinsic`. UI5 metadata types include
     * `object` and array types, so a naive `String(value)` would produce the
     * useless `[object Object]` for those. We branch per JS type so the
     * receiver of `String(...)` is always a safe primitive; `JSON.stringify`
     * covers objects and arrays; `Object.prototype.toString.call` is the
     * fallback for values that stringify would reject (cycles etc.).
     */
    function formatOffending(value: unknown): string;
    const propertyTypeIntrinsic: IntrinsicHandler;
    /**
     * `<Fragment>`, recursively inlines its children into the parent.
     * `flattenSentinelLevel` already handled the surface unwrap; this
     * processor catches a fragment that arrived nested inside another
     * structural directive.
     */
    const fragmentProcessor: ChildrenProcessor;
    /**
     * `<For>`, installs `each` (a binding info / list ref) onto the parent's
     * targeted aggregation, with the render-prop's return value as the row
     * template. Defers to a user-provided template if the aggregation is
     * already bound and only the template is missing, same parity rule as
     * the original `processForChildren` logic (FR-CON-04).
     */
    const forProcessor: ChildrenProcessor;
    /**
     * `<If>`, two modes:
     *
     *   - literal (`condition` is `true`/`false` and not a binding): emit
     *     the children verbatim or drop them.
     *   - bound (`condition` is a BindingInfo): bind each child's `visible`
     *     property to the condition, then emit the children. No wrapper
     *     control, keeps the runtime library-agnostic.
     *
     * The throw-on-conflict rule (a child that already binds its own
     * `visible` is a hard error) is preserved verbatim from the previous
     * implementation; combining intentions silently is worse than failing
     * loud.
     */
    const ifProcessor: ChildrenProcessor;
    /**
     * The `JSX` namespace tells TypeScript what every JSX expression evaluates to
     * and how prop types are inferred.
     *
     * - `Element = Control`, `<Page>...</Page>` types as `Control`, which
     *   satisfies `createContent(): Control` without casts.
     *
     * - `LibraryManagedAttributes` is the per-element prop schema. UI5 control
     *   constructors are `(id?: string, settings?: $XSettings)`, we pull the
     *   `$XSettings` interface out of the constructor signature with
     *   `ConstructorParameters` and use it directly. The `$XSettings` interfaces
     *   are already shipped as part of `@openui5/types`, generated from each
     *   control's metadata, so we get per-control typing for properties, named
     *   aggregations, associations, and event payloads "for free", no codegen
     *   step in this repo.
     *
     *   Two JSX-specific extras are layered on top of the raw settings shape:
     *
     *     - Every event-shaped prop also accepts a `".dotHandler"`
     *       string, a leading-dot-prefixed identifier that the runtime
     *       resolves against the surrounding view's controller at
     *       fire-time. See `dotHandlerIntrinsic` for the resolution
     *       (FR-EVT-01). Bare-name and dotted-path lookups against
     *       `window` (XMLView's `EventHandlerResolver` also supports
     *       those) are intentionally out of scope. TSX imports handle
     *       module-level references at the JSX call site.
     *     - `class` (the standard HTML/JSX styling prop) is allowed as a
     *       string. UI5 itself doesn't expose it on `$ControlSettings`, but the
     *       framework's settings parser routes a `class` setting through
     *       `addStyleClass`, so it works at runtime and is widely used.
     *
     *   `id`, `key`, and `children` round out the JSX-mandatory set.
     */
    export namespace JSX {
        /**
         * Every JSX expression in this runtime is `any`.
         *
         * This may look surprising, we *do* want strong typing, and the
         * per-control `LibraryManagedAttributes` below is exactly that. The
         * narrow-element type is wrong for a different reason: a JSX expression
         * has to be assignable to *whatever named-aggregation slot it lands in*.
         * `<Card header={<Header/>}>` requires `<Header/>` to satisfy
         * `$CardSettings.header?: IHeader`; `<Table columns={[<Column/>]}>`
         * requires `<Column/>` to satisfy `Column[]`. A single concrete element
         * type (e.g. `Control`) cannot be a subtype of every aggregation slot
         * type at once.
         *
         * React solves this by typing `JSX.Element` as the opaque
         * `React.ReactElement` and never letting it touch a real DOM element
         * type, the boundary is between the JSX world and the React world.
         * UI5's "JSX" world *is* the control world (by design, every JSX call
         * is a `new Control(...)`), so we don't have a separate boundary to
         * exploit. `any` is the deliberate escape valve: prop validation
         * happens at the call site (against `$XSettings`), not at the slot
         * boundary. The runtime still produces real `Control` instances; the
         * implementation file declares its return types concretely; only the
         * JSX *expression* type is widened.
         *
         * This is the same trade-off `solid-js`'s JSX namespace makes
         * (`type Element = ... | JSX.HTMLElement`), a single broad type so
         * named-slot inference works.
         */
        type Element = any;
        interface ElementClass extends ManagedObject {
        }
        interface ElementAttributesProperty {
        }
        interface ElementChildrenAttribute {
            children: object;
        }
        /**
         * Common HTML / SVG attribute bag, deliberately permissive.
         *
         * String-typed JSX (`<div>`, `<svg>`, `<polyline>`) is the hook
         * point for a future HTML-aware RenderManager plugin. Outside that
         * plugin, the runtime throws a clear error at construction time,
         * see the `htmlIntrinsic` dispatch in `jsx()`.
         *
         * The typing here is intentionally minimal:
         *
         *  - The standard HTML attributes that *every* tag accepts
         *    (`id`, `class`, `style`, `title`, `data-*`, etc.) are typed.
         *  - `[attr: string]: unknown` covers the long tail (SVG-specific
         *    attributes, ARIA, custom-element props) without forcing us
         *    to mirror `lib.dom.d.ts`.
         *  - Event handlers are typed loosely as `(e: Event) => void`;
         *    the RM plugin's typed renderer can narrow them per-element
         *    via a more specific `IntrinsicElements` map if it wants.
         *
         * A future iteration can replace this with per-tag types pulled from
         * `lib.dom.d.ts` (the same approach `solid-js` and `preact` use).
         * For the sketch the permissive bag is enough to make
         * `<div class="x"><polyline points="..."/></div>` typecheck cleanly
         * without any cast.
         */
        interface HTMLAttributes {
            id?: string;
            class?: string;
            style?: string | Record<string, string | number>;
            title?: string;
            role?: string;
            tabIndex?: number;
            hidden?: boolean;
            children?: unknown;
            [attr: string]: any;
        }
        /**
         * `IntrinsicElements` is the type-checker's table of "what props
         * does each string-typed tag accept". A non-empty map makes
         * `<div>` legal in TSX; the value type defines the prop schema.
         *
         * The string-indexer entry is what actually matters here, it
         * makes *every* HTML/SVG/custom-element tag legal with the
         * permissive `HTMLAttributes` shape. The named entries are listed
         * for IDE-completion friendliness on the most common tags; they
         * resolve to the same shape.
         */
        interface IntrinsicElements {
            [tag: string]: HTMLAttributes;
            div: HTMLAttributes;
            span: HTMLAttributes;
            p: HTMLAttributes;
            a: HTMLAttributes;
            button: HTMLAttributes;
            input: HTMLAttributes;
            label: HTMLAttributes;
            ul: HTMLAttributes;
            ol: HTMLAttributes;
            li: HTMLAttributes;
            table: HTMLAttributes;
            tr: HTMLAttributes;
            td: HTMLAttributes;
            th: HTMLAttributes;
            svg: HTMLAttributes;
            g: HTMLAttributes;
            path: HTMLAttributes;
            rect: HTMLAttributes;
            circle: HTMLAttributes;
            line: HTMLAttributes;
            polyline: HTMLAttributes;
            polygon: HTMLAttributes;
            text: HTMLAttributes;
        }
        interface IntrinsicAttributes {
            id?: string;
            key?: string | number;
        }
        /**
         * Pull the `$XSettings` interface out of any UI5 control constructor.
         * UI5 declares two overloads, `(settings?)` and `(id?, settings?)`,
         * so we probe both. Plain function "directives" (`For`, `If`) declare
         * their props as the first parameter of an ordinary call signature; we
         * pick those up too. Unknown shapes fall back to an open record, which
         * preserves the pre-typing behaviour for non-UI5 components.
         */
        type SettingsOf<C> = C extends new (id: string | undefined, settings?: infer S) => unknown ? Exclude<S, undefined> : C extends new (settings?: infer S) => unknown ? Exclude<S, undefined> : C extends (props: infer P) => unknown ? P : Record<string, unknown>;
        /**
         * Widen each prop in `S`:
         *
         * - event-shaped props additionally accept a `".dotHandler"`
         *   string, a leading-dot-prefixed identifier that the runtime
         *   resolves against the surrounding view's controller at
         *   fire-time. See `dotHandlerIntrinsic` in
         *   [runtime.ts](../jsx-runtime/runtime.ts).
         *
         * The mapping preserves all other prop types, bindings, enums,
         * aggregations, associations, exactly as `$XSettings` declares them.
         */
        type WithJsxExtras<S> = {
            [K in keyof S]: S[K] extends ((...args: never[]) => unknown) | undefined ? S[K] | `.${string}` : S[K];
        };
        type LibraryManagedAttributes<C, _P> = WithJsxExtras<SettingsOf<C>> & {
            id?: string;
            key?: string | number;
            children?: unknown;
            class?: string;
            /**
             * Callback ref. Receives the constructed instance after the runtime
             * builds it. Mirrors React's callback-ref pattern; useful for
             * imperative one-shot setup (`ta.setValue(s)` for content that UI5's
             * settings parser would otherwise misread, focus management,
             * binding-info-bypassing string assignment).
             *
             * Implemented by the core `refIntrinsic` in this same module,
             * see `refIntrinsic` for the exact post-construct hook.
             */
            ref?: (instance: C extends new (...a: never[]) => infer I ? I : unknown) => void;
        };
    }
    export type { Renderer, IntrinsicHandler, IntrinsicMatchContext, ChildrenProcessor, PropertyApplier, ControlClass, ControlMetadata, PostConstructHook } from "./plugin";
    export { defaultRenderer } from "./plugin";
    export type { Scope } from "./scope";
    export { withScope, currentScope, currentRenderer, currentIntrinsics, currentPropertyAppliers, currentChildrenProcessors, currentHtmlIntrinsic } from "./scope";
}
//# sourceMappingURL=runtime.d.ts.map