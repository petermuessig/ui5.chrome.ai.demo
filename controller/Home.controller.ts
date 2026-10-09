import BaseController from "./BaseController";

/**
 * @namespace ui5.chrome.ai.demo.controller
 */
export default class HomeController extends BaseController {
	public onInit(): void {
		// nothing to init
	}

	public onNavToTranslate(): void {
		this.navTo("translate");
	}

	public onNavToSummarize(): void {
		this.navTo("summarize");
	}

	public onNavToPrompt(): void {
		this.navTo("prompt");
	}
}
