sap.ui.define(["./BaseController", "sap/ui/model/json/JSONModel", "../model/ai"], function (__BaseController, JSONModel, ___model_ai) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const checkLanguageDetectorAvailability = ___model_ai["checkLanguageDetectorAvailability"];
  const checkTranslatorAvailability = ___model_ai["checkTranslatorAvailability"];
  const checkSummarizerAvailability = ___model_ai["checkSummarizerAvailability"];
  const checkLanguageModelAvailability = ___model_ai["checkLanguageModelAvailability"];
  function statusToUi(s) {
    switch (s) {
      case "available":
        return {
          status: s,
          text: "Available",
          state: "Success"
        };
      case "downloadable":
        return {
          status: s,
          text: "Needs download",
          state: "Warning"
        };
      case "downloading":
        return {
          status: s,
          text: "Downloading…",
          state: "Information"
        };
      default:
        return {
          status: s,
          text: "Unavailable",
          state: "Error"
        };
    }
  }
  const CHECKING = {
    status: "unavailable",
    text: "Checking…",
    state: "None"
  };

  /**
   * @alias ui5.chrome.ai.demo.controller.Help
   */
  const HelpController = BaseController.extend("ui5.chrome.ai.demo.controller.Help", {
    onInit: function _onInit() {
      const initial = {
        detector: {
          ...CHECKING
        },
        translator: {
          ...CHECKING
        },
        summarizer: {
          ...CHECKING
        },
        languageModel: {
          ...CHECKING
        }
      };
      this._helpModel = new JSONModel(initial);
      this.setModel(this._helpModel, "helpModel");
      void this._refreshStatus();
    },
    onRefreshStatus: function _onRefreshStatus() {
      void this._refreshStatus();
    },
    _refreshStatus: async function _refreshStatus() {
      // Reset to "Checking…" while checks run
      const state = this._helpModel.getData();
      this._helpModel.setData({
        ...state,
        detector: {
          ...CHECKING
        },
        translator: {
          ...CHECKING
        },
        summarizer: {
          ...CHECKING
        },
        languageModel: {
          ...CHECKING
        }
      });
      const [det, trans, sum, lm] = await Promise.all([checkLanguageDetectorAvailability(), checkTranslatorAvailability("en", "de"), checkSummarizerAvailability(), checkLanguageModelAvailability()]);
      this._helpModel.setData({
        detector: statusToUi(det),
        translator: statusToUi(trans),
        summarizer: statusToUi(sum),
        languageModel: statusToUi(lm)
      });
    }
  });
  return HelpController;
});
//# sourceMappingURL=Help-dbg.controller.js.map
