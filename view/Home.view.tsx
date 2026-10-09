import View from "sap/ui/core/mvc/View";
import Controller from "sap/ui/core/mvc/Controller";
import Control from "sap/ui/core/Control";
import Page from "sap/m/Page";
import VBox from "sap/m/VBox";
import FlexBox from "sap/m/FlexBox";
import GenericTile from "sap/m/GenericTile";
import TileContent from "sap/m/TileContent";
import NumericContent from "sap/m/NumericContent";
import Text from "sap/m/Text";
import Title from "sap/m/Title";
import HomeController from "../controller/Home.controller";

/**
 * @namespace ui5.chrome.ai.demo.view
 */
class Home extends View {
	constructor() {
		super();
		(this as unknown as { controllerName: string }).controllerName = "ui5.chrome.ai.demo.controller.Home";
	}

	getAutoPrefixId(): boolean {
		return true;
	}

	getControllerModuleName(): string {
		return "ui5.chrome.ai.demo.controller.Home";
	}

	createContent(): Control | Control[] | Promise<Control | Control[]> {
		const ctrl = this.getController() as HomeController;

		return <Page
			id="homePage"
			title="Chrome Built-in AI"
			showNavButton={false}
		>
			<VBox alignItems="Center" justifyContent="Center" class="sapUiSmallMargin">
				<Title
					text="On-device AI powered by Gemini Nano"
					level="H3"
					class="sapUiSmallMarginBottom"
				/>
				<FlexBox wrap="Wrap" justifyContent="Center" alignItems="Center">
					<GenericTile
						id="tileTranslate"
						header="Translate"
						subheader="Language Detector & Translator API"
						frameType="TwoByOne"
						press={ctrl.onNavToTranslate.bind(ctrl)}
						class="sapUiSmallMargin"
					>
						<TileContent>
							<NumericContent
								value="🌐"
								withMargin={false}
							/>
						</TileContent>
					</GenericTile>
					<GenericTile
						id="tileSummarize"
						header="Summarize"
						subheader="Summarizer API"
						frameType="TwoByOne"
						press={ctrl.onNavToSummarize.bind(ctrl)}
						class="sapUiSmallMargin"
					>
						<TileContent>
							<NumericContent
								value="📄"
								withMargin={false}
							/>
						</TileContent>
					</GenericTile>
					<GenericTile
						id="tilePrompt"
						header="Prompt"
						subheader="LanguageModel (Gemini Nano)"
						frameType="TwoByOne"
						press={ctrl.onNavToPrompt.bind(ctrl)}
						class="sapUiSmallMargin"
					>
						<TileContent>
							<NumericContent
								value="💬"
								withMargin={false}
							/>
						</TileContent>
					</GenericTile>
				</FlexBox>
				<Text
					text="Runs entirely in Chrome — no server, no API key, no data leaves your device."
					class="sapUiSmallMarginTop sapUiSmallMarginBottom"
				/>
			</VBox>
		</Page>;
	}
}

export default Home;
