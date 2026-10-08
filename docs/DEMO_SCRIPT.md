# 15-Minute Demo Script
## Chrome Built-in AI APIs in a UI5 TypeScript Application

**Goal:** Show the four Chrome built-in AI APIs (Language Detector, Translator, Summarizer,
Prompt) working live in a UI5 TypeScript application running entirely on-device in Chrome.

---

## ⚡ Pre-flight checklist (run BEFORE the demo clock starts)

- [ ] Chrome version ≥ 148 (check `chrome://version/`)
- [ ] All four flags enabled at `chrome://flags/`:
  - `#prompt-api-for-gemini-nano` → **Enabled**
  - `#translation-api` → **Enabled**
  - `#language-detection-api` → **Enabled**
  - `#summarization-api` → **Enabled**
- [ ] Gemini Nano model pre-downloaded: `chrome://components/` → "Optimization Guide On
  Device Model" → click **Check for update**, wait for "Component updated" or "Up to date"
- [ ] App running: `npm start` in project folder, `http://localhost:8080` loads correctly
- [ ] `docs/slides.html` open in **Tab 1**; app in **Tab 2**
- [ ] Sample texts copied to clipboard / a text file:
  - *Detection text:* `"Bonjour tout le monde, comment ça va aujourd'hui ?"` (French)
  - *Swap demo text (German):* `"Künstliche Intelligenz verändert die Welt."`
  - *Summarize article:* a ~500-word news article (paste from any quality news site)
  - *Prompt question:* `"Explain transformer neural networks in 3 bullet points."`
  - *Image:* any JPG/PNG on the desktop for the multimodal turn
- [ ] Font size increased for screen sharing: Chrome DevTools → Rendering → Font size ×1.25

---

## Segment 1 — Why? (slides) `0:00 – 2:00`

> Switch to Tab 1 (`docs/slides.html`)

**Key talking points (one slide per bullet):**

1. **On-device AI is a paradigm shift.**
   Traditional AI → HTTP call → cloud model → response latency + cost + privacy risk.
   Chrome built-in AI → model lives in the browser → no network, no key, no data leaves the
   device, works offline, **free**.

2. **Four APIs available today in Chrome:**
   - *Language Detector* — detect the language of any text
   - *Translator* — translate between 30+ language pairs
   - *Summarizer* — compress long text into key points, TL;DR, teaser, or headline
   - *Prompt* — conversational access to Gemini Nano (text + image + audio input)

> ⏱ Target: 2 min. Move on promptly — the live demos are the main event.

---

## Segment 2 — App overview (launchpad) `2:00 – 3:00`

> Switch to Tab 2 (the running app)

- Point out the three tiles: **Translate**, **Summarize**, **Prompt**.
- Mention: "everything runs locally in Chrome — watch the network tab if you like, there are
  zero AI requests."
- Click a tile → view navigates → click **Back** → back on launchpad. Show routing works.

> ⏱ Target: 1 min.

---

## Segment 3 — Translate (Language Detector + Translator API) `3:00 – 7:00`

This is the richest segment — give it full time.

### Step-by-step

1. **Click the Translate tile.**

2. **Auto-detect — Language Detector API:**
   - Source language is pre-selected as **Auto-Detect**.
   - Paste the French text: `"Bonjour tout le monde, comment ça va aujourd'hui ?"`.
   - After ~0.6 s the label reads *"Detected: French (95%)"*.
   - Say: *"The Language Detector API ran entirely in-browser — no call to a cloud service."*

3. **Translate — Translator API:**
   - Target language is **German** (default).
   - Click **Translate**.
   - On first use: progress bar shows model download (or instant if pre-warmed).
   - Translation appears in the right panel.

4. **Try a different target:**
   - Change target to **Spanish** → Translate again → new translator session created.

