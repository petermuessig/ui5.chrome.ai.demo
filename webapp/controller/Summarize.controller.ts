import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import VBox from "sap/m/VBox";
import Label from "sap/m/Label";
import Select from "sap/m/Select";
import TextArea from "sap/m/TextArea";
import { TextArea$LiveChangeEvent } from "sap/m/TextArea";
import Item from "sap/ui/core/Item";
import { checkSummarizerAvailability, makeMonitor } from "../model/ai";

interface SummarizeState {
	inputText: string;
	outputText: string;
	busy: boolean;
	canSummarize: boolean;
	unavailable: boolean;
	unavailableText: string;
	downloading: boolean;
	downloadingText: string;
	downloadProgress: number;
	showCode: boolean;
	code: string;
	// settings
	type: "tldr" | "key-points" | "teaser" | "headline";
	format: "markdown" | "plain-text";
	length: "short" | "medium" | "long";
	sharedContext: string;
}

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
 * @alias ui5.chrome.ai.demo.controller.Summarize
 */
export default class SummarizeController extends BaseController {
	private _summarizer: Summarizer | null = null;
	private _settingsDialog: Dialog | null = null;
	private _keydownHandler: ((e: KeyboardEvent) => void) | null = null;

	private _state: SummarizeState = {
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

	public onInit(): void {
		const model = new JSONModel(this._state);
		this.getView().setModel(model, "summarizeModel");
		void this._checkAvailability();
	}

	public onAfterRendering(): void {
		const inputTA = this.byId("inputText") as TextArea;
		if (!inputTA || this._keydownHandler) return;
		this._keydownHandler = (e: KeyboardEvent) => {
			if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				void this.onSummarize();
			}
		};
		inputTA.attachBrowserEvent("keydown", this._keydownHandler as EventListener);
	}

	public onExit(): void {
		if (this._keydownHandler) {
			const inputTA = this.byId("inputText") as TextArea;
			inputTA?.detachBrowserEvent("keydown", this._keydownHandler as EventListener);
			this._keydownHandler = null;
		}
		this._summarizer?.destroy();
		this._settingsDialog?.destroy();
	}

	private async _checkAvailability(): Promise<void> {
		const status = await checkSummarizerAvailability();
		if (status === "unavailable") {
			this._setModel({
				unavailable: true,
				unavailableText: "Chrome Built-in AI Summarizer is not available in this browser. Please use Chrome 138+.",
				canSummarize: false
			});
		}
	}

	private async _initSummarizer(): Promise<boolean> {
		this._summarizer?.destroy();
		this._summarizer = null;

		const model = this.getView().getModel("summarizeModel") as JSONModel;
		const state = model.getData() as SummarizeState;

		const onProgress = (loaded: number) => {
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
			this._setModel({ downloading: false, unavailable: false });
			return true;
		} catch (e) {
			this._setModel({
				unavailable: true,
				unavailableText: `Failed to initialize Summarizer: ${String(e)}`
			});
			return false;
		}
	}

	public onInputChange(event: TextArea$LiveChangeEvent): void {
		const text = event.getParameter("value");
		this._setModel({ inputText: text, canSummarize: text.trim().length > 0 });
	}

	public async onSummarize(): Promise<void> {
		const model = this.getView().getModel("summarizeModel") as JSONModel;
		const state = model.getData() as SummarizeState;
		if (!state.inputText.trim()) return;

		this._setModel({ busy: true, outputText: "" });

		if (!this._summarizer) {
			const ok = await this._initSummarizer();
			if (!ok) {
				this._setModel({ busy: false });
				return;
			}
		}

		try {
			// Use streaming for live output.
			// summarizeStreaming yields incremental delta chunks, so we accumulate.
			const stream = this._summarizer!.summarizeStreaming(state.inputText);
			let result = "";
			for await (const chunk of stream) {
				result += chunk;
				this._setModel({ outputText: result });
			}
		} catch (e) {
			MessageBox.error(`Summarization failed: ${String(e)}`);
		} finally {
			this._setModel({ busy: false });
		}
	}

	// ─── Code view ─────────────────────────────────────────────────────────────

	public onToggleCode(): void {
		const model = this.getView().getModel("summarizeModel") as JSONModel;
		this._setModel({ showCode: !(model.getData() as SummarizeState).showCode });
	}

	// ─── Settings dialog ────────────────────────────────────────────────────────

	public onOpenSettings(): void {
		if (!this._settingsDialog) {
			this._settingsDialog = this._buildSettingsDialog();
		}
		this._settingsDialog.open();
	}

	private _buildSettingsDialog(): Dialog {
		const typeSelect = new Select({ selectedKey: "{summarizeModel>/type}" });
		typeSelect.addItem(new Item({ key: "key-points", text: "Key Points" }));
		typeSelect.addItem(new Item({ key: "tldr", text: "TL;DR" }));
		typeSelect.addItem(new Item({ key: "teaser", text: "Teaser" }));
		typeSelect.addItem(new Item({ key: "headline", text: "Headline" }));

		const formatSelect = new Select({ selectedKey: "{summarizeModel>/format}" });
		formatSelect.addItem(new Item({ key: "plain-text", text: "Plain Text" }));
		formatSelect.addItem(new Item({ key: "markdown", text: "Markdown" }));

		const lengthSelect = new Select({ selectedKey: "{summarizeModel>/length}" });
		lengthSelect.addItem(new Item({ key: "short", text: "Short" }));
		lengthSelect.addItem(new Item({ key: "medium", text: "Medium" }));
		lengthSelect.addItem(new Item({ key: "long", text: "Long" }));

		const contextArea = new TextArea({
			value: "{summarizeModel>/sharedContext}",
			placeholder: 'e.g. "A news article summary for a busy reader"',
			rows: 3,
			width: "100%"
		});

		const dialog = new Dialog({
			title: "Summarizer Settings",
			contentWidth: "400px",
			content: [
				new VBox({
					items: [
						new Label({ text: "Summary Type" }),
						typeSelect,
						new Label({ text: "Output Format" }).addStyleClass("sapUiSmallMarginTop"),
						formatSelect,
						new Label({ text: "Length" }).addStyleClass("sapUiSmallMarginTop"),
						lengthSelect,
						new Label({ text: "Context hint (optional)" }).addStyleClass("sapUiSmallMarginTop"),
						contextArea
					]
				})
			],
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
	}

	private _setModel(partial: Partial<SummarizeState>): void {
		const model = this.getView().getModel("summarizeModel") as JSONModel;
		const current = model.getData() as SummarizeState;
		model.setData({ ...current, ...partial });
	}
}
