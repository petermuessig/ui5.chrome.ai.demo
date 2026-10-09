import View from "sap/ui/core/mvc/View";
import Control from "sap/ui/core/Control";
import Page from "sap/m/Page";
import Button from "sap/m/Button";
import VBox from "sap/m/VBox";
import HBox from "sap/m/HBox";
import Text from "sap/m/Text";
import ObjectStatus from "sap/m/ObjectStatus";
import Link from "sap/m/Link";
import HelpController from "../controller/Help.controller";

class Help extends View {
	getAutoPrefixId(): boolean {
		return true;
	}

	getControllerModuleName(): string {
		return "ui5/chrome/ai/demo/controller/Help";
	}

	createContent(): Control | Control[] | Promise<Control | Control[]> {
		const ctrl = this.getController() as HelpController;

		return <Page
			id="helpPage"
			title="Setup & Status"
			showNavButton={true}
			navButtonPress={ctrl.onNavBack.bind(ctrl)}
		>
			<VBox class="sapUiSmallMargin">

				{/* ── Live API status ───────────────────────────────────── */}
				<HBox justifyContent="SpaceBetween" alignItems="Center" class="sapUiTinyMarginBottom">
					<Text text="API availability" />
					<Button
						icon="sap-icon://refresh"
						tooltip="Re-check status"
						type="Transparent"
						press={ctrl.onRefreshStatus.bind(ctrl)}
					/>
				</HBox>
				<ObjectStatus
					title="Language Detector"
					text="{helpModel>/detector/text}"
					state="{helpModel>/detector/state}"
					class="sapUiTinyMarginBottom"
				/>
				<ObjectStatus
					title="Translator"
					text="{helpModel>/translator/text}"
					state="{helpModel>/translator/state}"
					class="sapUiTinyMarginBottom"
				/>
				<ObjectStatus
					title="Summarizer"
					text="{helpModel>/summarizer/text}"
					state="{helpModel>/summarizer/state}"
					class="sapUiTinyMarginBottom"
				/>
				<ObjectStatus
					title="Prompt (LanguageModel)"
					text="{helpModel>/languageModel/text}"
					state="{helpModel>/languageModel/state}"
					class="sapUiSmallMarginBottom"
				/>

				{/* ── Flag instructions ────────────────────────────────── */}
				<Text
					text="Not available? Enable these flags in Chrome 138+, then relaunch Chrome (copy each path into the address bar — chrome:// links cannot be clicked from a page):"
					class="sapUiTinyMarginBottom"
				/>
				<Text text="chrome://flags/#prompt-api-for-gemini-nano  →  Enabled" />
				<Text text="chrome://flags/#optimization-guide-on-device-model  →  Enabled BypassPerfRequirement" />
				<Text text="chrome://flags/#translation-api  →  Enabled" />
				<Text text="chrome://flags/#language-detection-api  →  Enabled" />
				<Text
					text="chrome://flags/#summarization-api-for-gemini-nano  →  Enabled"
					class="sapUiTinyMarginBottom"
				/>
				<Text
					text="After relaunching, Gemini Nano downloads on first use. Verify or force the download at: chrome://on-device-internals"
					class="sapUiTinyMarginBottom"
				/>
				<Link
					text="Full setup guide ↗"
					href="https://developer.chrome.com/docs/ai/get-started"
					target="_blank"
				/>

			</VBox>
		</Page>;
	}
}

export default Help;
