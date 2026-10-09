sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/Dialog", "sap/m/Button", "sap/m/VBox", "sap/m/Label", "sap/m/Select", "sap/m/TextArea", "sap/ui/core/Item", "../model/ai"], function (__BaseController, JSONModel, MessageBox, Dialog, Button, VBox, Label, Select, TextArea, Item, ___model_ai) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const checkSummarizerAvailability = ___model_ai["checkSummarizerAvailability"];
  const makeMonitor = ___model_ai["makeMonitor"];
  const USAGE_CODE = `// Chrome Built-in AI — Summarizer API

// 1. Create a summarizer (model downloads on first use)
const summarizer = await Summarizer.create({
  type: "key-points",   // "tldr" | "key-points" | "teaser" | "headline"
  format: "plain-text", // "plain-text" | "markdown"
  length: "medium"      // "short" | "medium" | "long"
});

// 2. Stream the summary — runs entirely on-device
const stream = summarizer.summarizeStreaming(inputText);
let result = "";
for await (const chunk of stream) {
  result += chunk; // each chunk is an incremental delta
  display(result);
}
`;

  /**
   * @alias ui5.chrome.ai.demo.controller.SummarizeController
   */
  const SummarizeController = BaseController.extend("ui5.chrome.ai.demo.controller.SummarizeController", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this._summarizer = null;
      this._settingsDialog = null;
      this._keydownHandler = null;
      this._state = {
        inputText: "",
        outputText: "",
        busy: false,
        canSummarize: false,
        unavailable: false,
        unavailableText: "",
        downloading: false,
        downloadingText: "",
        downloadProgress: 0,
        showCode: false,
        code: USAGE_CODE,
        type: "key-points",
        format: "plain-text",
        length: "medium",
        sharedContext: ""
      };
    },
    onInit: function _onInit() {
      const model = new JSONModel(this._state);
      this.getView().setModel(model, "summarizeModel");
      void this._checkAvailability();
    },
    onAfterRendering: function _onAfterRendering() {
      const inputTA = this.byId("inputText");
      if (!inputTA || this._keydownHandler) return;
      this._keydownHandler = e => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void this.onSummarize();
        }
      };
      inputTA.attachBrowserEvent("keydown", this._keydownHandler);
    },
    onExit: function _onExit() {
      if (this._keydownHandler) {
        const inputTA = this.byId("inputText");
        inputTA?.detachBrowserEvent("keydown", this._keydownHandler);
        this._keydownHandler = null;
      }
      this._summarizer?.destroy();
      this._settingsDialog?.destroy();
    },
    _checkAvailability: async function _checkAvailability() {
      const status = await checkSummarizerAvailability();
      if (status === "unavailable") {
        this._setModel({
          unavailable: true,
          unavailableText: "Chrome Built-in AI Summarizer is not available in this browser. Please use Chrome 138+.",
          canSummarize: false
        });
      }
    },
    _initSummarizer: async function _initSummarizer() {
      this._summarizer?.destroy();
      this._summarizer = null;
      const model = this.getView().getModel("summarizeModel");
      const state = model.getData();
      const onProgress = loaded => {
        this._setModel({
          downloading: true,
          downloadingText: "Downloading Summarizer model...",
          downloadProgress: Math.round(loaded * 100)
        });
      };
      try {
        const monitor = makeMonitor(onProgress);
        this._summarizer = await Summarizer.create({
          type: state.type,
          format: state.format,
          length: state.length,
          sharedContext: state.sharedContext || undefined,
          monitor
        });
        this._setModel({
          downloading: false,
          unavailable: false
        });
        return true;
      } catch (e) {
        this._setModel({
          unavailable: true,
          unavailableText: `Failed to initialize Summarizer: ${String(e)}`
        });
        return false;
      }
    },
    onInputChange: function _onInputChange(event) {
      const text = event.getParameter("value");
      this._setModel({
        inputText: text,
        canSummarize: text.trim().length > 0
      });
    },
    onSummarize: async function _onSummarize() {
      const model = this.getView().getModel("summarizeModel");
      const state = model.getData();
      if (!state.inputText.trim()) return;
      this._setModel({
        busy: true,
        outputText: ""
      });
      if (!this._summarizer) {
        const ok = await this._initSummarizer();
        if (!ok) {
          this._setModel({
            busy: false
          });
          return;
        }
      }
      try {
        // Use streaming for live output.
        // summarizeStreaming yields incremental delta chunks, so we accumulate.
        const stream = this._summarizer.summarizeStreaming(state.inputText);
        let result = "";
        for await (const chunk of stream) {
          result += chunk;
          this._setModel({
            outputText: result
          });
        }
      } catch (e) {
        MessageBox.error(`Summarization failed: ${String(e)}`);
      } finally {
        this._setModel({
          busy: false
        });
      }
    },
    // ─── Code view ─────────────────────────────────────────────────────────────
    onToggleCode: function _onToggleCode() {
      const model = this.getView().getModel("summarizeModel");
      this._setModel({
        showCode: !model.getData().showCode
      });
    },
    // ─── Settings dialog ────────────────────────────────────────────────────────
    onOpenSettings: function _onOpenSettings() {
      if (!this._settingsDialog) {
        this._settingsDialog = this._buildSettingsDialog();
      }
      this._settingsDialog.open();
    },
    _buildSettingsDialog: function _buildSettingsDialog() {
      const typeSelect = new Select({
        selectedKey: "{summarizeModel>/type}"
      });
      typeSelect.addItem(new Item({
        key: "key-points",
        text: "Key Points"
      }));
      typeSelect.addItem(new Item({
        key: "tldr",
        text: "TL;DR"
      }));
      typeSelect.addItem(new Item({
        key: "teaser",
        text: "Teaser"
      }));
      typeSelect.addItem(new Item({
        key: "headline",
        text: "Headline"
      }));
      const formatSelect = new Select({
        selectedKey: "{summarizeModel>/format}"
      });
      formatSelect.addItem(new Item({
        key: "plain-text",
        text: "Plain Text"
      }));
      formatSelect.addItem(new Item({
        key: "markdown",
        text: "Markdown"
      }));
      const lengthSelect = new Select({
        selectedKey: "{summarizeModel>/length}"
      });
      lengthSelect.addItem(new Item({
        key: "short",
        text: "Short"
      }));
      lengthSelect.addItem(new Item({
        key: "medium",
        text: "Medium"
      }));
      lengthSelect.addItem(new Item({
        key: "long",
        text: "Long"
      }));
      const contextArea = new TextArea({
        value: "{summarizeModel>/sharedContext}",
        placeholder: 'e.g. "A news article summary for a busy reader"',
        rows: 3,
        width: "100%"
      });
      const dialog = new Dialog({
        title: "Summarizer Settings",
        contentWidth: "400px",
        content: [new VBox({
          items: [new Label({
            text: "Summary Type"
          }), typeSelect, new Label({
            text: "Output Format"
          }).addStyleClass("sapUiSmallMarginTop"), formatSelect, new Label({
            text: "Length"
          }).addStyleClass("sapUiSmallMarginTop"), lengthSelect, new Label({
            text: "Context hint (optional)"
          }).addStyleClass("sapUiSmallMarginTop"), contextArea]
        })],
        beginButton: new Button({
          text: "Save",
          type: "Emphasized",
          press: () => {
            // Model is already updated via two-way binding; just reset
            // the summarizer so it picks up the new settings on next use.
            this._summarizer?.destroy();
            this._summarizer = null;
            dialog.close();
          }
        }),
        endButton: new Button({
          text: "Cancel",
          press: () => dialog.close()
        })
      });
      this.getView().addDependent(dialog);
      return dialog;
    },
    _setModel: function _setModel(partial) {
      const model = this.getView().getModel("summarizeModel");
      const current = model.getData();
      model.setData({
        ...current,
        ...partial
      });
    }
  });
  return SummarizeController;
});
//# sourceMappingURL=Summarize-dbg.controller.js.map
