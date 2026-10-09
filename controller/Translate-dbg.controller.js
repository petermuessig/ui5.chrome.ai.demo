sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/Dialog", "sap/m/Button", "sap/m/VBox", "sap/m/Label", "sap/m/Select", "sap/ui/core/Item", "../model/ai"], function (__BaseController, JSONModel, MessageBox, Dialog, Button, VBox, Label, Select, Item, ___model_ai) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const checkLanguageDetectorAvailability = ___model_ai["checkLanguageDetectorAvailability"];
  const checkTranslatorAvailability = ___model_ai["checkTranslatorAvailability"];
  const makeMonitor = ___model_ai["makeMonitor"];
  const SUPPORTED_LANGUAGES = ___model_ai["SUPPORTED_LANGUAGES"];
  const USAGE_CODE = `// Chrome Built-in AI — Language Detector & Translator APIs

// 1. Detect language
const detector = await LanguageDetector.create();
const [best] = await detector.detect("Bonjour le monde");
console.log(best.detectedLanguage); // "fr"

// 2. Create a translator (model downloads on first use)
const translator = await Translator.create({
  sourceLanguage: "fr",
  targetLanguage: "en"
});

// 3. Translate — runs entirely on-device
const result = await translator.translate("Bonjour le monde");
console.log(result); // "Hello world"
`;

  /**
   * @alias ui5.chrome.ai.demo.controller.TranslateController
   */
  const TranslateController = BaseController.extend("ui5.chrome.ai.demo.controller.TranslateController", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this._detector = null;
      this._translator = null;
      this._detectTimer = null;
      this._settingsDialog = null;
      this._keydownHandler = null;
      this._state = {
        sourceLang: "auto",
        targetLang: "de",
        sourceText: "",
        targetText: "",
        detectedLangText: "",
        detectedLangCode: "",
        detectedConfidence: 0,
        busy: false,
        canTranslate: false,
        unavailable: false,
        unavailableText: "",
        downloading: false,
        downloadingText: "",
        downloadProgress: 0,
        showCode: false,
        code: USAGE_CODE
      };
    },
    onInit: function _onInit() {
      const model = new JSONModel(this._state);
      this.getView().setModel(model, "translateModel");
      void this._checkAvailability();
    },
    onAfterRendering: function _onAfterRendering() {
      const sourceTA = this.byId("sourceText");
      if (!sourceTA || this._keydownHandler) return;
      this._keydownHandler = e => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          void this.onTranslate();
        }
      };
      sourceTA.attachBrowserEvent("keydown", this._keydownHandler);
    },
    onExit: function _onExit() {
      if (this._keydownHandler) {
        const sourceTA = this.byId("sourceText");
        sourceTA?.detachBrowserEvent("keydown", this._keydownHandler);
        this._keydownHandler = null;
      }
      this._detector?.destroy();
      this._translator?.destroy();
      this._settingsDialog?.destroy();
    },
    // ─── Availability ───────────────────────────────────────────────────────────
    _checkAvailability: async function _checkAvailability() {
      const detectorStatus = await checkLanguageDetectorAvailability();
      if (detectorStatus === "unavailable") {
        this._setModel({
          unavailable: true,
          unavailableText: "Chrome Built-in AI Language Detector is not available in this browser. Please use Chrome 138+.",
          canTranslate: false
        });
        return;
      }
      await this._initDetector();
    },
    _initDetector: async function _initDetector() {
      const onProgress = loaded => {
        this._setModel({
          downloading: true,
          downloadingText: "Downloading Language Detector model...",
          downloadProgress: Math.round(loaded * 100)
        });
      };
      try {
        const monitor = makeMonitor(onProgress);
        this._detector = await LanguageDetector.create({
          monitor
        });
        this._setModel({
          downloading: false
        });
      } catch (e) {
        this._setModel({
          unavailable: true,
          unavailableText: `Failed to initialize Language Detector: ${String(e)}`
        });
      }
    },
    _initTranslator: async function _initTranslator(sourceLang, targetLang) {
      this._translator?.destroy();
      this._translator = null;
      const status = await checkTranslatorAvailability(sourceLang, targetLang);
      if (status === "unavailable") {
        this._setModel({
          unavailable: true,
          unavailableText: `Translation from '${sourceLang}' to '${targetLang}' is not available.`
        });
        return false;
      }
      const onProgress = loaded => {
        this._setModel({
          downloading: true,
          downloadingText: `Downloading translation model (${sourceLang} → ${targetLang})...`,
          downloadProgress: Math.round(loaded * 100)
        });
      };
      try {
        const monitor = makeMonitor(onProgress);
        this._translator = await Translator.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
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
          unavailableText: `Failed to initialize Translator: ${String(e)}`
        });
        return false;
      }
    },
    // ─── UI event handlers ──────────────────────────────────────────────────────
    onSourceLangChange: function _onSourceLangChange() {
      const select = this.byId("sourceLangSelect");
      const key = select.getSelectedKey();
      this._setModel({
        sourceLang: key
      });
      this._translator?.destroy();
      this._translator = null;
      void this._detectAndUpdateLabel();
    },
    onTargetLangChange: function _onTargetLangChange() {
      const select = this.byId("targetLangSelect");
      const key = select.getSelectedKey();
      this._setModel({
        targetLang: key
      });
      this._translator?.destroy();
      this._translator = null;
    },
    onSourceTextChange: function _onSourceTextChange(event) {
      const text = event.getParameter("value");
      this._setModel({
        sourceText: text,
        canTranslate: text.trim().length > 0
      });
      // Debounced auto-detect
      if (this._detectTimer) clearTimeout(this._detectTimer);
      this._detectTimer = setTimeout(() => {
        void this._detectAndUpdateLabel();
      }, 600);
    },
    _detectAndUpdateLabel: async function _detectAndUpdateLabel() {
      const model = this.getView().getModel("translateModel");
      const state = model.getData();
      if (!this._detector || !state.sourceText.trim()) {
        this._setModel({
          detectedLangText: "",
          detectedLangCode: ""
        });
        return;
      }
      try {
        const results = await this._detector.detect(state.sourceText);
        if (results.length > 0) {
          const best = results[0];
          const confidence = Math.round((best.confidence ?? 0) * 100);
          const langName = this._getLangName(best.detectedLanguage);

          // When the detected language changes and we are in auto mode,
          // the translator was initialised for the old source language —
          // destroy it so it gets re-created with the correct pair next time.
          if (state.sourceLang === "auto" && best.detectedLanguage !== state.detectedLangCode) {
            this._translator?.destroy();
            this._translator = null;
          }
          this._setModel({
            detectedLangCode: best.detectedLanguage,
            detectedLangText: state.sourceLang === "auto" ? `Detected: ${langName} (${confidence}%)` : ""
          });
        }
      } catch {
        // silence detection errors
      }
    },
    onTranslate: async function _onTranslate() {
      const model = this.getView().getModel("translateModel");
      const state = model.getData();
      if (!state.sourceText.trim()) return;
      let srcLang = state.sourceLang;
      if (srcLang === "auto") {
        srcLang = state.detectedLangCode;
        if (!srcLang) {
          MessageBox.warning("Could not detect the source language. Please select one manually.");
          return;
        }
      }
      this._setModel({
        busy: true,
        targetText: ""
      });
      const ok = this._translator ? true : await this._initTranslator(srcLang, state.targetLang);
      if (!ok || !this._translator) {
        this._setModel({
          busy: false
        });
        return;
      }
      try {
        const result = await this._translator.translate(state.sourceText);
        this._setModel({
          targetText: result
        });
      } catch (e) {
        MessageBox.error(`Translation failed: ${String(e)}`);
      } finally {
        this._setModel({
          busy: false
        });
      }
    },
    onSwap: function _onSwap() {
      const model = this.getView().getModel("translateModel");
      const state = model.getData();
      if (state.sourceLang === "auto") return;
      const sourceSel = this.byId("sourceLangSelect");
      const targetSel = this.byId("targetLangSelect");

      // Swap select keys
      const prevSource = state.sourceLang;
      const prevTarget = state.targetLang;
      sourceSel.setSelectedKey(prevTarget);
      targetSel.setSelectedKey(prevSource);

      // Swap text + reset translator
      this._translator?.destroy();
      this._translator = null;
      this._setModel({
        sourceLang: prevTarget,
        targetLang: prevSource,
        sourceText: state.targetText,
        targetText: state.sourceText
      });
      const sourceTA = this.byId("sourceText");
      sourceTA.setValue(state.targetText);
    },
    // ─── Code view ─────────────────────────────────────────────────────────────
    onToggleCode: function _onToggleCode() {
      const model = this.getView().getModel("translateModel");
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
      const model = this.getView().getModel("translateModel");
      const state = model.getData();
      const srcItems = SUPPORTED_LANGUAGES.map(l => new Item({
        key: l.key,
        text: l.text
      }));
      const tgtItems = SUPPORTED_LANGUAGES.map(l => new Item({
        key: l.key,
        text: l.text
      }));
      const srcSelect = new Select({
        selectedKey: state.sourceLang
      });
      srcSelect.addItem(new Item({
        key: "auto",
        text: "Auto-Detect"
      }));
      srcItems.forEach(i => srcSelect.addItem(i));
      const tgtSelect = new Select({
        selectedKey: state.targetLang
      });
      tgtItems.forEach(i => tgtSelect.addItem(i));
      const dialog = new Dialog({
        title: "Translator Settings",
        content: [new VBox({
          items: [new Label({
            text: "Source Language"
          }), srcSelect, new Label({
            text: "Target Language"
          }).addStyleClass("sapUiSmallMarginTop"), tgtSelect]
        })],
        beginButton: new Button({
          text: "Save",
          type: "Emphasized",
          press: () => {
            const srcKey = srcSelect.getSelectedKey();
            const tgtKey = tgtSelect.getSelectedKey();
            this._setModel({
              sourceLang: srcKey,
              targetLang: tgtKey
            });
            const sourceSel = this.byId("sourceLangSelect");
            const targetSel = this.byId("targetLangSelect");
            sourceSel.setSelectedKey(srcKey);
            targetSel.setSelectedKey(tgtKey);
            this._translator?.destroy();
            this._translator = null;
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
    // ─── Helpers ────────────────────────────────────────────────────────────────
    _setModel: function _setModel(partial) {
      const model = this.getView().getModel("translateModel");
      const current = model.getData();
      model.setData({
        ...current,
        ...partial
      });
    },
    _getLangName: function _getLangName(code) {
      const found = SUPPORTED_LANGUAGES.find(l => l.key === code);
      return found ? found.text : code;
    }
  });
  return TranslateController;
});
//# sourceMappingURL=Translate-dbg.controller.js.map
