sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/MessageToast", "sap/m/Dialog", "sap/m/Button", "sap/m/VBox", "sap/m/Label", "sap/m/TextArea", "sap/m/Slider", "sap/ui/core/HTML", "../model/ai"], function (__BaseController, JSONModel, MessageBox, MessageToast, Dialog, Button, VBox, Label, TextArea, Slider, HTML, ___model_ai) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const checkLanguageModelAvailability = ___model_ai["checkLanguageModelAvailability"];
  const makeMonitor = ___model_ai["makeMonitor"];
  const USAGE_CODE = `// Chrome Built-in AI — Prompt API (LanguageModel / Gemini Nano)

// 1. Create a session (model downloads on first use)
const session = await LanguageModel.create({
  systemPrompt: "You are a helpful assistant.",
  temperature: 1.0,
  topK: 3
});

// 2. Stream the response — runs entirely on-device
const stream = session.promptStreaming("Tell me a joke");
let response = "";
for await (const chunk of stream) {
  response += chunk; // each chunk is a delta
  display(response);
}

// 3. Multi-turn: the session maintains conversation history
const followUp = await session.prompt("Explain it to a 5-year-old");
`;

  /**
   * @alias ui5.chrome.ai.demo.controller.Prompt
   */
  const PromptController = BaseController.extend("ui5.chrome.ai.demo.controller.Prompt", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this._session = null;
      this._settingsDialog = null;
      this._pendingImageBlob = null;
      this._recognition = null;
      this._dropHandler = null;
      this._pasteHandler = null;
      this._keydownHandler = null;
      this._fileInput = null;
      this._cameraStream = null;
      this._state = {
        messages: [],
        inputText: "",
        pendingImageSrc: "",
        pendingImageName: "",
        busy: false,
        unavailable: false,
        unavailableText: "",
        downloading: false,
        downloadingText: "",
        downloadProgress: 0,
        listening: false,
        showCode: false,
        code: USAGE_CODE,
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
      this._stopCameraStream();
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
          fullText += chunk; // each chunk is a delta
          // Use setProperty to update only the last message text — avoids destroying
          // and recreating FeedListItem controls (which resets their expanded state).
          const msgCount = model.getData().messages.length;
          model.setProperty(`/messages/${msgCount - 1}/text`, fullText);
          this._scrollToBottom();
        }
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
        pendingImageSrc: "",
        pendingImageName: ""
      });
    },
    onClearImage: function _onClearImage() {
      this._pendingImageBlob = null;
      this._setModel({
        pendingImageSrc: "",
        pendingImageName: ""
      });
    },
    // ─── Drop / Paste / Attach image ────────────────────────────────────────────
    onAttach: function _onAttach() {
      this._fileInput?.click();
    },
    onCapture: async function _onCapture() {
      if (!navigator.mediaDevices?.getUserMedia) {
        MessageToast.show("Camera access is not supported in this browser.");
        return;
      }
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment"
          },
          audio: false
        });
      } catch {
        MessageToast.show("Could not access camera. Please allow camera permission.");
        return;
      }
      this._cameraStream = stream;

      // Build a small camera-preview dialog using a native <video> via sap.ui.core.HTML
      const videoHtml = new HTML({
        content: '<div style="text-align:center"><video id="__cameraPreview" autoplay playsinline muted style="max-width:100%;max-height:360px;border-radius:4px"></video></div>'
      });
      const snapBtn = new Button({
        text: "Take Photo",
        type: "Emphasized",
        press: () => {
          const video = document.getElementById("__cameraPreview");
          if (!video) return;
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          canvas.toBlob(blob => {
            if (blob) {
              const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
              this._setImageBlob(blob, `photo-${ts}.jpg`);
              cameraDialog.close();
            }
          }, "image/jpeg", 0.92);
        }
      });
      const cameraDialog = new Dialog({
        title: "Take a Photo",
        contentWidth: "480px",
        content: [videoHtml],
        beginButton: snapBtn,
        endButton: new Button({
          text: "Cancel",
          press: () => cameraDialog.close()
        }),
        afterClose: () => {
          this._stopCameraStream();
          cameraDialog.destroy();
        }
      });
      this.getView().addDependent(cameraDialog);
      cameraDialog.open();

      // Attach stream to the video element after the dialog renders
      setTimeout(() => {
        const video = document.getElementById("__cameraPreview");
        if (video) video.srcObject = stream;
      }, 100);
    },
    _stopCameraStream: function _stopCameraStream() {
      this._cameraStream?.getTracks().forEach(t => t.stop());
      this._cameraStream = null;
    },
    _attachDomHandlers: function _attachDomHandlers() {
      const composer = this.byId("composerInput");
      if (!composer || this._dropHandler) return; // already attached

      // Hidden file input for the attach button (supports gallery + camera on mobile)
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";
      fileInput.addEventListener("change", () => {
        const file = fileInput.files?.[0];
        if (file) this._setImageBlob(file);
        fileInput.value = ""; // reset so the same file can be re-selected
      });
      document.body.appendChild(fileInput);
      this._fileInput = fileInput;
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
      this._keydownHandler = e => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          // Flush the current textarea value into the model — the two-way binding
          // only updates on change (focus loss), so the model may lag behind.
          const composer = this.byId("composerInput");
          this._setModel({
            inputText: composer.getValue()
          });
          void this.onSend();
        }
      };
      composer.attachBrowserEvent("dragover", e => e.preventDefault());
      composer.attachBrowserEvent("drop", this._dropHandler);
      composer.attachBrowserEvent("paste", this._pasteHandler);
      composer.attachBrowserEvent("keydown", this._keydownHandler);
    },
    _detachDomHandlers: function _detachDomHandlers() {
      const composer = this.byId("composerInput");
      if (composer) {
        if (this._dropHandler) composer.detachBrowserEvent("drop", this._dropHandler);
        if (this._pasteHandler) composer.detachBrowserEvent("paste", this._pasteHandler);
        if (this._keydownHandler) composer.detachBrowserEvent("keydown", this._keydownHandler);
      }
      this._dropHandler = null;
      this._pasteHandler = null;
      this._keydownHandler = null;
      this._fileInput?.remove();
      this._fileInput = null;
    },
    _setImageBlob: function _setImageBlob(blob, name) {
      this._pendingImageBlob = blob;
      const src = URL.createObjectURL(blob);
      const displayName = name ?? (blob instanceof File ? blob.name : "image");
      this._setModel({
        pendingImageSrc: src,
        pendingImageName: displayName
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

      // Snapshot the text that's already in the box at the moment recording starts
      // so that onresult appends to it — not to the text that onresult itself wrote
      // on a previous recording session.
      const textBeforeRecording = state.inputText;
      rec.onresult = event => {
        const transcript = event.results[0][0].transcript;
        this._setModel({
          inputText: (textBeforeRecording + " " + transcript).trim()
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
    // ─── Code view ─────────────────────────────────────────────────────────────
    onToggleCode: function _onToggleCode() {
      const model = this.getView().getModel("promptModel");
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
      const el = scroller?.getDomRef();
      if (el) scroller.scrollTo(0, el.scrollHeight, 0);
    }
  });
  return PromptController;
});
//# sourceMappingURL=Prompt-dbg.controller.js.map
