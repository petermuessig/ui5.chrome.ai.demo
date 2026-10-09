sap.ui.define(["./BaseController"], function (__BaseController) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @alias ui5.chrome.ai.demo.controller.Home
   */
  const HomeController = BaseController.extend("ui5.chrome.ai.demo.controller.Home", {
    onInit: function _onInit() {
      // nothing to init
    },
    onNavToHelp: function _onNavToHelp() {
      this.navTo("help");
    },
    onNavToTranslate: function _onNavToTranslate() {
      this.navTo("translate");
    },
    onNavToSummarize: function _onNavToSummarize() {
      this.navTo("summarize");
    },
    onNavToPrompt: function _onNavToPrompt() {
      this.navTo("prompt");
    }
  });
  return HomeController;
});
//# sourceMappingURL=Home-dbg.controller.js.map
