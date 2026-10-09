import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import VBox from "sap/m/VBox";
import Label from "sap/m/Label";
import Select from "sap/m/Select";
import Item from "sap/ui/core/Item";
import {
	checkLanguageDetectorAvailability,
	checkTranslatorAvailability,
	makeMonitor,
	SUPPORTED_LANGUAGES
} from "../model/ai";
import { TextArea$LiveChangeEvent } from "sap/m/TextArea";

interface TranslateState {
	sourceLang: string;
	targetLang: string;
	sourceText: string;
	targetText: string;
	detectedLangText: string;
	detectedLangCode: string;
	detectedConfidence: number;
	busy: boolean;
	canTranslate: boolean;
	unavailable: boolean;
	unavailableText: string;
	downloading: boolean;
	downloadingText: string;
	downloadProgress: number;
}

/**
 * @namespace ui5.chrome.ai.demo.controller
 */
export default class TranslateController extends BaseController {
	private _detector: LanguageDetector | null = null;
	private _translator: Translator | null = null;
	private _detectTimer: ReturnType<typeof setTimeout> | null = null;
	private _settingsDialog: Dialog | null = null;

	private _state: TranslateState = {
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
		downloadProgress: 0
	};

	public onInit(): void {
		const model = new JSONModel(this._state);
		this.getView().setModel(model, "translateModel");
		void this._checkAvailability();
	}

	public onExit(): void {
		this._detector?.destroy();
		this._translator?.destroy();
		this._settingsDialog?.destroy();
	}

	// ─── Availability ───────────────────────────────────────────────────────────

	private async _checkAvailability(): Promise<void> {
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
	}

	private async _initDetector(): Promise<void> {
		const onProgress = (loaded: number) => {
			this._setModel({
				downloading: true,
				downloadingText: "Downloading Language Detector model...",
				downloadProgress: Math.round(loaded * 100)
			});
		};
		try {
			const monitor = makeMonitor(onProgress);
			this._detector = await LanguageDetector.create({ monitor });
			this._setModel({ downloading: false });
		} catch (e) {
			this._setModel({
				unavailable: true,
				unavailableText: `Failed to initialize Language Detector: ${String(e)}`
			});
		}
	}

	private async _initTranslator(sourceLang: string, targetLang: string): Promise<boolean> {
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

		const onProgress = (loaded: number) => {
			this._setModel({
				downloading: true,
				downloadingText: `Downloading translation model (${sourceLang} → ${targetLang})...`,
				downloadProgress: Math.round(loaded * 100)
			});
		};
		try {
			const monitor = makeMonitor(onProgress);
			this._translator = await Translator.create({ sourceLanguage: sourceLang, targetLanguage: targetLang, monitor });
			this._setModel({ downloading: false, unavailable: false });
			return true;
		} catch (e) {
			this._setModel({
				unavailable: true,
				unavailableText: `Failed to initialize Translator: ${String(e)}`
			});
			return false;
		}
	}

	// ─── UI event handlers ──────────────────────────────────────────────────────

	public onSourceLangChange(): void {
		const select = this.byId("sourceLangSelect") as Select;
		const key = select.getSelectedKey();
		this._setModel({ sourceLang: key });
		this._translator?.destroy();
		this._translator = null;
		void this._detectAndUpdateLabel();
	}

	public onTargetLangChange(): void {
		const select = this.byId("targetLangSelect") as Select;
		const key = select.getSelectedKey();
		this._setModel({ targetLang: key });
		this._translator?.destroy();
		this._translator = null;
	}

	public onSourceTextChange(event: TextArea$LiveChangeEvent): void {
		const text = event.getParameter("value");
		this._setModel({ sourceText: text, canTranslate: text.trim().length > 0 });
		// Debounced auto-detect
		if (this._detectTimer) clearTimeout(this._detectTimer);
		this._detectTimer = setTimeout((): void => { void this._detectAndUpdateLabel(); }, 600);
	}

