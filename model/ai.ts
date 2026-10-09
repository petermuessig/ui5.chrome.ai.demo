/**
 * Shared Chrome Built-in AI helper utilities.
 * Centralises feature detection, availability checking, and the download-progress monitor adapter.
 *
 * @namespace ui5.chrome.ai.demo.model
 */

// ─── Feature detection ───────────────────────────────────────────────────────

/** Returns true when the LanguageDetector API is present in this browser. */
export function hasLanguageDetector(): boolean {
	return "LanguageDetector" in self;
}

/** Returns true when the Translator API is present in this browser. */
export function hasTranslator(): boolean {
	return "Translator" in self;
}

/** Returns true when the Summarizer API is present in this browser. */
export function hasSummarizer(): boolean {
	return "Summarizer" in self;
}

/** Returns true when the LanguageModel (Prompt) API is present in this browser. */
export function hasLanguageModel(): boolean {
	return "LanguageModel" in self;
}

// ─── Availability ─────────────────────────────────────────────────────────────

export type AvailabilityStatus =
	| "available"       // ready to use right now
	| "downloadable"    // supported but model needs to be downloaded
	| "downloading"     // model download in progress
	| "unavailable";    // not supported in this browser/context

/**
 * Normalises the varying string values returned by different Chrome AI APIs into
 * a consistent AvailabilityStatus.
 */
export function normaliseAvailability(raw: string): AvailabilityStatus {
	if (raw === "available" || raw === "readily") return "available";
	if (raw === "after-download" || raw === "downloadable") return "downloadable";
	if (raw === "downloading") return "downloading";
	return "unavailable";
}

/** Checks LanguageDetector availability. Returns "unavailable" when the API is absent. */
export async function checkLanguageDetectorAvailability(): Promise<AvailabilityStatus> {
	if (!hasLanguageDetector()) return "unavailable";
	try {
		const raw = await (self as unknown as { LanguageDetector: { availability(): Promise<string> } }).LanguageDetector.availability();
		return normaliseAvailability(raw);
	} catch {
		return "unavailable";
	}
}

/** Checks Translator availability for the given language pair. */
export async function checkTranslatorAvailability(sourceLanguage: string, targetLanguage: string): Promise<AvailabilityStatus> {
	if (!hasTranslator()) return "unavailable";
	try {
		const raw = await (self as unknown as { Translator: { availability(o: object): Promise<string> } }).Translator.availability({ sourceLanguage, targetLanguage });
		return normaliseAvailability(raw);
	} catch {
		return "unavailable";
	}
}

/** Checks Summarizer availability. */
export async function checkSummarizerAvailability(): Promise<AvailabilityStatus> {
	if (!hasSummarizer()) return "unavailable";
	try {
		const raw = await (self as unknown as { Summarizer: { availability(): Promise<string> } }).Summarizer.availability();
		return normaliseAvailability(raw);
	} catch {
		return "unavailable";
	}
}

/** Checks LanguageModel availability. */
export async function checkLanguageModelAvailability(): Promise<AvailabilityStatus> {
	if (!hasLanguageModel()) return "unavailable";
	try {
		const raw = await (self as unknown as { LanguageModel: { availability(o: object): Promise<string> } }).LanguageModel.availability({
			expectedInputs: [{ type: "text" }]
		});
		return normaliseAvailability(raw);
	} catch {
		return "unavailable";
	}
}

// ─── Download-progress monitor adapter ────────────────────────────────────────

export type ProgressCallback = (loaded: number, total: number) => void;

/**
 * Creates a monitor function accepted by all Chrome AI `create()` calls.
 * The callback receives `loaded` (0..1 normalised fraction) and `total` (same or 1).
 *
 * Usage:
 *   const monitor = makeMonitor((loaded, total) => { ... });
 *   await Translator.create({ sourceLanguage, targetLanguage, monitor });
 */
export function makeMonitor(onProgress: ProgressCallback): (monitor: EventTarget) => void {
	return (monitor: EventTarget) => {
		monitor.addEventListener("downloadprogress", (e: Event) => {
			const evt = e as ProgressEvent;
			const total = evt.total > 0 ? evt.total : 1;
			onProgress(evt.loaded / total, total);
		});
	};
}

// ─── Common language list ─────────────────────────────────────────────────────

/** BCP-47 language codes supported by the Translator/Language Detector APIs. */
export const SUPPORTED_LANGUAGES: { key: string; text: string }[] = [
	{ key: "ar", text: "Arabic" },
	{ key: "zh", text: "Chinese (Simplified)" },
	{ key: "zh-Hant", text: "Chinese (Traditional)" },
	{ key: "cs", text: "Czech" },
	{ key: "da", text: "Danish" },
	{ key: "nl", text: "Dutch" },
	{ key: "en", text: "English" },
	{ key: "fi", text: "Finnish" },
	{ key: "fr", text: "French" },
	{ key: "de", text: "German" },
	{ key: "el", text: "Greek" },
	{ key: "he", text: "Hebrew" },
	{ key: "hi", text: "Hindi" },
	{ key: "hu", text: "Hungarian" },
	{ key: "id", text: "Indonesian" },
	{ key: "it", text: "Italian" },
	{ key: "ja", text: "Japanese" },
	{ key: "ko", text: "Korean" },
	{ key: "no", text: "Norwegian" },
	{ key: "pl", text: "Polish" },
	{ key: "pt", text: "Portuguese" },
	{ key: "ro", text: "Romanian" },
	{ key: "ru", text: "Russian" },
	{ key: "sk", text: "Slovak" },
	{ key: "es", text: "Spanish" },
	{ key: "sv", text: "Swedish" },
	{ key: "th", text: "Thai" },
	{ key: "tr", text: "Turkish" },
	{ key: "uk", text: "Ukrainian" },
	{ key: "vi", text: "Vietnamese" }
];
