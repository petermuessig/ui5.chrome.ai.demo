declare module "ui5/community/jsx/runtime/plugins/switch/index" {
    import { type ChildrenProcessor } from "../../runtime/runtime";
    /** `<Switch on={kind}>...</Switch>`. The `on` value is matched
     *  literally (===) against each `<Case when={...}>`, or used as a
     *  binding-info path to drive expression bindings on the children's
     *  `visible` property in bound mode. */
    export const Switch: any;
    /** `<Case when="info">...</Case>`. */
    export const Case: any;
    /** `<Default>...</Default>`, fallback branch. At most one per `<Switch>`. */
    export const Default: any;
    /**
     * The processor registered into the scope. Recognises a `<Switch>`
     * sentinel node and unfolds its `<Case>`/`<Default>` children into
     * the parent's aggregation.
     */
    export const switchProcessor: ChildrenProcessor;
    interface CaseBranch {
        when: unknown;
        children: unknown;
    }
    interface DefaultBranch {
        children: unknown;
    }
    interface Branches {
        cases: CaseBranch[];
        fallback: DefaultBranch | undefined;
    }
    /**
     * Walk the `<Switch>`'s direct children and partition them into Case /
     * Default lists. Anything that isn't one of those is a structural
     * mistake, we throw with a clear message rather than silently
     * dropping it, mirroring the `<If>`-on-pinned-visible rule from the
     * core runtime.
     */
    function collectBranches(children: unknown): Branches;
    function isBindingLike(value: unknown): boolean;
    /**
     * Literal mode: pick the first matching case at construction time.
     * Falls back to `<Default>` when no case matches; emits nothing if
     * neither match nor fallback are present.
     */
    function emitLiteral(on: unknown, branches: Branches, emit: (child: unknown) => void): void;
    /**
     * Bound mode: every branch's children are emitted with a `visible`
     * expression binding derived from the case's `when`. UI5's standard
     * binding-driven visibility toggles the branches.
     *
     * The expression-binding form `{= ${path} === '...' }` requires a
     * literal `when`. We refuse non-primitive `when` values, quoting
     * arbitrary objects in an expression binding is a footgun
     * (precedence, undefined coercion, JSON escapes). Combine the cases
     * differently if you need that.
     */
    function emitBound(on: {
        path: string;
        model?: string;
    }, branches: Branches, emit: (child: unknown) => void): void;
    /**
     * Render `path: "/kind", model: "vm"` as `${vm>/kind}` (or `${/kind}`
     * when no model is set). The expression-binding parser uses
     * `${...}` to interpolate model values; the leading `>` marks a
     * named-model lookup.
     */
    function formatPathRef(on: {
        path: string;
        model?: string;
    }): string;
    /**
     * Quote a primitive `when` for embedding in an expression binding.
     * Strings get single-quoted with `'` inside escaped to `\\'`; numbers
     * and booleans pass through.
     */
    function quoteLiteral(value: unknown): string;
    /**
     * Bind `visibleExpr` onto every emitted child. Copies the expression
     * once per child (UI5's binding installer mutates the BindingInfo),
     * same precaution as the core `<If>` processor.
     */
    function emitWithVisible(children: unknown, visibleExpr: string, emit: (child: unknown) => void): void;
    function emitChildren(children: unknown, emit: (child: unknown) => void): void;
    /**
     * Local flatten: drops falsy entries and unwraps arrays. We can't reach
     * the runtime's `flattenChildren` from here, it's intentionally
     * file-private, but the structural-directive contract guarantees
     * `<Case>` / `<Default>` only carry literal control children, so a
     * one-level walk is enough.
     */
    function flatten(children: unknown): unknown[];
}
//# sourceMappingURL=index.d.ts.map