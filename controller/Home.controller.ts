import BaseController from "./BaseController";

/**
 * @alias ui5.chrome.ai.demo.controller.Home
 */
export default class HomeController extends BaseController {
	public onInit(): void {
		// nothing to init
	}

	public onNavToHelp(): void {
		this.navTo("help");
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
