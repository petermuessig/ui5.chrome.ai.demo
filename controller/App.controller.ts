import BaseController from "./BaseController";

/**
 * @alias ui5.chrome.ai.demo.controller.App
 */
export default class App extends BaseController {
	public onInit(): void {
		// apply content density mode to root view
		this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
	}
}
