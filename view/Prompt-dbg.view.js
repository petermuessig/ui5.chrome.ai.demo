sap.ui.define(["sap/ui/core/mvc/View", "sap/m/Page", "sap/m/Button", "sap/m/VBox", "sap/m/HBox", "sap/m/FlexBox", "sap/m/FlexItemData", "sap/m/TextArea", "sap/m/FeedListItem", "sap/m/List", "sap/m/ScrollContainer", "sap/m/MessageStrip", "sap/m/ProgressIndicator", "sap/m/Label", "sap/m/Link", "sap/m/Image", "sap/ui/codeeditor/CodeEditor", "ui5/community/jsx/runtime/runtime/runtime", "ui5/community/jsx/runtime/jsx-runtime"], function (View, Page, Button, VBox, HBox, FlexBox, FlexItemData, TextArea, FeedListItem, List, ScrollContainer, MessageStrip, ProgressIndicator, Label, Link, Image, CodeEditor, __ui5_community_jsx_runtime_runtime_runtime, __ui5_community_jsx_runtime_jsx_runtime) {
  "use strict";

  const _jsx = __ui5_community_jsx_runtime_jsx_runtime["jsx"];
  const _jsxs = __ui5_community_jsx_runtime_jsx_runtime["jsxs"];
  const If = __ui5_community_jsx_runtime_runtime_runtime["If"];
  class Prompt extends View {
    getAutoPrefixId() {
      return true;
    }
    getControllerModuleName() {
      return "ui5/chrome/ai/demo/controller/Prompt";
    }
    createContent() {
      const ctrl = this.getController();
      return _jsxs(Page, {
        id: "promptPage",
        title: "Prompt (Chat)",
        showNavButton: true,
        navButtonPress: ctrl.onNavBack.bind(ctrl),
        enableScrolling: false,
        class: "sapUiContentPadding",
        headerContent: [_jsx(Button, {
          icon: "{= ${promptModel>/showCode} ? 'sap-icon://media-play' : 'sap-icon://source-code' }",
          tooltip: "{= ${promptModel>/showCode} ? 'Show demo' : 'Show code' }",
          press: ctrl.onToggleCode.bind(ctrl)
        }), _jsx(Button, {
          icon: "sap-icon://delete",
          tooltip: "Clear chat",
          press: ctrl.onClearChat.bind(ctrl)
        }), _jsx(Button, {
          icon: "sap-icon://action-settings",
          tooltip: "Settings",
          press: ctrl.onOpenSettings.bind(ctrl)
        })],
        children: [_jsxs(FlexBox, {
          direction: "Column",
          fitContainer: true,
          visible: "{= !${promptModel>/showCode} }",
          class: "chatFlexColumn",
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
            width: "100%",
            horizontal: false,
            vertical: true,
            focusable: false,
            class: "chatScrollFill",
            layoutData: new FlexItemData({
              growFactor: 1,
              shrinkFactor: 1,
              baseSize: "0"
            }),
            children: _jsx(List, {
              id: "chatList",
              showNoData: false,
              items: {
                path: "promptModel>/messages",
                template: new FeedListItem({
                  sender: "{promptModel>role}",
                  text: "{promptModel>text}",
                  showIcon: false,
                  senderActive: false,
                  maxCharacters: 99999
                })
              }
            })
          }), _jsx(If, {
            condition: "{promptModel>/pendingImageSrc}",
            children: _jsxs(HBox, {
              alignItems: "Center",
              class: "sapUiTinyMarginTop attachmentChip",
              children: [_jsx(Image, {
                id: "pendingImageThumb",
                src: "{promptModel>/pendingImageSrc}",
                width: "48px",
                height: "48px",
                densityAware: false,
                class: "attachmentThumb"
              }), _jsx(Label, {
                text: "{promptModel>/pendingImageName}",
                class: "sapUiSmallMarginBegin attachmentLabel"
              }), _jsx(Button, {
                icon: "sap-icon://decline",
                tooltip: "Remove image",
                press: ctrl.onClearImage.bind(ctrl),
                type: "Transparent"
              })]
            })
          }), _jsxs(HBox, {
            id: "composerBar",
            alignItems: "Center",
            class: "sapUiTinyMarginTop",
            layoutData: new FlexItemData({
              growFactor: 0,
              shrinkFactor: 0
            }),
            children: [_jsx(Button, {
              id: "micBtn",
              icon: "{= ${promptModel>/listening} ? 'sap-icon://stop' : 'sap-icon://microphone' }",
              tooltip: "{= ${promptModel>/listening} ? 'Stop recording' : 'Voice input' }",
              type: "{= ${promptModel>/listening} ? 'Attention' : 'Default' }",
              press: ctrl.onMicToggle.bind(ctrl)
            }), _jsx(Button, {
              id: "attachBtn",
              icon: "sap-icon://attachment",
              tooltip: "Attach image from file",
              press: ctrl.onAttach.bind(ctrl)
            }), _jsx(Button, {
              id: "cameraBtn",
              icon: "sap-icon://camera",
              tooltip: "Take a photo",
              press: ctrl.onCapture.bind(ctrl)
            }), _jsx(TextArea, {
              id: "composerInput",
              placeholder: "Type a message, or \uD83D\uDCCE attach / \uD83D\uDCF7 capture / paste an image...",
              rows: 2,
              growing: true,
              growingMaxLines: 6,
              width: "100%",
              value: "{promptModel>/inputText}",
              layoutData: new FlexItemData({
                growFactor: 1
              })
            }), _jsx(Button, {
              id: "sendBtn",
              icon: "sap-icon://paper-plane",
              tooltip: "Send",
              type: "Emphasized",
              enabled: "{= ${promptModel>/inputText}.trim().length > 0 || !!${promptModel>/pendingImageSrc} }",
              busy: "{promptModel>/busy}",
              press: ctrl.onSend.bind(ctrl)
            })]
          })]
        }), _jsxs(VBox, {
          class: "sapUiSmallMargin",
          fitContainer: true,
          visible: "{promptModel>/showCode}",
          children: [_jsx(CodeEditor, {
            type: "javascript",
            editable: false,
            lineNumbers: true,
            height: "400px",
            width: "100%",
            value: "{promptModel>/code}",
            class: "sapUiSmallMarginBottom"
          }), _jsx(Link, {
            text: "Chrome Prompt API docs \u2197",
            href: "https://developer.chrome.com/docs/ai/prompt-api",
            target: "_blank"
          })]
        })]
      });
    }
  }
  return Prompt;
});
//# sourceMappingURL=Prompt-dbg.view.js.map
