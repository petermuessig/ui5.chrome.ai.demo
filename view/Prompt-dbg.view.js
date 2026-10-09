sap.ui.define(["sap/ui/core/mvc/View", "sap/m/Page", "sap/m/Button", "sap/m/VBox", "sap/m/HBox", "sap/m/TextArea", "sap/m/FeedListItem", "sap/m/List", "sap/m/ScrollContainer", "sap/m/MessageStrip", "sap/m/ProgressIndicator", "sap/m/Label", "sap/m/Image", "sap/m/OverflowToolbar", "sap/m/ToolbarSeparator", "ui5/community/jsx/runtime/runtime/runtime", "ui5/community/jsx/runtime/jsx-runtime"], function (View, Page, Button, VBox, HBox, TextArea, FeedListItem, List, ScrollContainer, MessageStrip, ProgressIndicator, Label, Image, OverflowToolbar, ToolbarSeparator, __ui5_community_jsx_runtime_runtime_runtime, __ui5_community_jsx_runtime_jsx_runtime) {
  "use strict";

  const _jsx = __ui5_community_jsx_runtime_jsx_runtime["jsx"];
  const _jsxs = __ui5_community_jsx_runtime_jsx_runtime["jsxs"];
  const If = __ui5_community_jsx_runtime_runtime_runtime["If"];
  /**
   * @namespace ui5.chrome.ai.demo.view
   */
  const Prompt = View.extend("ui5.chrome.ai.demo.view.Prompt", {
    constructor: function _constructor() {
      View.prototype.constructor.call(this);
      this.controllerName = "ui5.chrome.ai.demo.controller.Prompt";
    },
    getAutoPrefixId: function _getAutoPrefixId() {
      return true;
    },
    getControllerModuleName: function _getControllerModuleName() {
      return "ui5.chrome.ai.demo.controller.Prompt";
    },
    createContent: function _createContent() {
      const ctrl = this.getController();
      return _jsx(Page, {
        id: "promptPage",
        title: "Prompt (Chat)",
        showNavButton: true,
        navButtonPress: ctrl.onNavBack.bind(ctrl),
        headerContent: [_jsx(Button, {
          icon: "sap-icon://delete",
          tooltip: "Clear chat",
          press: ctrl.onClearChat.bind(ctrl)
        }), _jsx(Button, {
          icon: "sap-icon://action-settings",
          tooltip: "Settings",
          press: ctrl.onOpenSettings.bind(ctrl)
        })],
        children: _jsxs(VBox, {
          fitContainer: true,
          class: "sapUiSmallMargin",
          height: "100%",
          children: [_jsx(If, {
            condition: "{promptModel>/unavailable}",
            children: _jsx(MessageStrip, {
              id: "unavailableStrip",
              text: "{promptModel>/unavailableText}",
              type: "Error",
              showIcon: true,
              class: "sapUiSmallMarginBottom"
            })
          }), _jsx(If, {
            condition: "{promptModel>/downloading}",
            children: _jsxs(VBox, {
              class: "sapUiSmallMarginBottom",
              children: [_jsx(Label, {
                text: "{promptModel>/downloadingText}"
              }), _jsx(ProgressIndicator, {
                percentValue: "{promptModel>/downloadProgress}",
                displayValue: "{promptModel>/downloadProgress}%",
                state: "Information"
              })]
            })
          }), _jsx(ScrollContainer, {
            id: "chatScroll",
            height: "100%",
            width: "100%",
            horizontal: false,
            vertical: true,
            focusable: false,
            children: _jsx(List, {
              id: "chatList",
              showNoData: false,
              items: {
                path: "promptModel>/messages",
                template: new FeedListItem({
                  sender: "{promptModel>role}",
                  text: "{promptModel>text}",
                  showIcon: false
                })
              }
            })
          }), _jsx(If, {
            condition: "{promptModel>/pendingImageSrc}",
            children: _jsxs(HBox, {
              alignItems: "Center",
              class: "sapUiSmallMarginTop",
              children: [_jsx(Image, {
                id: "pendingImageThumb",
                src: "{promptModel>/pendingImageSrc}",
                width: "80px",
                height: "80px"
              }), _jsx(Button, {
                icon: "sap-icon://decline",
                tooltip: "Remove image",
                press: ctrl.onClearImage.bind(ctrl),
                type: "Transparent"
              })]
            })
          }), _jsxs(OverflowToolbar, {
            id: "composerBar",
            class: "sapUiSmallMarginTop",
            children: [_jsx(Button, {
              id: "micBtn",
              icon: "{= ${promptModel>/listening} ? 'sap-icon://stop' : 'sap-icon://microphone' }",
              tooltip: "{= ${promptModel>/listening} ? 'Stop recording' : 'Voice input' }",
              type: "{= ${promptModel>/listening} ? 'Attention' : 'Default' }",
              press: ctrl.onMicToggle.bind(ctrl)
            }), _jsx(TextArea, {
              id: "composerInput",
              placeholder: "Type a message, or drop / paste an image...",
              rows: 2,
              growing: true,
              growingMaxLines: 6,
              width: "100%",
              value: "{promptModel>/inputText}"
            }), _jsx(ToolbarSeparator, {}), _jsx(Button, {
              id: "sendBtn",
              icon: "sap-icon://paper-plane",
              tooltip: "Send",
              type: "Emphasized",
              enabled: "{= ${promptModel>/inputText}.trim().length > 0 || !!${promptModel>/pendingImageSrc} }",
              busy: "{promptModel>/busy}",
              press: ctrl.onSend.bind(ctrl)
            })]
          })]
        })
      });
    }
  });
  return Prompt;
});
//# sourceMappingURL=Prompt-dbg.view.js.map
