import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import {
	checkLanguageDetectorAvailability,
	checkTranslatorAvailability,
	checkSummarizerAvailability,
	checkLanguageModelAvailability,
	AvailabilityStatus
} from "../model/ai";

interface ApiStatus {
	status: AvailabilityStatus;
	text: string;
	state: string; // UI5 ValueState: Success | Warning | Information | Error | None
}

interface HelpState {
	detector: ApiStatus;
	translator: ApiStatus;
	summarizer: ApiStatus;
	languageModel: ApiStatus;
}

function statusToUi(s: AvailabilityStatus): ApiStatus {
	switch (s) {
		case "available":    return { status: s, text: "Available",      state: "Success" };
		case "downloadable": return { status: s, text: "Needs download", state: "Warning" };
		case "downloading":  return { status: s, text: "Downloading…",   state: "Information" };
		default:             return { status: s, text: "Unavailable",    state: "Error" };
	}
}

const CHECKING: ApiStatus = { status: "unavailable", text: "Checking…", state: "None" };

/**
 * @namespace ui5.chrome.ai.demo.controller
 */
export default class HelpController extends BaseController {
	private _helpModel!: JSONModel;

	public onInit(): void {
		const initial: HelpState = {
			detector:      { ...CHECKING },
			translator:    { ...CHECKING },
			summarizer:    { ...CHECKING },
			languageModel: { ...CHECKING }
		};
		this._helpModel = new JSONModel(initial);
		this.setModel(this._helpModel, "helpModel");
		void this._refreshStatus();
	}

	public onRefreshStatus(): void {
		void this._refreshStatus();
	}

	private async _refreshStatus(): Promise<void> {
		// Reset to "Checking…" while checks run
		const state = this._helpModel.getData() as HelpState;
		this._helpModel.setData({
			...state,
			detector:      { ...CHECKING },
			translator:    { ...CHECKING },
			summarizer:    { ...CHECKING },
			languageModel: { ...CHECKING }
		});

		const [det, trans, sum, lm] = await Promise.all([
			checkLanguageDetectorAvailability(),
			checkTranslatorAvailability("en", "de"),
			checkSummarizerAvailability(),
			checkLanguageModelAvailability()
		]);

		this._helpModel.setData({
			detector:      statusToUi(det),
			translator:    statusToUi(trans),
			summarizer:    statusToUi(sum),
			languageModel: statusToUi(lm)
		});
	}
}
