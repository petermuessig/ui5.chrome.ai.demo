import View from "sap/ui/core/mvc/View";
import Controller from "sap/ui/core/mvc/Controller";
import Control from "sap/ui/core/Control";
import Page from "sap/m/Page";
import Button from "sap/m/Button";
import VBox from "sap/m/VBox";
import HBox from "sap/m/HBox";
import FlexBox from "sap/m/FlexBox";
import TextArea from "sap/m/TextArea";
import FeedListItem from "sap/m/FeedListItem";
import List from "sap/m/List";
import ScrollContainer from "sap/m/ScrollContainer";
import MessageStrip from "sap/m/MessageStrip";
import ProgressIndicator from "sap/m/ProgressIndicator";
import Label from "sap/m/Label";
import Image from "sap/m/Image";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import ToolbarSeparator from "sap/m/ToolbarSeparator";
import { If } from "ui5/community/jsx/runtime/runtime/runtime";
import PromptController from "../controller/Prompt.controller";

/**
 * @namespace ui5.chrome.ai.demo.view
 */
class Prompt extends View {
	constructor() {
		super();
		(this as unknown as { controllerName: string }).controllerName = "ui5.chrome.ai.demo.controller.Prompt";
	}

	getAutoPrefixId(): boolean {
		return true;
	}

	getControllerModuleName(): string {
		return "ui5.chrome.ai.demo.controller.Prompt";
	}

	createContent(): Control | Control[] | Promise<Control | Control[]> {
		const ctrl = this.getController() as PromptController;

		return <Page
			id="promptPage"
			title="Prompt (Chat)"
			showNavButton={true}
			navButtonPress={ctrl.onNavBack.bind(ctrl)}
			headerContent={[
				<Button
					icon="sap-icon://delete"
					tooltip="Clear chat"
					press={ctrl.onClearChat.bind(ctrl)}
				/>,
				<Button
					icon="sap-icon://action-settings"
					tooltip="Settings"
					press={ctrl.onOpenSettings.bind(ctrl)}
				/>
			]}
		>
			<VBox fitContainer={true} class="sapUiSmallMargin" height="100%">
				<If condition="{promptModel>/unavailable}">
					<MessageStrip
						id="unavailableStrip"
						text="{promptModel>/unavailableText}"
						type="Error"
						showIcon={true}
						class="sapUiSmallMarginBottom"
					/>
				</If>
				<If condition="{promptModel>/downloading}">
					<VBox class="sapUiSmallMarginBottom">
						<Label text="{promptModel>/downloadingText}" />
						<ProgressIndicator
							percentValue="{promptModel>/downloadProgress}"
							displayValue="{promptModel>/downloadProgress}%"
							state="Information"
						/>
					</VBox>
				</If>

				{/* Chat transcript */}
				<ScrollContainer
					id="chatScroll"
					height="100%"
					width="100%"
					horizontal={false}
					vertical={true}
					focusable={false}
				>
					<List
						id="chatList"
						showNoData={false}
						items={{
							path: "promptModel>/messages",
							template: new FeedListItem({
								sender: "{promptModel>role}",
								text: "{promptModel>text}",
								showIcon: false
							} as object)
						}}
					/>
				</ScrollContainer>

				{/* Pending image thumbnail */}
				<If condition="{promptModel>/pendingImageSrc}">
					<HBox alignItems="Center" class="sapUiSmallMarginTop">
						<Image
							id="pendingImageThumb"
							src="{promptModel>/pendingImageSrc}"
							width="80px"
							height="80px"
						/>
						<Button
							icon="sap-icon://decline"
							tooltip="Remove image"
							press={ctrl.onClearImage.bind(ctrl)}
							type="Transparent"
						/>
					</HBox>
				</If>

				{/* Composer bar */}
				<OverflowToolbar
					id="composerBar"
					class="sapUiSmallMarginTop"
				>
					<Button
						id="micBtn"
						icon="{= ${promptModel>/listening} ? 'sap-icon://stop' : 'sap-icon://microphone' }"
						tooltip="{= ${promptModel>/listening} ? 'Stop recording' : 'Voice input' }"
						type="{= ${promptModel>/listening} ? 'Attention' : 'Default' }"
						press={ctrl.onMicToggle.bind(ctrl)}
					/>
					<TextArea
						id="composerInput"
						placeholder="Type a message, or drop / paste an image..."
						rows={2}
						growing={true}
						growingMaxLines={6}
						width="100%"
						value="{promptModel>/inputText}"
					/>
					<ToolbarSeparator />
					<Button
						id="sendBtn"
						icon="sap-icon://paper-plane"
						tooltip="Send"
						type="Emphasized"
						enabled="{= ${promptModel>/inputText}.trim().length > 0 || !!${promptModel>/pendingImageSrc} }"
						busy="{promptModel>/busy}"
						press={ctrl.onSend.bind(ctrl)}
					/>
				</OverflowToolbar>
			</VBox>
		</Page>;
	}
}

export default Prompt;
