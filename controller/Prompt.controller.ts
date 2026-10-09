import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import VBox from "sap/m/VBox";
import Label from "sap/m/Label";
import TextArea from "sap/m/TextArea";
import Slider from "sap/m/Slider";
import ScrollContainer from "sap/m/ScrollContainer";
import { checkLanguageModelAvailability, makeMonitor } from "../model/ai";

interface ChatMessage {
	role: string;
	text: string;
}

interface PromptState {
	messages: ChatMessage[];
	inputText: string;
	pendingImageSrc: string;
	busy: boolean;
	unavailable: boolean;
	unavailableText: string;
	downloading: boolean;
	downloadingText: string;
	downloadProgress: number;
	listening: boolean;
	// settings
	systemPrompt: string;
	temperature: number;
	topK: number;
	maxTemperature: number;
	maxTopK: number;
}

/**
 * @namespace ui5.chrome.ai.demo.controller
 */
export default class PromptController extends BaseController {
	private _session: LanguageModel | null = null;
	private _settingsDialog: Dialog | null = null;
	private _pendingImageBlob: Blob | null = null;
	private _recognition: { start(): void; stop(): void; abort(): void; onresult: ((e: SpeechRecognitionEvent) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string } | null = null;
	private _dropHandler: ((e: DragEvent) => void) | null = null;
	private _pasteHandler: ((e: ClipboardEvent) => void) | null = null;

	private _state: PromptState = {
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

	public onInit(): void {
		const model = new JSONModel(this._state);
		this.getView().setModel(model, "promptModel");
		void this._checkAvailability();
	}

	public onAfterRendering(): void {
		this._attachDomHandlers();
	}

	public onExit(): void {
		this._session?.destroy();
		this._settingsDialog?.destroy();
		this._recognition?.abort();
		this._detachDomHandlers();
	}

	// ─── Availability & session init ────────────────────────────────────────────

	private async _checkAvailability(): Promise<void> {
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
	}

	private async _initSession(): Promise<boolean> {
		this._session?.destroy();
		this._session = null;

		const model = this.getView().getModel("promptModel") as JSONModel;
		const state = model.getData() as PromptState;

		const onProgress = (loaded: number) => {
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
				initialPrompts: state.systemPrompt
					? [{ role: "system", content: state.systemPrompt }]
					: undefined,
				expectedInputs: hasImages
					? [{ type: "text" }, { type: "image" }]
					: [{ type: "text" }],
				monitor
			});
			this._setModel({ downloading: false, unavailable: false });
			return true;
		} catch (e) {
			this._setModel({
				unavailable: true,
				unavailableText: `Failed to initialize LanguageModel: ${String(e)}`
			});
			return false;
		}
	}

	// ─── Send message ───────────────────────────────────────────────────────────

	public async onSend(): Promise<void> {
		const model = this.getView().getModel("promptModel") as JSONModel;
		const state = model.getData() as PromptState;
		const inputText = state.inputText.trim();
		if (!inputText && !this._pendingImageBlob) return;

		// Add user message to transcript
		const userMsg: ChatMessage = {
			role: "You",
			text: inputText + (this._pendingImageBlob ? " [image attached]" : "")
		};
		const messages = [...state.messages, userMsg];
		this._setModel({ messages, inputText: "", busy: true });

		// Prepare assistant placeholder
		const assistantMsg: ChatMessage = { role: "Assistant", text: "" };
		this._setModel({ messages: [...messages, assistantMsg] });

		if (!this._session) {
			const ok = await this._initSession();
			if (!ok) {
				this._setModel({ busy: false });
				return;
			}
		}

		try {
			let promptInput: Parameters<LanguageModel["prompt"]>[0];
			if (this._pendingImageBlob) {
				promptInput = [{
					role: "user",
					content: [
						...(inputText ? [{ type: "text" as const, value: inputText }] : []),
						{ type: "image" as const, value: this._pendingImageBlob }
					]
				}];
				this._pendingImageBlob = null;
				this._setModel({ pendingImageSrc: "" });
			} else {
				promptInput = inputText;
			}

			const stream = this._session!.promptStreaming(promptInput);
			let fullText = "";
			for await (const chunk of stream) {
				fullText = chunk; // streaming gives cumulative text
				const updatedMessages = [...(model.getData() as PromptState).messages];
				updatedMessages[updatedMessages.length - 1] = { role: "Assistant", text: fullText };
				this._setModel({ messages: updatedMessages });
			}
			this._scrollToBottom();
		} catch (e) {
			MessageBox.error(`Prompt failed: ${String(e)}`);
			// Remove the empty assistant placeholder
			const updatedMessages = [...(model.getData() as PromptState).messages];
			updatedMessages.pop();
			this._setModel({ messages: updatedMessages });
		} finally {
			this._setModel({ busy: false });
		}
	}

	// ─── Chat management ─────────────────────────────────────────────────────────

	public onClearChat(): void {
		this._session?.destroy();
		this._session = null;
		this._pendingImageBlob = null;
		this._setModel({ messages: [], inputText: "", pendingImageSrc: "" });
	}

	public onClearImage(): void {
		this._pendingImageBlob = null;
		this._setModel({ pendingImageSrc: "" });
	}

	// ─── Drop / Paste image ──────────────────────────────────────────────────────