	private async _detectAndUpdateLabel(): Promise<void> {
		const model = this.getView().getModel("translateModel") as JSONModel;
		const state = model.getData() as TranslateState;
		if (!this._detector || !state.sourceText.trim()) {
			this._setModel({ detectedLangText: "", detectedLangCode: "" });
			return;
		}
		try {
			const results = await this._detector.detect(state.sourceText);
			if (results.length > 0) {
				const best = results[0];
				const confidence = Math.round((best.confidence ?? 0) * 100);
				const langName = this._getLangName(best.detectedLanguage);
				this._setModel({
					detectedLangCode: best.detectedLanguage,
					detectedLangText: state.sourceLang === "auto"
						? `Detected: ${langName} (${confidence}%)`
						: ""
				});
			}
		} catch {
			// silence detection errors
		}
	}

	public async onTranslate(): Promise<void> {
		const model = this.getView().getModel("translateModel") as JSONModel;
		const state = model.getData() as TranslateState;
		if (!state.sourceText.trim()) return;

		let srcLang = state.sourceLang;
		if (srcLang === "auto") {
			srcLang = state.detectedLangCode;
			if (!srcLang) {
				MessageBox.warning("Could not detect the source language. Please select one manually.");
				return;
			}
		}

		this._setModel({ busy: true, targetText: "" });
		const ok = this._translator
			? true
			: await this._initTranslator(srcLang, state.targetLang);

		if (!ok || !this._translator) {
			this._setModel({ busy: false });
			return;
		}

		try {
			const result = await this._translator.translate(state.sourceText);
			this._setModel({ targetText: result });
		} catch (e) {
			MessageBox.error(`Translation failed: ${String(e)}`);
		} finally {
			this._setModel({ busy: false });
		}
	}

	public onSwap(): void {
		const model = this.getView().getModel("translateModel") as JSONModel;
		const state = model.getData() as TranslateState;
		if (state.sourceLang === "auto") return;

		const sourceSel = this.byId("sourceLangSelect") as Select;
		const targetSel = this.byId("targetLangSelect") as Select;

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
		const sourceTA = this.byId("sourceText") as unknown as { setValue(v: string): void };
		sourceTA.setValue(state.targetText);
	}

	// ─── Settings dialog ────────────────────────────────────────────────────────

	public onOpenSettings(): void {
		if (!this._settingsDialog) {
			this._settingsDialog = this._buildSettingsDialog();
		}
		this._settingsDialog.open();
	}

	private _buildSettingsDialog(): Dialog {
		const model = this.getView().getModel("translateModel") as JSONModel;
		const state = model.getData() as TranslateState;

		const srcItems = SUPPORTED_LANGUAGES.map(l =>
			new Item({ key: l.key, text: l.text })
		);
		const tgtItems = SUPPORTED_LANGUAGES.map(l =>
			new Item({ key: l.key, text: l.text })
		);

		const srcSelect = new Select({ selectedKey: state.sourceLang });
		srcSelect.addItem(new Item({ key: "auto", text: "Auto-Detect" }));
		srcItems.forEach(i => srcSelect.addItem(i));

		const tgtSelect = new Select({ selectedKey: state.targetLang });
		tgtItems.forEach(i => tgtSelect.addItem(i));

		const dialog = new Dialog({
			title: "Translator Settings",
			content: [
				new VBox({
					items: [
						new Label({ text: "Source Language" }),
						srcSelect,
						new Label({ text: "Target Language" }).addStyleClass("sapUiSmallMarginTop"),
						tgtSelect
					]
				})
			],
			beginButton: new Button({
				text: "Save",
				type: "Emphasized",
				press: () => {
					const srcKey = srcSelect.getSelectedKey();
					const tgtKey = tgtSelect.getSelectedKey();
					this._setModel({ sourceLang: srcKey, targetLang: tgtKey });
					const sourceSel = this.byId("sourceLangSelect") as Select;
					const targetSel = this.byId("targetLangSelect") as Select;
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
	}

	// ─── Helpers ────────────────────────────────────────────────────────────────

	private _setModel(partial: Partial<TranslateState>): void {
		const model = this.getView().getModel("translateModel") as JSONModel;
		const current = model.getData() as TranslateState;
		model.setData({ ...current, ...partial });
	}

	private _getLangName(code: string): string {
		const found = SUPPORTED_LANGUAGES.find(l => l.key === code);
		return found ? found.text : code;
	}
}
