sap.ui.define(["sap/ui/core/mvc/View", "sap/m/Page", "sap/m/Button", "sap/m/VBox", "sap/m/HBox", "sap/m/Text", "sap/m/ObjectStatus", "sap/m/Link", "ui5/community/jsx/runtime/jsx-runtime"], function (View, Page, Button, VBox, HBox, Text, ObjectStatus, Link, __ui5_community_jsx_runtime_jsx_runtime) {
  "use strict";

  const _jsx = __ui5_community_jsx_runtime_jsx_runtime["jsx"];
  const _jsxs = __ui5_community_jsx_runtime_jsx_runtime["jsxs"];
  class Help extends View {
    getAutoPrefixId() {
      return true;
    }
    getControllerModuleName() {
      return "ui5/chrome/ai/demo/controller/Help";
    }
    createContent() {
      const ctrl = this.getController();
      return _jsx(Page, {
        id: "helpPage",
        title: "Setup & Status",
        showNavButton: true,
        navButtonPress: ctrl.onNavBack.bind(ctrl),
        children: _jsxs(VBox, {
          class: "sapUiSmallMargin",
          children: [_jsxs(HBox, {
            justifyContent: "SpaceBetween",
            alignItems: "Center",
            class: "sapUiTinyMarginBottom",
            children: [_jsx(Text, {
              text: "API availability"
            }), _jsx(Button, {
              icon: "sap-icon://refresh",
              tooltip: "Re-check status",
              type: "Transparent",
              press: ctrl.onRefreshStatus.bind(ctrl)
            })]
          }), _jsx(ObjectStatus, {
            title: "Language Detector",
            text: "{helpModel>/detector/text}",
            state: "{helpModel>/detector/state}",
            class: "sapUiTinyMarginBottom"
          }), _jsx(ObjectStatus, {
            title: "Translator",
            text: "{helpModel>/translator/text}",
            state: "{helpModel>/translator/state}",
            class: "sapUiTinyMarginBottom"
          }), _jsx(ObjectStatus, {
            title: "Summarizer",
            text: "{helpModel>/summarizer/text}",
            state: "{helpModel>/summarizer/state}",
            class: "sapUiTinyMarginBottom"
          }), _jsx(ObjectStatus, {
            title: "Prompt (LanguageModel)",
            text: "{helpModel>/languageModel/text}",
            state: "{helpModel>/languageModel/state}",
            class: "sapUiSmallMarginBottom"
          }), _jsx(Text, {
            text: "Not available? Enable these flags in Chrome 138+, then relaunch Chrome (copy each path into the address bar \u2014 chrome:// links cannot be clicked from a page):",
            class: "sapUiTinyMarginBottom"
          }), _jsx(Text, {
            text: "chrome://flags/#prompt-api-for-gemini-nano  \u2192  Enabled"
          }), _jsx(Text, {
            text: "chrome://flags/#optimization-guide-on-device-model  \u2192  Enabled BypassPerfRequirement"
          }), _jsx(Text, {
            text: "chrome://flags/#translation-api  \u2192  Enabled"
          }), _jsx(Text, {
            text: "chrome://flags/#language-detection-api  \u2192  Enabled"
          }), _jsx(Text, {
            text: "chrome://flags/#summarization-api-for-gemini-nano  \u2192  Enabled",
            class: "sapUiTinyMarginBottom"
          }), _jsx(Text, {
            text: "After relaunching, Gemini Nano downloads on first use. Verify or force the download at: chrome://on-device-internals",
            class: "sapUiTinyMarginBottom"
          }), _jsx(Link, {
            text: "Full setup guide \u2197",
            href: "https://developer.chrome.com/docs/ai/get-started",
            target: "_blank"
          })]
        })
      });
    }
  }
  return Help;
});
//# sourceMappingURL=Help-dbg.view.js.map