	private _attachDomHandlers(): void {
		const composerEl = (this.byId("composerInput") as unknown as { getDomRef(): HTMLElement | null }).getDomRef();
		if (!composerEl) return;
		if (this._dropHandler) return; // already attached

		this._dropHandler = (e: DragEvent) => {
			e.preventDefault();
			const file = e.dataTransfer?.files?.[0];
			if (file && file.type.startsWith("image/")) {
				this._setImageBlob(file);
			}
		};
		this._pasteHandler = (e: ClipboardEvent) => {
			const items = Array.from(e.clipboardData?.items ?? []);
			const imgItem = items.find(i => i.type.startsWith("image/"));
			if (imgItem) {
				e.preventDefault();
				const blob = imgItem.getAsFile();
				if (blob) this._setImageBlob(blob);
			}
		};

		composerEl.addEventListener("dragover", (e) => e.preventDefault());
		composerEl.addEventListener("drop", this._dropHandler);
		composerEl.addEventListener("paste", this._pasteHandler);
	}

	private _detachDomHandlers(): void {
		const composerEl = (this.byId("composerInput") as unknown as { getDomRef?(): HTMLElement | null })?.getDomRef?.();
		if (composerEl && this._dropHandler) {
			composerEl.removeEventListener("drop", this._dropHandler);
		}
		if (composerEl && this._pasteHandler) {
			composerEl.removeEventListener("paste", this._pasteHandler);
		}
		this._dropHandler = null;
		this._pasteHandler = null;
	}

	private _setImageBlob(blob: Blob): void {
		this._pendingImageBlob = blob;
		const src = URL.createObjectURL(blob);
		this._setModel({ pendingImageSrc: src });
		// Destroy session so it is re-created with expectedInputs including 'image'
		this._session?.destroy();
		this._session = null;
	}

	// ─── Voice input ─────────────────────────────────────────────────────────────

	public onMicToggle(): void {
		const model = this.getView().getModel("promptModel") as JSONModel;
		const state = model.getData() as PromptState;

		if (state.listening) {
			this._recognition?.stop();
			this._setModel({ listening: false });
			return;
		}

		type SpeechRecCtor = new () => {
			start(): void; stop(): void; abort(): void;
			continuous: boolean; interimResults: boolean; lang: string;
			onresult: ((e: SpeechRecognitionEvent) => void) | null;
			onend: (() => void) | null;
			onerror: (() => void) | null;
		};
		const SpeechRec: SpeechRecCtor | undefined =
			(window as unknown as { SpeechRecognition?: SpeechRecCtor }).SpeechRecognition
			?? (window as unknown as { webkitSpeechRecognition?: SpeechRecCtor }).webkitSpeechRecognition;

		if (!SpeechRec) {
			MessageBox.warning("Voice input is not supported in this browser.");
			return;
		}

		const rec = new SpeechRec();
		rec.continuous = false;
		rec.interimResults = false;
		rec.lang = "en-US";

		rec.onresult = (event: SpeechRecognitionEvent) => {
			const transcript = event.results[0][0].transcript;
			const current = (this.getView().getModel("promptModel") as JSONModel).getData() as PromptState;
			this._setModel({ inputText: (current.inputText + " " + transcript).trim() });
		};
		rec.onend = () => this._setModel({ listening: false });
		rec.onerror = () => this._setModel({ listening: false });

		rec.start();
		this._recognition = rec;
		this._setModel({ listening: true });
	}

	// ─── Settings dialog ────────────────────────────────────────────────────────

	public onOpenSettings(): void {
		if (!this._settingsDialog) {
			this._settingsDialog = this._buildSettingsDialog();
		}
		this._settingsDialog.open();
	}

	private _buildSettingsDialog(): Dialog {
		const model = this.getView().getModel("promptModel") as JSONModel;
		const state = model.getData() as PromptState;

		const systemInput = new TextArea({
			value: state.systemPrompt,
			placeholder: 'e.g. "You are a helpful assistant."',
			rows: 3,
			width: "100%"
		});

		const tempLabel = new Label({ text: `Temperature: ${state.temperature.toFixed(1)}` });
		const tempSlider = new Slider({
			value: state.temperature,
			min: 0,
			max: state.maxTemperature,
			step: 0.1,
			liveChange: (e: { getParameter(p: string): number }) => {
				const v = e.getParameter("value");
				tempLabel.setText(`Temperature: ${v.toFixed(1)}`);
			}
		});

		const topKLabel = new Label({ text: `Top-K: ${state.topK}` });
		const topKSlider = new Slider({
			value: state.topK,
			min: 1,
			max: state.maxTopK,
			step: 1,
			liveChange: (e: { getParameter(p: string): number }) => {
				const v = e.getParameter("value");
				topKLabel.setText(`Top-K: ${v}`);
			}
		});

		const dialog = new Dialog({
			title: "Prompt Settings",
			contentWidth: "400px",
			content: [
				new VBox({
					items: [
						new Label({ text: "System Prompt" }),
						systemInput,
						tempLabel,
						tempSlider,
						topKLabel,
						topKSlider
					]
				})
			],
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
	}

	// ─── Helpers ────────────────────────────────────────────────────────────────

	private _setModel(partial: Partial<PromptState>): void {
		const model = this.getView().getModel("promptModel") as JSONModel;
		const current = model.getData() as PromptState;
		model.setData({ ...current, ...partial });
	}

	private _scrollToBottom(): void {
		const scroller = this.byId("chatScroll") as ScrollContainer;
		scroller?.scrollTo?.(0, 9999, 200);
	}
}
