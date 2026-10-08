# Chrome Built-in AI Demo — UI5 TypeScript

> Four Chrome built-in AI APIs — Language Detector · Translator · Summarizer · Prompt (Gemini Nano) — running **entirely on-device** inside a UI5 TypeScript application.

No server. No API key. No data leaves your machine.

---

## What's inside

| Demo screen | API(s) used | What it shows |
|---|---|---|
| **Translate** | Language Detector + Translator | Google-translate-style UI with auto language detection, 30+ language pairs, and a swap button |
| **Summarize** | Summarizer | Paste long text, pick output type/format/length, get a live-streamed summary |
| **Prompt** | LanguageModel (Gemini Nano) | Chat interface with streaming replies, image drop/paste/camera, voice input, and a settings dialog |

The **Home** screen shows all three tiles; a **Help** screen explains the Chrome setup steps.

---

## Prerequisites

### Chrome version

| API | Minimum Chrome version |
|---|---|
| Language Detector | Chrome 138 |
| Translator | Chrome 138 |
| Summarizer | Chrome 138 |
| Prompt / LanguageModel | Chrome 148 (web pages) |

### Enable the on-device model

1. Open `chrome://flags/` and enable all four flags:
   - `#prompt-api-for-gemini-nano` → **Enabled**
   - `#translation-api` → **Enabled**
   - `#language-detection-api` → **Enabled**
   - `#summarization-api` → **Enabled**
2. Relaunch Chrome.
3. Open `chrome://components/`, find **"Optimization Guide On Device Model"**, click **Check for update** and wait for "Component updated" or "Up to date". This pre-downloads Gemini Nano so the first demo run is instant.

> **First-run note:** if the model has not been pre-downloaded, the app shows a progress bar during the initial API call. Subsequent calls use the cached model.

