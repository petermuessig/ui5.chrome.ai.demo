sap.ui.define(["sap/ui/core/mvc/View", "sap/m/Page", "sap/m/Button", "sap/m/VBox", "sap/m/FlexBox", "sap/m/GenericTile", "sap/m/TileContent", "sap/m/NumericContent", "sap/m/Text", "sap/m/Title", "ui5/community/jsx/runtime/jsx-runtime"], function (View, Page, Button, VBox, FlexBox, GenericTile, TileContent, NumericContent, Text, Title, __ui5_community_jsx_runtime_jsx_runtime) {
  "use strict";

  const _jsx = __ui5_community_jsx_runtime_jsx_runtime["jsx"];
  const _jsxs = __ui5_community_jsx_runtime_jsx_runtime["jsxs"];
  /**
   * @alias ui5.chrome.ai.demo.view.Home
   */
  const Home = View.extend("ui5.chrome.ai.demo.view.Home", {
    getAutoPrefixId: function _getAutoPrefixId() {
      return true;
    },
    getControllerModuleName: function _getControllerModuleName() {
      return "ui5/chrome/ai/demo/controller/Home";
    },
    createContent: function _createContent() {
      const ctrl = this.getController();
      return _jsx(Page, {
        id: "homePage",
        title: "Chrome Built-in AI",
        showNavButton: false,
        headerContent: [_jsx(Button, {
          icon: "sap-icon://sys-help",
          tooltip: "Setup & status",
          press: ctrl.onNavToHelp.bind(ctrl)
        })],
        children: _jsxs(VBox, {
          alignItems: "Center",
          justifyContent: "Center",
          class: "sapUiSmallMargin",
          children: [_jsx(Title, {
            text: "On-device AI powered by Gemini Nano",
            level: "H3",
            class: "sapUiSmallMarginBottom"
          }), _jsxs(FlexBox, {
            wrap: "Wrap",
            justifyContent: "Center",
            alignItems: "Center",
            children: [_jsx(GenericTile, {
              id: "tileTranslate",
              header: "Translate",
              subheader: "Language Detector & Translator API",
              frameType: "TwoByOne",
              press: ctrl.onNavToTranslate.bind(ctrl),
              class: "sapUiSmallMargin",
              children: _jsx(TileContent, {
                children: _jsx(NumericContent, {
                  value: "\uD83C\uDF10",
                  withMargin: false
                })
              })
            }), _jsx(GenericTile, {
              id: "tileSummarize",
              header: "Summarize",
              subheader: "Summarizer API",
              frameType: "TwoByOne",
              press: ctrl.onNavToSummarize.bind(ctrl),
              class: "sapUiSmallMargin",
              children: _jsx(TileContent, {
                children: _jsx(NumericContent, {
                  value: "\uD83D\uDCC4",
                  withMargin: false
                })
              })
            }), _jsx(GenericTile, {
              id: "tilePrompt",
              header: "Prompt",
              subheader: "LanguageModel (Gemini Nano)",
              frameType: "TwoByOne",
              press: ctrl.onNavToPrompt.bind(ctrl),
              class: "sapUiSmallMargin",
              children: _jsx(TileContent, {
                children: _jsx(NumericContent, {
                  value: "\uD83D\uDCAC",
                  withMargin: false
                })
              })
            })]
          }), _jsx(Text, {
            text: "Runs entirely in Chrome \u2014 no server, no API key, no data leaves your device.",
            class: "sapUiSmallMarginTop sapUiSmallMarginBottom"
          })]
        })
      });
    }
  });
  return Home;
});
//# sourceMappingURL=Home-dbg.view.js.map
