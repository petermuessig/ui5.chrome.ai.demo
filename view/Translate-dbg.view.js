sap.ui.define(["sap/ui/core/mvc/View", "sap/m/Page", "sap/m/Button", "sap/m/VBox", "sap/m/HBox", "sap/m/FlexBox", "sap/m/Select", "sap/m/TextArea", "sap/m/Label", "sap/m/Link", "sap/m/MessageStrip", "sap/m/ProgressIndicator", "sap/ui/core/Item", "sap/ui/codeeditor/CodeEditor", "ui5/community/jsx/runtime/runtime/runtime", "ui5/community/jsx/runtime/jsx-runtime"], function (View, Page, Button, VBox, HBox, FlexBox, Select, TextArea, Label, Link, MessageStrip, ProgressIndicator, Item, CodeEditor, __ui5_community_jsx_runtime_runtime_runtime, __ui5_community_jsx_runtime_jsx_runtime) {
  "use strict";

  const _jsx = __ui5_community_jsx_runtime_jsx_runtime["jsx"];
  const _jsxs = __ui5_community_jsx_runtime_jsx_runtime["jsxs"];
  const If = __ui5_community_jsx_runtime_runtime_runtime["If"];
  class Translate extends View {
    getAutoPrefixId() {
      return true;
    }
    getControllerModuleName() {
      return "ui5/chrome/ai/demo/controller/Translate";
    }
    createContent() {
      const ctrl = this.getController();

      // Source language items (Auto-Detect + all languages)
      const sourceLangSelect = _jsxs(Select, {
        id: "sourceLangSelect",
        change: ctrl.onSourceLangChange.bind(ctrl),
        children: [_jsx(Item, {
          text: "Auto-Detect"
        }, "auto"), _jsx(Item, {
          text: "Arabic"
        }, "ar"), _jsx(Item, {
          text: "Bulgarian"
        }, "bg"), _jsx(Item, {
          text: "Chinese (Simplified)"
        }, "zh"), _jsx(Item, {
          text: "Chinese (Traditional)"
        }, "zh-Hant"), _jsx(Item, {
          text: "Czech"
        }, "cs"), _jsx(Item, {
          text: "Danish"
        }, "da"), _jsx(Item, {
          text: "Dutch"
        }, "nl"), _jsx(Item, {
          text: "English"
        }, "en"), _jsx(Item, {
          text: "Finnish"
        }, "fi"), _jsx(Item, {
          text: "French"
        }, "fr"), _jsx(Item, {
          text: "German"
        }, "de"), _jsx(Item, {
          text: "Greek"
        }, "el"), _jsx(Item, {
          text: "Hebrew"
        }, "he"), _jsx(Item, {
          text: "Hindi"
        }, "hi"), _jsx(Item, {
          text: "Hungarian"
        }, "hu"), _jsx(Item, {
          text: "Indonesian"
        }, "id"), _jsx(Item, {
          text: "Italian"
        }, "it"), _jsx(Item, {
          text: "Japanese"
        }, "ja"), _jsx(Item, {
          text: "Korean"
        }, "ko"), _jsx(Item, {
          text: "Norwegian"
        }, "no"), _jsx(Item, {
          text: "Polish"
        }, "pl"), _jsx(Item, {
          text: "Portuguese"
        }, "pt"), _jsx(Item, {
          text: "Romanian"
        }, "ro"), _jsx(Item, {
          text: "Russian"
        }, "ru"), _jsx(Item, {
          text: "Slovak"
        }, "sk"), _jsx(Item, {
          text: "Spanish"
        }, "es"), _jsx(Item, {
          text: "Swedish"
        }, "sv"), _jsx(Item, {
          text: "Thai"
        }, "th"), _jsx(Item, {
          text: "Turkish"
        }, "tr"), _jsx(Item, {
          text: "Ukrainian"
        }, "uk"), _jsx(Item, {
          text: "Vietnamese"
        }, "vi")]
      });
      const targetLangSelect = _jsxs(Select, {
        id: "targetLangSelect",
        change: ctrl.onTargetLangChange.bind(ctrl),
        children: [_jsx(Item, {
          text: "German"
        }, "de"), _jsx(Item, {
          text: "Arabic"
        }, "ar"), _jsx(Item, {
          text: "Bulgarian"
        }, "bg"), _jsx(Item, {
          text: "Chinese (Simplified)"
        }, "zh"), _jsx(Item, {
          text: "Chinese (Traditional)"
        }, "zh-Hant"), _jsx(Item, {
          text: "Czech"
        }, "cs"), _jsx(Item, {
          text: "Danish"
        }, "da"), _jsx(Item, {
          text: "Dutch"
        }, "nl"), _jsx(Item, {
          text: "English"
        }, "en"), _jsx(Item, {
          text: "Finnish"
        }, "fi"), _jsx(Item, {
          text: "French"
        }, "fr"), _jsx(Item, {
          text: "Greek"
        }, "el"), _jsx(Item, {
          text: "Hebrew"
        }, "he"), _jsx(Item, {
          text: "Hindi"
        }, "hi"), _jsx(Item, {
          text: "Hungarian"
        }, "hu"), _jsx(Item, {
          text: "Indonesian"
        }, "id"), _jsx(Item, {
          text: "Italian"
        }, "it"), _jsx(Item, {
          text: "Japanese"
        }, "ja"), _jsx(Item, {
          text: "Korean"
        }, "ko"), _jsx(Item, {
          text: "Norwegian"
        }, "no"), _jsx(Item, {
          text: "Polish"
        }, "pl"), _jsx(Item, {
          text: "Portuguese"
        }, "pt"), _jsx(Item, {
          text: "Romanian"
        }, "ro"), _jsx(Item, {
          text: "Russian"
        }, "ru"), _jsx(Item, {
          text: "Slovak"
        }, "sk"), _jsx(Item, {
          text: "Spanish"
        }, "es"), _jsx(Item, {
          text: "Swedish"
        }, "sv"), _jsx(Item, {
          text: "Thai"
        }, "th"), _jsx(Item, {
          text: "Turkish"
        }, "tr"), _jsx(Item, {
          text: "Ukrainian"
        }, "uk"), _jsx(Item, {
          text: "Vietnamese"
        }, "vi")]
      });
      return _jsxs(Page, {
        id: "translatePage",
        title: "Translate",
        showNavButton: true,
        navButtonPress: ctrl.onNavBack.bind(ctrl),
        headerContent: [_jsx(Button, {
          icon: "{= ${translateModel>/showCode} ? 'sap-icon://media-play' : 'sap-icon://source-code' }",
          tooltip: "{= ${translateModel>/showCode} ? 'Show demo' : 'Show code' }",
          press: ctrl.onToggleCode.bind(ctrl)
        }), _jsx(Button, {
          icon: "sap-icon://action-settings",
          tooltip: "Settings",
          press: ctrl.onOpenSettings.bind(ctrl)
        })],
        children: [_jsxs(VBox, {
          class: "sapUiSmallMargin",
          fitContainer: true,
          visible: "{= !${translateModel>/showCode} }",
          children: [_jsx(If, {
            condition: "{translateModel>/unavailable}",
            children: _jsx(MessageStrip, {
              id: "unavailableStrip",
              text: "{translateModel>/unavailableText}",
              type: "Error",
              showIcon: true,
              class: "sapUiSmallMarginBottom"
            })
          }), _jsx(If, {
            condition: "{translateModel>/downloading}",
            children: _jsxs(VBox, {
              class: "sapUiSmallMarginBottom",
              children: [_jsx(Label, {
                text: "{translateModel>/downloadingText}"
              }), _jsx(ProgressIndicator, {
                percentValue: "{translateModel>/downloadProgress}",
                displayValue: "{translateModel>/downloadProgress}%",
                state: "Information"
              })]
            })
          }), _jsxs(HBox, {
            alignItems: "Center",
            justifyContent: "SpaceBetween",
            class: "sapUiSmallMarginBottom",
            children: [sourceLangSelect, _jsx(Button, {
              id: "swapBtn",
              icon: "sap-icon://transfer",
              tooltip: "Swap languages",
              enabled: "{= ${translateModel>/sourceLang} !== 'auto' }",
              press: ctrl.onSwap.bind(ctrl),
              class: "sapUiSmallMarginBeginEnd"
            }), targetLangSelect]
          }), _jsx(If, {
            condition: "{translateModel>/detectedLangText}",
            children: _jsx(Label, {
              id: "detectedLangLabel",
              text: "{translateModel>/detectedLangText}",
              class: "sapUiSmallMarginBottom"
            })
          }), _jsxs(FlexBox, {
            width: "100%",
            class: "sapUiSmallMarginBottom",
            children: [_jsx(VBox, {
              width: "50%",
              class: "sapUiTinyMarginEnd",
              children: _jsx(TextArea, {
                id: "sourceText",
                placeholder: "Enter text to translate...",
                rows: 10,
                width: "100%",
                growing: true,
                liveChange: ctrl.onSourceTextChange.bind(ctrl)
              })
            }), _jsx(VBox, {
              width: "50%",
              children: _jsx(TextArea, {
                id: "targetText",
                placeholder: "Translation will appear here...",
                rows: 10,
                width: "100%",
                editable: false,
                value: "{translateModel>/targetText}"
              })
            })]
          }), _jsx(Button, {
            id: "translateBtn",
            text: "Translate",
            type: "Emphasized",
            enabled: "{translateModel>/canTranslate}",
            busy: "{translateModel>/busy}",
            press: ctrl.onTranslate.bind(ctrl)
          })]
        }), _jsxs(VBox, {
          class: "sapUiSmallMargin",
          fitContainer: true,
          visible: "{translateModel>/showCode}",
          children: [_jsx(CodeEditor, {
            type: "javascript",
            editable: false,
            lineNumbers: true,
            height: "400px",
            width: "100%",
            value: "{translateModel>/code}",
            class: "sapUiSmallMarginBottom"
          }), _jsx(Link, {
            text: "Chrome Language Detector API docs \u2197",
            href: "https://developer.chrome.com/docs/ai/language-detection",
            target: "_blank",
            class: "sapUiSmallMarginBottom"
          }), _jsx(Link, {
            text: "Chrome Translator API docs \u2197",
            href: "https://developer.chrome.com/docs/ai/translator-api",
            target: "_blank"
          })]
        })]
      });
    }
  }
  return Translate;
});
//# sourceMappingURL=Translate-dbg.view.js.map
