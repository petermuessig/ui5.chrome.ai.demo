sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/Dialog", "sap/m/Button", "sap/m/VBox", "sap/m/Label", "sap/m/TextArea", "sap/m/Slider", "../model/ai"], function (__BaseController, JSONModel, MessageBox, Dialog, Button, VBox, Label, TextArea, Slider, ___model_ai) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const checkLanguageModelAvailability = ___model_ai["checkLanguageModelAvailability"];
  const makeMonitor = ___model_ai["makeMonitor"];
  /**
   * @namespace ui5.chrome.ai.demo.controller
   */
  const PromptController = BaseController.extend("ui5.chrome.ai.demo.controller.PromptController", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this._session = null;
      this._settingsDialog = null;
      this._pendingImageBlob = null;
      this._recognition = null;
      this._dropHandler = null;
      this._pasteHandler = null;
      this._state = {
        messages: [],
        inputText: "",
        pendingImageSrc: "",
        busy: false,
        unavailable: false,
        unavailableText: "",
        downloading: false,
        downloadingText: "",
        downloadProgress: 0,
        listening: false,
        systemPrompt: "You are a helpful assistant.",
        temperature: 1.0,
        topK: 3,
        maxTemperature: 2.0,
        maxTopK: 128
      };
    },
    onInit: function _onInit() {
      const model = new JSONModel(this._state);
      this.getView().setModel(model, "promptModel");
      void this._checkAvailability();
    },
    onAfterRendering: function _onAfterRendering() {
      this._attachDomHandlers();
    },
    onExit: function _onExit() {
      this._session?.destroy();
      this._settingsDialog?.destroy();
      this._recognition?.abort();
      this._detachDomHandlers();
    },
    // ─── Availability & session init ────────────────────────────────────────────
    _checkAvailability: async function _checkAvailability() {
      const status = await checkLanguageModelAvailability();
      if (status === "unavailable") {
        this._setModel({
          unavailable: true,
          unavailableText: "Chrome Built-in AI (LanguageModel) is not available in this browser. Please use Chrome 148+ with on-device AI enabled."
        });
        return;
      }
      // Seed max params from browser
      try {
        const params = await LanguageModel.params();
        this._setModel({
          maxTemperature: params.maxTemperature ?? 2.0,
          maxTopK: params.maxTopK ?? 128,
          temperature: params.defaultTemperature ?? 1.0,
          topK: params.defaultTopK ?? 3
        });
      } catch {
        // use defaults
      }
    },
    _initSession: async function _initSession() {
      this._session?.destroy();
      this._session = null;
      const model = this.getView().getModel("promptModel");
      const state = model.getData();
      const onProgress = loaded => {
        this._setModel({
          downloading: true,
          downloadingText: "Downloading Gemini Nano model...",
          downloadProgress: Math.round(loaded * 100)
        });
      };
      try {
        const monitor = makeMonitor(onProgress);
        const hasImages = this._pendingImageBlob !== null;
        this._session = await LanguageModel.create({
          temperature: state.temperature,
          topK: state.topK,
          initialPrompts: state.systemPrompt ? [{
            role: "system",
            content: state.systemPrompt
          }] : undefined,
          expectedInputs: hasImages ? [{
            type: "text"
          }, {
            type: "image"
          }] : [{
            type: "text"
          }],
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
          unavailableText: `Failed to initialize LanguageModel: ${String(e)}`
        });
        return false;
      }
    },
    // ─── Send message ───────────────────────────────────────────────────────────
    onSend: async function _onSend() {
      const model = this.getView().getModel("promptModel");
      const state = model.getData();
      const inputText = state.inputText.trim();
      if (!inputText && !this._pendingImageBlob) return;

      // Add user message to transcript
      const userMsg = {
        role: "You",
        text: inputText + (this._pendingImageBlob ? " [image attached]" : "")
      };
      const messages = [...state.messages, userMsg];
      this._setModel({
        messages,
        inputText: "",
        busy: true
      });

      // Prepare assistant placeholder
      const assistantMsg = {
        role: "Assistant",
        text: ""
      };
      this._setModel({
        messages: [...messages, assistantMsg]
      });
      if (!this._session) {
        const ok = await this._initSession();
        if (!ok) {
          this._setModel({
            busy: false
          });
          return;
        }
      }
      try {
        let promptInput;
        if (this._pendingImageBlob) {
          promptInput = [{
            role: "user",
            content: [...(inputText ? [{
              type: "text",
              value: inputText
            }] : []), {
              type: "image",
              value: this._pendingImageBlob
            }]
          }];
          this._pendingImageBlob = null;
          this._setModel({
            pendingImageSrc: ""
          });
        } else {
          promptInput = inputText;
        }
        const stream = this._session.promptStreaming(promptInput);
        let fullText = "";
        for await (const chunk of stream) {
          fullText = chunk; // streaming gives cumulative text
          const updatedMessages = [...model.getData().messages];
          updatedMessages[updatedMessages.length - 1] = {
            role: "Assistant",
            text: fullText
          };
          this._setModel({
            messages: updatedMessages
          });
        }
        this._scrollToBottom();
      } catch (e) {
        MessageBox.error(`Prompt failed: ${String(e)}`);
        // Remove the empty assistant placeholder
        const updatedMessages = [...model.getData().messages];
        updatedMessages.pop();
        this._setModel({
          messages: updatedMessages
        });
      } finally {
        this._setModel({
          busy: false
        });
      }
    },
    // ─── Chat management ─────────────────────────────────────────────────────────
    onClearChat: function _onClearChat() {
      this._session?.destroy();
      this._session = null;
      this._pendingImageBlob = null;
      this._setModel({
        messages: [],
        inputText: "",
        pendingImageSrc: ""
      });
    },
    onClearImage: function _onClearImage() {
      this._pendingImageBlob = null;
      this._setModel({
        pendingImageSrc: ""
      });
    },
    // ─── Drop / Paste image ──────────────────────────────────────────────────────
    _attachDomHandlers: function _attachDomHandlers() {
      const composerEl = this.byId("composerInput").getDomRef();
      if (!composerEl) return;
      if (this._dropHandler) return; // already attached

      this._dropHandler = e => {
        e.preventDefault();
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) {
          this._setImageBlob(file);
        }
      };
      this._pasteHandler = e => {
        const items = Array.from(e.clipboardData?.items ?? []);
        const imgItem = items.find(i => i.type.startsWith("image/"));
        if (imgItem) {
          e.preventDefault();
          const blob = imgItem.getAsFile();
          if (blob) this._setImageBlob(blob);
        }
      };
      composerEl.addEventListener("dragover", e => e.preventDefault());
      composerEl.addEventListener("drop", this._dropHandler);
      composerEl.addEventListener("paste", this._pasteHandler);
    },
    _detachDomHandlers: function _detachDomHandlers() {
      const composerEl = this.byId("composerInput")?.getDomRef?.();
      if (composerEl && this._dropHandler) {
        composerEl.removeEventListener("drop", this._dropHandler);
      }
      if (composerEl && this._pasteHandler) {
        composerEl.removeEventListener("paste", this._pasteHandler);
      }
      this._dropHandler = null;
      this._pasteHandler = null;
    },
    _setImageBlob: function _setImageBlob(blob) {
      this._pendingImageBlob = blob;
      const src = URL.createObjectURL(blob);
      this._setModel({
        pendingImageSrc: src
      });
      // Destroy session so it is re-created with expectedInputs including 'image'
      this._session?.destroy();
      this._session = null;
    },
    // ─── Voice input ─────────────────────────────────────────────────────────────
    onMicToggle: function _onMicToggle() {
      const model = this.getView().getModel("promptModel");
      const state = model.getData();
      if (state.listening) {
        this._recognition?.stop();
        this._setModel({
          listening: false
        });
        return;
      }
      const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (!SpeechRec) {
        MessageBox.warning("Voice input is not supported in this browser.");
        return;
      }
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";
      rec.onresult = event => {
        const transcript = event.results[0][0].transcript;
        const current = this.getView().getModel("promptModel").getData();
        this._setModel({
          inputText: (current.inputText + " " + transcript).trim()
        });
      };
      rec.onend = () => this._setModel({
        listening: false
      });
      rec.onerror = () => this._setModel({
        listening: false
      });
      rec.start();
      this._recognition = rec;
      this._setModel({
        listening: true
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
      const model = this.getView().getModel("promptModel");
      const state = model.getData();
      const systemInput = new TextArea({
        value: state.systemPrompt,
        placeholder: 'e.g. "You are a helpful assistant."',
        rows: 3,
        width: "100%"
      });
      const tempLabel = new Label({
        text: `Temperature: ${state.temperature.toFixed(1)}`
      });
      const tempSlider = new Slider({
        value: state.temperature,
        min: 0,
        max: state.maxTemperature,
        step: 0.1,
        liveChange: e => {
          const v = e.getParameter("value");
          tempLabel.setText(`Temperature: ${v.toFixed(1)}`);
        }
      });
      const topKLabel = new Label({
        text: `Top-K: ${state.topK}`
      });
      const topKSlider = new Slider({
        value: state.topK,
        min: 1,
        max: state.maxTopK,
        step: 1,
        liveChange: e => {
          const v = e.getParameter("value");
          topKLabel.setText(`Top-K: ${v}`);
        }
      });
      const dialog = new Dialog({
        title: "Prompt Settings",
        contentWidth: "400px",
        content: [new VBox({
          items: [new Label({
            text: "System Prompt"
          }), systemInput, tempLabel, tempSlider, topKLabel, topKSlider]
        })],
        beginButton: new Button({
          text: "Save",
          type: "Emphasized",
          press: () => {
            this._setModel({
              systemPrompt: systemInput.getValue(),
              temperature: tempSlider.getValue(),
              topK: topKSlider.getValue()
            });
            // Reset session to pick up new settings
            this._session?.destroy();
            this._session = null;
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
      const model = this.getView().getModel("promptModel");
      const current = model.getData();
      model.setData({
        ...current,
        ...partial
      });
    },
    _scrollToBottom: function _scrollToBottom() {
      const scroller = this.byId("chatScroll");
      scroller?.scrollTo?.(0, 9999, 200);
    }
  });
  return PromptController;
});
//# sourceMappingURL=Prompt-dbg.controller.js.map
