import View from "sap/ui/core/mvc/View";
import Controller from "sap/ui/core/mvc/Controller";
import Control from "sap/ui/core/Control";
import Page from "sap/m/Page";
import Button from "sap/m/Button";
import Bar from "sap/m/Bar";
import VBox from "sap/m/VBox";
import HBox from "sap/m/HBox";
import FlexBox from "sap/m/FlexBox";
import FlexItemData from "sap/m/FlexItemData";
import Select from "sap/m/Select";
import TextArea from "sap/m/TextArea";
import Label from "sap/m/Label";
import Link from "sap/m/Link";
import MessageStrip from "sap/m/MessageStrip";
import ProgressIndicator from "sap/m/ProgressIndicator";
import Dialog from "sap/m/Dialog";
import SimpleForm from "sap/ui/layout/form/SimpleForm";
import Item from "sap/ui/core/Item";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import CodeEditor from "sap/ui/codeeditor/CodeEditor";
import { If } from "ui5/community/jsx/runtime/runtime/runtime";
import TranslateController from "../controller/Translate.controller";

/**
 * @namespace ui5.chrome.ai.demo.view
 */
class Translate extends View {
	constructor() {
		super();
		(this as unknown as { controllerName: string }).controllerName = "ui5.chrome.ai.demo.controller.Translate";
	}

	getAutoPrefixId(): boolean {
		return true;
	}

	getControllerModuleName(): string {
		return "ui5.chrome.ai.demo.controller.Translate";
	}

