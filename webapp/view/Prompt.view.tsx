import View from "sap/ui/core/mvc/View";
import Controller from "sap/ui/core/mvc/Controller";
import Control from "sap/ui/core/Control";
import Page from "sap/m/Page";
import Button from "sap/m/Button";
import VBox from "sap/m/VBox";
import HBox from "sap/m/HBox";
import FlexBox from "sap/m/FlexBox";
import FlexItemData from "sap/m/FlexItemData";
import TextArea from "sap/m/TextArea";
import FeedListItem from "sap/m/FeedListItem";
import List from "sap/m/List";
import ScrollContainer from "sap/m/ScrollContainer";
import MessageStrip from "sap/m/MessageStrip";
import ProgressIndicator from "sap/m/ProgressIndicator";
import Label from "sap/m/Label";
import Link from "sap/m/Link";
import Image from "sap/m/Image";
import CodeEditor from "sap/ui/codeeditor/CodeEditor";
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
			enableScrolling={false}
			class="sapUiContentPadding"
			headerContent={[
				<Button
					icon="{= ${promptModel>/showCode} ? 'sap-icon://media-play' : 'sap-icon://source-code' }"
					tooltip="{= ${promptModel>/showCode} ? 'Show demo' : 'Show code' }"
					press={ctrl.onToggleCode.bind(ctrl)}
				/>,
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
			{/* ── Demo view ──────────────────────────────────────────────── */}
			<FlexBox
				direction="Column"
				fitContainer={true}
				visible="{= !${promptModel>/showCode} }"
				class="chatFlexColumn"
			>
				{/* Unavailable / download strips */}
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

				{/* Chat transcript — grows to fill available space */}
				<ScrollContainer
					id="chatScroll"
					width="100%"
					horizontal={false}
					vertical={true}
					focusable={false}
					class="chatScrollFill"
					layoutData={new FlexItemData({ growFactor: 1, shrinkFactor: 1, baseSize: "0" })}
				>
					<List
						id="chatList"
						showNoData={false}
						items={{
							path: "promptModel>/messages",
							template: new FeedListItem({
								sender: "{promptModel>role}",
								text: "{promptModel>text}",
								showIcon: false,
								senderActive: false,
								maxCharacters: 99999
							} as object)
						}}
					/>
				</ScrollContainer>

				{/* Pending image chip */}
				<If condition="{promptModel>/pendingImageSrc}">
					<HBox alignItems="Center" class="sapUiTinyMarginTop attachmentChip">
						<Image
							id="pendingImageThumb"
							src="{promptModel>/pendingImageSrc}"
							width="48px"
							height="48px"
							densityAware={false}
							class="attachmentThumb"
						/>
						<Label
							text="{promptModel>/pendingImageName}"
							class="sapUiSmallMarginBegin attachmentLabel"
						/>
						<Button
							icon="sap-icon://decline"
							tooltip="Remove image"
							press={ctrl.onClearImage.bind(ctrl)}
							type="Transparent"
						/>
					</HBox>
				</If>

				{/* Composer bar — stays at the bottom */}
				<HBox
					id="composerBar"
					alignItems="Center"
					class="sapUiTinyMarginTop"
					layoutData={new FlexItemData({ growFactor: 0, shrinkFactor: 0 })}
				>
					<Button
						id="micBtn"
						icon="{= ${promptModel>/listening} ? 'sap-icon://stop' : 'sap-icon://microphone' }"
						tooltip="{= ${promptModel>/listening} ? 'Stop recording' : 'Voice input' }"
						type="{= ${promptModel>/listening} ? 'Attention' : 'Default' }"
						press={ctrl.onMicToggle.bind(ctrl)}
					/>
					<Button
						id="attachBtn"
						icon="sap-icon://attachment"
						tooltip="Attach image from file"
						press={ctrl.onAttach.bind(ctrl)}
					/>
					<Button
						id="cameraBtn"
						icon="sap-icon://camera"
						tooltip="Take a photo"
						press={ctrl.onCapture.bind(ctrl)}
					/>
					<TextArea
						id="composerInput"
						placeholder="Type a message, or 📎 attach / 📷 capture / paste an image..."
						rows={2}
						growing={true}
						growingMaxLines={6}
						width="100%"
						value="{promptModel>/inputText}"
						layoutData={new FlexItemData({ growFactor: 1 })}
					/>
					<Button
						id="sendBtn"
						icon="sap-icon://paper-plane"
						tooltip="Send"
						type="Emphasized"
						enabled="{= ${promptModel>/inputText}.trim().length > 0 || !!${promptModel>/pendingImageSrc} }"
						busy="{promptModel>/busy}"
						press={ctrl.onSend.bind(ctrl)}
					/>
				</HBox>
			</FlexBox>

			{/* ── Code view ──────────────────────────────────────────────── */}
			<VBox class="sapUiSmallMargin" fitContainer={true} visible="{promptModel>/showCode}">
				<CodeEditor
					type="javascript"
					editable={false}
					lineNumbers={true}
					height="400px"
					width="100%"
					value="{promptModel>/code}"
					class="sapUiSmallMarginBottom"
				/>
				<Link
					text="Chrome Prompt API docs ↗"
					href="https://developer.chrome.com/docs/ai/prompt-api"
					target="_blank"
				/>
			</VBox>
		</Page>;
	}
}

export default Prompt;
