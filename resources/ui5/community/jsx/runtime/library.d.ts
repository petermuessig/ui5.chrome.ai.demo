declare module "ui5/community/jsx/runtime/library" {
    /**
     * Initialise the `ui5.community.jsx.runtime` library.
     *
     * This library does not ship any controls. It exposes the JSX runtime
     * entry point (`ui5.community.jsx.runtime/jsx-runtime`) that Babel
     * imports via `@babel/plugin-transform-react-jsx` with
     * `importSource: "ui5/community/jsx/runtime"`.
     *
     * The `initLibrary` call registers the namespace with UI5's core so
     * consumers can declare `ui5.community.jsx.runtime` as a `libs`
     * dependency in their `manifest.json` and the resource-root mapping
     * resolves automatically.
     *
     * @namespace ui5.community.jsx.runtime
     */
    const thisLib: any;
    export default thisLib;
}
//# sourceMappingURL=library.d.ts.map