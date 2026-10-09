import View from "sap/ui/core/mvc/View";
import Controller from "sap/ui/core/mvc/Controller";
import Control from "sap/ui/core/Control";
import Page from "sap/m/Page";
import Button from "sap/m/Button";
import VBox from "sap/m/VBox";
import Label from "sap/m/Label";
import TextArea from "sap/m/TextArea";
import MessageStrip from "sap/m/MessageStrip";
import ProgressIndicator from "sap/m/ProgressIndicator";
import { If } from "ui5/community/jsx/runtime/runtime/runtime";
import SummarizeController from "../controller/Summarize.controller";

/**
 * @namespace ui5.chrome.ai.demo.view
 */
class Summarize extends View {
	constructor() {
		super();
		(this as unknown as { controllerName: string }).controllerName = "ui5.chrome.ai.demo.controller.Summarize";
	}

	getAutoPrefixId(): boolean {
		return true;
	}

	getControllerModuleName(): string {
		return "ui5.chrome.ai.demo.controller.Summarize";
	}

	createContent(): Control | Control[] | Promise<Control | Control[]> {
		const ctrl = this.getController() as SummarizeController;

		return <Page
			id="summarizePage"
			title="Summarize"
			showNavButton={true}
			navButtonPress={ctrl.onNavBack.bind(ctrl)}
			headerContent={[
				<Button
					icon="sap-icon://action-settings"
					tooltip="Settings"
					press={ctrl.onOpenSettings.bind(ctrl)}
				/>
			]}
		>
			<VBox class="sapUiSmallMargin" fitContainer={true}>
				<If condition="{summarizeModel>/unavailable}">
					<MessageStrip
						id="unavailableStrip"
						text="{summarizeModel>/unavailableText}"
						type="Error"
						showIcon={true}
						class="sapUiSmallMarginBottom"
					/>
				</If>
				<If condition="{summarizeModel>/downloading}">
					<VBox class="sapUiSmallMarginBottom">
						<Label text="{summarizeModel>/downloadingText}" />
						<ProgressIndicator
							percentValue="{summarizeModel>/downloadProgress}"
							displayValue="{summarizeModel>/downloadProgress}%"
							state="Information"
						/>
					</VBox>
				</If>

				<Label text="Input text" class="sapUiSmallMarginBottom" />
				<TextArea
					id="inputText"
					placeholder="Paste the text you want to summarize here..."
					rows={12}
					growing={true}
					width="100%"
					class="sapUiSmallMarginBottom"
					liveChange={ctrl.onInputChange.bind(ctrl)}
				/>

				<Button
					id="summarizeBtn"
					text="Summarize"
					type="Emphasized"
					enabled="{summarizeModel>/canSummarize}"
					busy="{summarizeModel>/busy}"
					press={ctrl.onSummarize.bind(ctrl)}
					class="sapUiSmallMarginBottom"
				/>

				<Label text="Summary" class="sapUiSmallMarginBottom" />
				<TextArea
					id="outputText"
					placeholder="Summary will appear here..."
					rows={10}
					width="100%"
					editable={false}
					value="{summarizeModel>/outputText}"
				/>
			</VBox>
		</Page>;
	}
}

export default Summarize;
