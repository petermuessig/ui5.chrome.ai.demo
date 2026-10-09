sap.ui.define(["sap/ui/core/mvc/View", "sap/m/Page", "sap/m/Button", "sap/m/VBox", "sap/m/Label", "sap/m/Link", "sap/m/TextArea", "sap/m/MessageStrip", "sap/m/ProgressIndicator", "sap/ui/codeeditor/CodeEditor", "ui5/community/jsx/runtime/runtime/runtime", "ui5/community/jsx/runtime/jsx-runtime"], function (View, Page, Button, VBox, Label, Link, TextArea, MessageStrip, ProgressIndicator, CodeEditor, __ui5_community_jsx_runtime_runtime_runtime, __ui5_community_jsx_runtime_jsx_runtime) {
  "use strict";

  const _jsx = __ui5_community_jsx_runtime_jsx_runtime["jsx"];
  const _jsxs = __ui5_community_jsx_runtime_jsx_runtime["jsxs"];
  const If = __ui5_community_jsx_runtime_runtime_runtime["If"];
  /**
   * @alias ui5.chrome.ai.demo.view.Summarize
   */
  const Summarize = View.extend("ui5.chrome.ai.demo.view.Summarize", {
    getAutoPrefixId: function _getAutoPrefixId() {
      return true;
    },
    getControllerModuleName: function _getControllerModuleName() {
      return "ui5/chrome/ai/demo/controller/Summarize";
    },
    createContent: function _createContent() {
      const ctrl = this.getController();
      return _jsxs(Page, {
        id: "summarizePage",
        title: "Summarize",
        showNavButton: true,
        navButtonPress: ctrl.onNavBack.bind(ctrl),
        headerContent: [_jsx(Button, {
          icon: "{= ${summarizeModel>/showCode} ? 'sap-icon://media-play' : 'sap-icon://source-code' }",
          tooltip: "{= ${summarizeModel>/showCode} ? 'Show demo' : 'Show code' }",
          press: ctrl.onToggleCode.bind(ctrl)
        }), _jsx(Button, {
          icon: "sap-icon://action-settings",
          tooltip: "Settings",
          press: ctrl.onOpenSettings.bind(ctrl)
        })],
        children: [_jsxs(VBox, {
          class: "sapUiSmallMargin",
          fitContainer: true,
          visible: "{= !${summarizeModel>/showCode} }",
          children: [_jsx(If, {
            condition: "{summarizeModel>/unavailable}",
            children: _jsx(MessageStrip, {
              id: "unavailableStrip",
              text: "{summarizeModel>/unavailableText}",
              type: "Error",
              showIcon: true,
              class: "sapUiSmallMarginBottom"
            })
          }), _jsx(If, {
            condition: "{summarizeModel>/downloading}",
            children: _jsxs(VBox, {
              class: "sapUiSmallMarginBottom",
              children: [_jsx(Label, {
                text: "{summarizeModel>/downloadingText}"
              }), _jsx(ProgressIndicator, {
                percentValue: "{summarizeModel>/downloadProgress}",
                displayValue: "{summarizeModel>/downloadProgress}%",
                state: "Information"
              })]
            })
          }), _jsx(Label, {
            text: "Input text",
            class: "sapUiSmallMarginBottom"
          }), _jsx(TextArea, {
            id: "inputText",
            placeholder: "Paste the text you want to summarize here...",
            rows: 12,
            growing: true,
            width: "100%",
            class: "sapUiSmallMarginBottom",
            liveChange: ctrl.onInputChange.bind(ctrl)
          }), _jsx(Button, {
            id: "summarizeBtn",
            text: "Summarize",
            type: "Emphasized",
            enabled: "{summarizeModel>/canSummarize}",
            busy: "{summarizeModel>/busy}",
            press: ctrl.onSummarize.bind(ctrl),
            class: "sapUiSmallMarginBottom"
          }), _jsx(Label, {
            text: "Summary",
            class: "sapUiSmallMarginBottom"
          }), _jsx(TextArea, {
            id: "outputText",
            placeholder: "Summary will appear here...",
            rows: 10,
            width: "100%",
            editable: false,
            value: "{summarizeModel>/outputText}"
          })]
        }), _jsxs(VBox, {
          class: "sapUiSmallMargin",
          fitContainer: true,
          visible: "{summarizeModel>/showCode}",
          children: [_jsx(CodeEditor, {
            type: "javascript",
            editable: false,
            lineNumbers: true,
            height: "400px",
            width: "100%",
            value: "{summarizeModel>/code}",
            class: "sapUiSmallMarginBottom"
          }), _jsx(Link, {
            text: "Chrome Summarizer API docs \u2197",
            href: "https://developer.chrome.com/docs/ai/summarizer-api",
            target: "_blank"
          })]
        })]
      });
    }
  });
  return Summarize;
});
//# sourceMappingURL=Summarize-dbg.view.js.map