	createContent(): Control | Control[] | Promise<Control | Control[]> {
		const ctrl = this.getController() as TranslateController;

		// Source language items (Auto-Detect + all languages)
		const sourceLangSelect = <Select
			id="sourceLangSelect"
			change={ctrl.onSourceLangChange.bind(ctrl)}
		>
			<Item key="auto" text="Auto-Detect" />
			<Item key="ar" text="Arabic" />
			<Item key="bg" text="Bulgarian" />
			<Item key="zh" text="Chinese (Simplified)" />
			<Item key="zh-Hant" text="Chinese (Traditional)" />
			<Item key="cs" text="Czech" />
			<Item key="da" text="Danish" />
			<Item key="nl" text="Dutch" />
			<Item key="en" text="English" />
			<Item key="fi" text="Finnish" />
			<Item key="fr" text="French" />
			<Item key="de" text="German" />
			<Item key="el" text="Greek" />
			<Item key="he" text="Hebrew" />
			<Item key="hi" text="Hindi" />
			<Item key="hu" text="Hungarian" />
			<Item key="id" text="Indonesian" />
			<Item key="it" text="Italian" />
			<Item key="ja" text="Japanese" />
			<Item key="ko" text="Korean" />
			<Item key="no" text="Norwegian" />
			<Item key="pl" text="Polish" />
			<Item key="pt" text="Portuguese" />
			<Item key="ro" text="Romanian" />
			<Item key="ru" text="Russian" />
			<Item key="sk" text="Slovak" />
			<Item key="es" text="Spanish" />
			<Item key="sv" text="Swedish" />
			<Item key="th" text="Thai" />
			<Item key="tr" text="Turkish" />
			<Item key="uk" text="Ukrainian" />
			<Item key="vi" text="Vietnamese" />
		</Select>;

		const targetLangSelect = <Select
			id="targetLangSelect"
			change={ctrl.onTargetLangChange.bind(ctrl)}
		>
			<Item key="de" text="German" />
			<Item key="ar" text="Arabic" />
			<Item key="bg" text="Bulgarian" />
			<Item key="zh" text="Chinese (Simplified)" />
			<Item key="zh-Hant" text="Chinese (Traditional)" />
			<Item key="cs" text="Czech" />
			<Item key="da" text="Danish" />
			<Item key="nl" text="Dutch" />
			<Item key="en" text="English" />
			<Item key="fi" text="Finnish" />
			<Item key="fr" text="French" />
			<Item key="el" text="Greek" />
			<Item key="he" text="Hebrew" />
			<Item key="hi" text="Hindi" />
			<Item key="hu" text="Hungarian" />
			<Item key="id" text="Indonesian" />
			<Item key="it" text="Italian" />
			<Item key="ja" text="Japanese" />
			<Item key="ko" text="Korean" />
			<Item key="no" text="Norwegian" />
			<Item key="pl" text="Polish" />
			<Item key="pt" text="Portuguese" />
			<Item key="ro" text="Romanian" />
			<Item key="ru" text="Russian" />
			<Item key="sk" text="Slovak" />
			<Item key="es" text="Spanish" />
			<Item key="sv" text="Swedish" />
			<Item key="th" text="Thai" />
			<Item key="tr" text="Turkish" />
			<Item key="uk" text="Ukrainian" />
			<Item key="vi" text="Vietnamese" />
		</Select>;

		return <Page
			id="translatePage"
			title="Translate"
			showNavButton={true}
			navButtonPress={ctrl.onNavBack.bind(ctrl)}
			headerContent={[
				<Button
					icon="{= ${translateModel>/showCode} ? 'sap-icon://media-play' : 'sap-icon://source-code' }"
					tooltip="{= ${translateModel>/showCode} ? 'Show demo' : 'Show code' }"
					press={ctrl.onToggleCode.bind(ctrl)}
				/>,
				<Button
					icon="sap-icon://action-settings"
					tooltip="Settings"
					press={ctrl.onOpenSettings.bind(ctrl)}
				/>
			]}
		>
			<VBox class="sapUiSmallMargin" fitContainer={true} visible="{= !${translateModel>/showCode} }">
				<If condition="{translateModel>/unavailable}">
					<MessageStrip
						id="unavailableStrip"
						text="{translateModel>/unavailableText}"
						type="Error"
						showIcon={true}
						class="sapUiSmallMarginBottom"
					/>
				</If>
				<If condition="{translateModel>/downloading}">
					<VBox class="sapUiSmallMarginBottom">
						<Label text="{translateModel>/downloadingText}" />
						<ProgressIndicator
							percentValue="{translateModel>/downloadProgress}"
							displayValue="{translateModel>/downloadProgress}%"
							state="Information"
						/>
					</VBox>
				</If>

				{/* Language selectors row */}
				<HBox alignItems="Center" justifyContent="SpaceBetween" class="sapUiSmallMarginBottom">
					{sourceLangSelect}
					<Button
						id="swapBtn"
						icon="sap-icon://transfer"
						tooltip="Swap languages"
						enabled="{= ${translateModel>/sourceLang} !== 'auto' }"
						press={ctrl.onSwap.bind(ctrl)}
						class="sapUiSmallMarginBeginEnd"
					/>
					{targetLangSelect}
				</HBox>

				{/* Detected language label */}
				<If condition="{translateModel>/detectedLangText}">
					<Label
						id="detectedLangLabel"
						text="{translateModel>/detectedLangText}"
						class="sapUiSmallMarginBottom"
					/>
				</If>

				{/* Two-pane text areas */}
				<FlexBox width="100%" class="sapUiSmallMarginBottom">
					<VBox width="50%" class="sapUiTinyMarginEnd">
						<TextArea
							id="sourceText"
							placeholder="Enter text to translate..."
							rows={10}
							width="100%"
							growing={true}
							liveChange={ctrl.onSourceTextChange.bind(ctrl)}
						/>
					</VBox>
					<VBox width="50%">
						<TextArea
							id="targetText"
							placeholder="Translation will appear here..."
							rows={10}
							width="100%"
							editable={false}
							value="{translateModel>/targetText}"
						/>
					</VBox>
				</FlexBox>

				<Button
					id="translateBtn"
					text="Translate"
					type="Emphasized"
					enabled="{translateModel>/canTranslate}"
					busy="{translateModel>/busy}"
					press={ctrl.onTranslate.bind(ctrl)}
				/>
			</VBox>
			<VBox class="sapUiSmallMargin" fitContainer={true} visible="{translateModel>/showCode}">
					<CodeEditor
						type="javascript"
						editable={false}
						lineNumbers={true}
						height="400px"
						width="100%"
						value="{translateModel>/code}"
						class="sapUiSmallMarginBottom"
					/>
					<Link
						text="Chrome Language Detector API docs ↗"
						href="https://developer.chrome.com/docs/ai/language-detection"
						target="_blank"
						class="sapUiSmallMarginBottom"
					/>
					<Link
						text="Chrome Translator API docs ↗"
						href="https://developer.chrome.com/docs/ai/translator-api"
						target="_blank"
					/>
				</VBox>
		</Page>;
	}
}

export default Translate;