5. **Swap button:**
   - Change source to **German** manually.
   - Paste: `"Künstliche Intelligenz verändert die Welt."`
   - Translate → target = English translation.
   - Click **Swap** → source/target languages and text flip.
   - Say: *"Swap reuses the existing text and switches the language pair."*

6. **Settings dialog (optional):**
   - Open gear icon → show source/target language dropdowns.
   - Say: *"Every screen has a settings dialog to control the underlying API options."*

> ⏱ Target: 4 min. **Fallback:** if model download dialog shows and stalls, switch to the
> Language Detector/Translator slide and narrate the API; come back when the download
> finishes.

---

## Segment 4 — Summarize (Summarizer API) `7:00 – 10:00`

1. **Click Back → click Summarize tile.**

2. **Default settings — key-points, plain-text, medium:**
   - Paste the ~500-word article into the top text area.
   - Click **Summarize**.
   - Output streams in as bullet points.
   - Say: *"Streaming output — the model pushes text as it generates, no wait for the full
     result."*

3. **Change settings — show option impact:**
   - Open gear → change **Type** to **TL;DR** → **Length** to **Short** → Save.
   - Click **Summarize** again.
   - Output changes to a single paragraph.
   - Say: *"The Summarizer lets you dial in exactly the shape of output you need: type, format,
     length, and a context hint the model uses to orient the summary."*

4. **Headline type (quick):**
   - Settings → Type: **Headline** → Summarize.
   - Instant catchy headline appears.

> ⏱ Target: 3 min. **Fallback:** if Summarizer is slow, narrate the settings while it runs.

---

## Segment 5 — Prompt / Chat (LanguageModel API) `10:00 – 13:30`

1. **Click Back → click Prompt tile.**

2. **Text turn — streaming:**
   - Type: `"Explain transformer neural networks in 3 bullet points."`
   - Click **Send** (or Cmd+Enter).
   - Streaming response appears in the chat list.
   - Say: *"This is Gemini Nano running on-device — streaming a multi-sentence answer with
     zero round-trips to any server."*

3. **Image multimodal turn:**
   - Drag-and-drop (or paste) a photo onto the composer input.
   - Thumbnail appears. Say: *"The Prompt API supports multimodal input — images alongside
     text in the same turn."*
   - Type: `"What do you see in this image?"` → Send.
   - Model describes the image.

4. **Voice input (optional — 30 s):**
   - Click the **microphone** button.
   - Speak: *"What is the capital of France?"*
   - Transcript fills the composer → Send → answer streams in.
   - Say: *"Voice input uses the Web Speech API — separate from Chrome AI, but works
     seamlessly together."*

5. **Settings dialog:**
   - Open gear → show system prompt, temperature slider, top-K slider.
   - Change system prompt to `"You are a pirate."` → Save → send `"Hello"` → note the
     pirate-speak response.

> ⏱ Target: 3.5 min. **Fallback:** if LanguageModel session creation stalls, show the
> downloading progress bar and explain that on warm devices this is instant.

---

## Segment 6 — Wrap-up `13:30 – 15:00`

> Switch back to Tab 1 (closing slides)

**Recap talking points:**

- Four APIs, all on-device, all in Chrome: **Language Detector, Translator, Summarizer,
  Prompt**.
- Built as a **UI5 TypeScript** application — standard UI5 toolchain, no additional build
  infrastructure, no API keys, no backend.
- Privacy: the model never leaves the device. Offline-capable after first download.
- Code is open at this repo — see `README.md` for setup steps and `docs/slides.html` for this
  deck.

---

## ⚠️ General fallback plan

| Situation | Action |
|-----------|--------|
| Model download dialog during demo | Show progress bar, narrate the API, move on; come back when ready |
| API shows "unavailable" | Switch to slide for that API — explain the flag/version requirement |
| Voice doesn't pick up | Skip mic turn; mention "works on HTTPS/localhost" |
| Browser crash | Reload `localhost:8080` — models are cached, session starts fresh |

Keep a canned screenshot of each screen working as a final fallback.