---

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server (http://localhost:8080)
npm start

# Type-check only (no emit)
npm run ts-typecheck

# Production build → ./dist/
npm run build
```

Open `docs/slides.html` directly in your browser for the presentation deck (no build step needed).

---

## Project structure

```
webapp/
├── Component.ts              # UI5 app entry point (IAsyncContentCreation)
├── manifest.json             # App descriptor: routing, i18n, libs
├── index.html                # Local dev entry (UI5 tooling)
├── index-cdn.html            # CDN entry (no build step)
├── view/
│   ├── App.view.xml          # Root shell (hosts the router <App> target)
│   ├── Home.view.tsx         # Launchpad — tiles for each demo
│   ├── Translate.view.tsx    # Language Detector + Translator demo
│   ├── Summarize.view.tsx    # Summarizer demo
│   ├── Prompt.view.tsx       # LanguageModel (Gemini Nano) chat demo
│   └── Help.view.tsx         # Chrome setup instructions
├── controller/
│   ├── BaseController.ts     # Shared helpers (navTo, getRouter, …)
│   ├── App.controller.ts     # Root view controller
│   ├── Home.controller.ts    # Launchpad navigation
│   ├── Translate.controller.ts   # Language Detector + Translator logic
│   ├── Summarize.controller.ts   # Summarizer logic
│   ├── Prompt.controller.ts      # LanguageModel logic, image + voice
│   └── Help.controller.ts        # Help / setup page
├── model/
│   ├── ai.ts                 # Chrome AI helpers (availability, monitor, language list)
│   ├── formatter.ts
│   └── models.ts
├── css/
│   └── app.css               # Custom styles (chat layout, attachment chips, …)
└── i18n/
    ├── i18n.properties       # English (default)
    ├── i18n_en.properties
    └── i18n_de.properties    # German
docs/
├── slides.html               # Self-contained slide deck (UI5ers live colour scheme)
└── DEMO_SCRIPT.md            # 15-minute live demo walkthrough
```

### Routes

| Hash | Route | View |
|---|---|---|
| (empty) | `home` | `Home.view.tsx` |
| `#translate` | `translate` | `Translate.view.tsx` |
| `#summarize` | `summarize` | `Summarize.view.tsx` |
| `#prompt` | `prompt` | `Prompt.view.tsx` |
| `#help` | `help` | `Help.view.tsx` |

TSX views are referenced in routing targets with the `module:` prefix:
`"name": "module:ui5/chrome/ai/demo/view/Translate.view"`.

---

## How TSX views are enabled

This project uses the [ui5-community JSX runtime](https://github.com/ui5-community/ui5-ecosystem-showcase/tree/main/packages/jsx-runtime). Three configuration layers must use the same runtime identifier.

### `ui5.yaml` — transpiler

```yaml
customConfiguration:
  config-ui5-tooling-transpile: &cfgTranspile
    transformJSX:
      runtime: automatic
      importSource: "ui5/community/jsx/runtime"
```

### `tsconfig.json` — TypeScript

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "ui5/community/jsx/runtime",
    "types": [
      "@openui5/types",
      "@ui5-community/jsx-runtime",
      "@types/dom-chromium-ai"
    ]
  }
}
```

### `package.json` — runtime package

```json
{
  "dependencies": {
    "@ui5-community/jsx-runtime": "^0.1.5"
  },
  "devDependencies": {
    "@babel/plugin-transform-react-jsx": "^7.29.7",
    "@types/dom-chromium-ai": "^0.0.10"
  }
}
```

> **Note:** the three strings `"ui5/community/jsx/runtime"` must be identical across all three files.

### TSX view rules

- JSX tags are **UI5 control classes only** — there are no HTML elements (`<div>`, `<span>`, …). Use `sap/m/FlexBox`, `sap/m/Image`, etc. for layout.
- UI5 controls do not support a `style` prop — use `class` and CSS instead.
- Use `control.attachBrowserEvent("keydown", handler)` / `detachBrowserEvent` for native DOM events — not `getDomRef().addEventListener`.

---

## How each demo works

### Translate

1. Paste text into the left text area. Source language defaults to **Auto-Detect** — `LanguageDetector.detect()` runs on a 600 ms debounce and shows the detected language + confidence.
2. Pick a target language.
3. Click **Translate** — a `Translator` session is created with `{ sourceLanguage, targetLanguage }` and cached for the current language pair.
4. **Swap** exchanges source ↔ target text and languages (disabled when source is Auto-Detect).
5. The gear icon opens **Settings** to change the language pair.

### Summarize

1. Paste a long text into the input area.
2. Open **Settings** to choose *type* (`key-points` · `tldr` · `teaser` · `headline`), *format* (`plain-text` · `markdown`), *length* (`short` · `medium` · `long`), and an optional *context hint*.
3. Click **Summarize** — `Summarizer.create({…})` is called and `summarizeStreaming()` streams the result live. Changing settings destroys the current session so the next call picks up the new options.

### Prompt

1. Type a message and press **Send** (or Cmd+Enter / Ctrl+Enter). A `LanguageModel` session is created on the first send using your Settings (system prompt, temperature, top-K from `LanguageModel.params()`). Responses stream in via `promptStreaming()`.
2. **Image input:** drag-and-drop or paste an image (or use the **camera** button) onto the composer. A thumbnail appears; the session is recreated with `expectedInputs: [{type:'image'}]`. The image is sent as `{type:'image', value: blob}` alongside your text.
3. **Voice input:** click the microphone to start dictation (Web Speech API — separate from Chrome AI). The transcript appends to the composer.
4. **Clear chat** destroys the session and clears the transcript.
5. **Settings** — system prompt, temperature, and top-K sliders. Saving recreates the session.

---

## Caveats

- Chrome built-in AI APIs are **experimental**. The API surface may change between Chrome versions. Check [developer.chrome.com/docs/ai/built-in-apis](https://developer.chrome.com/docs/ai/built-in-apis) for the latest.
- The **Prompt API** requires Chrome 148+ for web pages (Chrome 138+ for extensions).
- The **Gemini Nano model download** can be several hundred MB. Pre-download it via `chrome://components/` before running the demo.
- **Voice input** uses `webkitSpeechRecognition` (Web Speech API), not a Chrome AI API. It requires HTTPS or localhost.
- All APIs require a **secure context** (HTTPS or localhost). The dev server (`npm start`) serves over localhost, so all features work.

---

## Standardization

All four APIs are proposals in the [W3C Web Machine Learning Community Group](https://webmachinelearning.github.io/). They are under W3C TAG review. Firefox and WebKit have open standards-position reviews. Chrome is the only browser with general-availability implementations today (Edge has experimental Prompt API support).

---

## License

Apache 2.0 — see [LICENSE](LICENSE).
