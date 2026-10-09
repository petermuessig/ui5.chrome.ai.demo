sap.ui.define([], function () {
  "use strict";

  /**
   * Shared Chrome Built-in AI helper utilities.
   * Centralises feature detection, availability checking, and the download-progress monitor adapter.
   *
   */

  // ─── Feature detection ───────────────────────────────────────────────────────

  /** Returns true when the LanguageDetector API is present in this browser. */
  function hasLanguageDetector() {
    return "LanguageDetector" in self;
  }

  /** Returns true when the Translator API is present in this browser. */
  function hasTranslator() {
    return "Translator" in self;
  }

  /** Returns true when the Summarizer API is present in this browser. */
  function hasSummarizer() {
    return "Summarizer" in self;
  }

  /** Returns true when the LanguageModel (Prompt) API is present in this browser. */
  function hasLanguageModel() {
    return "LanguageModel" in self;
  }

  // ─── Availability ─────────────────────────────────────────────────────────────

  // not supported in this browser/context

  /**
   * Normalises the varying string values returned by different Chrome AI APIs into
   * a consistent AvailabilityStatus.
   */
  function normaliseAvailability(raw) {
    if (raw === "available" || raw === "readily") return "available";
    if (raw === "after-download" || raw === "downloadable") return "downloadable";
    if (raw === "downloading") return "downloading";
    return "unavailable";
  }

  /** Checks LanguageDetector availability. Returns "unavailable" when the API is absent. */
  async function checkLanguageDetectorAvailability() {
    if (!hasLanguageDetector()) return "unavailable";
    try {
      const raw = await self.LanguageDetector.availability();
      return normaliseAvailability(raw);
    } catch {
      return "unavailable";
    }
  }

  /** Checks Translator availability for the given language pair. */
  async function checkTranslatorAvailability(sourceLanguage, targetLanguage) {
    if (!hasTranslator()) return "unavailable";
    try {
      const raw = await self.Translator.availability({
        sourceLanguage,
        targetLanguage
      });
      return normaliseAvailability(raw);
    } catch {
      return "unavailable";
    }
  }

  /** Checks Summarizer availability. */
  async function checkSummarizerAvailability() {
    if (!hasSummarizer()) return "unavailable";
    try {
      const raw = await self.Summarizer.availability();
      return normaliseAvailability(raw);
    } catch {
      return "unavailable";
    }
  }

  /** Checks LanguageModel availability. */
  async function checkLanguageModelAvailability() {
    if (!hasLanguageModel()) return "unavailable";
    try {
      const raw = await self.LanguageModel.availability({
        expectedInputs: [{
          type: "text"
        }]
      });
      return normaliseAvailability(raw);
    } catch {
      return "unavailable";
    }
  }

  // ─── Download-progress monitor adapter ────────────────────────────────────────

  /**
   * Creates a monitor function accepted by all Chrome AI `create()` calls.
   * The callback receives `loaded` (0..1 normalised fraction) and `total` (same or 1).
   *
   * Usage:
   *   const monitor = makeMonitor((loaded, total) => { ... });
   *   await Translator.create({ sourceLanguage, targetLanguage, monitor });
   */
  function makeMonitor(onProgress) {
    return monitor => {
      monitor.addEventListener("downloadprogress", e => {
        const evt = e;
        const total = evt.total > 0 ? evt.total : 1;
        onProgress(evt.loaded / total, total);
      });
    };
  }

  // ─── Common language list ─────────────────────────────────────────────────────

  /** BCP-47 language codes supported by the Translator/Language Detector APIs. */
  const SUPPORTED_LANGUAGES = [{
    key: "ar",
    text: "Arabic"
  }, {
    key: "bg",
    text: "Bulgarian"
  }, {
    key: "zh",
    text: "Chinese (Simplified)"
  }, {
    key: "zh-Hant",
    text: "Chinese (Traditional)"
  }, {
    key: "cs",
    text: "Czech"
  }, {
    key: "da",
    text: "Danish"
  }, {
    key: "nl",
    text: "Dutch"
  }, {
    key: "en",
    text: "English"
  }, {
    key: "fi",
    text: "Finnish"
  }, {
    key: "fr",
    text: "French"
  }, {
    key: "de",
    text: "German"
  }, {
    key: "el",
    text: "Greek"
  }, {
    key: "he",
    text: "Hebrew"
  }, {
    key: "hi",
    text: "Hindi"
  }, {
    key: "hu",
    text: "Hungarian"
  }, {
    key: "id",
    text: "Indonesian"
  }, {
    key: "it",
    text: "Italian"
  }, {
    key: "ja",
    text: "Japanese"
  }, {
    key: "ko",
    text: "Korean"
  }, {
    key: "no",
    text: "Norwegian"
  }, {
    key: "pl",
    text: "Polish"
  }, {
    key: "pt",
    text: "Portuguese"
  }, {
    key: "ro",
    text: "Romanian"
  }, {
    key: "ru",
    text: "Russian"
  }, {
    key: "sk",
    text: "Slovak"
  }, {
    key: "es",
    text: "Spanish"
  }, {
    key: "sv",
    text: "Swedish"
  }, {
    key: "th",
    text: "Thai"
  }, {
    key: "tr",
    text: "Turkish"
  }, {
    key: "uk",
    text: "Ukrainian"
  }, {
    key: "vi",
    text: "Vietnamese"
  }];
  var __exports = {
    __esModule: true
  };
  __exports.hasLanguageDetector = hasLanguageDetector;
  __exports.hasTranslator = hasTranslator;
  __exports.hasSummarizer = hasSummarizer;
  __exports.hasLanguageModel = hasLanguageModel;
  __exports.normaliseAvailability = normaliseAvailability;
  __exports.checkLanguageDetectorAvailability = checkLanguageDetectorAvailability;
  __exports.checkTranslatorAvailability = checkTranslatorAvailability;
  __exports.checkSummarizerAvailability = checkSummarizerAvailability;
  __exports.checkLanguageModelAvailability = checkLanguageModelAvailability;
  __exports.makeMonitor = makeMonitor;
  __exports.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
  return __exports;
});
//# sourceMappingURL=ai-dbg.js.map
