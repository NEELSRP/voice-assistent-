# 🛰️ N.O.V.A. — Holographic HUD Voice Assistant

A sci-fi HUD–styled voice assistant (rotating radar rings, reactor-style
core, glowing readouts) that runs **entirely in JavaScript, in the
browser**. No Python backend, no paid APIs, no API keys — completely free.

Note: the interface takes visual and tonal inspiration from sci-fi AI-HUD
design generally (radar sweeps, glowing rings, a formal assistant voice) —
it's an original build, not a reproduction of any copyrighted character
or franchise, and isn't branded with any trademarked name.

## Tech Stack (all free, no signup)
| Piece | Tech |
|---|---|
| Speech-to-text | Web Speech API (`SpeechRecognition`) — built into Chrome/Edge |
| Text-to-speech | Web Speech API (`speechSynthesis`) — built into all modern browsers |
| Weather data | [Open-Meteo](https://open-meteo.com) — free, no API key required |
| Knowledge lookup | [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) — free, no key |
| Visualizer | HTML5 Canvas (no library) |
| Everything else | Plain HTML/CSS/JS — no frameworks, no build step, no npm install |

## Why no backend?
The browser's built-in Speech Recognition and Speech Synthesis do the heavy
lifting for free — no need to send audio to a server or pay for a speech
API. All "smarts" (command matching, calculator, weather, wiki lookups) run
as plain JavaScript in `script.js`.

## Project Structure
```
voice_assistant/
├── index.html          # page structure
├── static/
│   ├── style.css        # visual design
│   └── script.js        # recognition, TTS, command logic, free API calls
└── README.md
```

## Run it
Browsers require a "secure context" for microphone access, so open it
through a local server rather than double-clicking the file:

```bash
cd voice_assistant
python -m http.server 8000
```
Then open **http://localhost:8000** in **Chrome or Edge** (Firefox doesn't
support `SpeechRecognition` yet) and allow microphone access when prompted.

## What it can do out of the box
- "What time is it" / "what's the date"
- "Tell me a joke"
- "Calculate 12 times 8" (safe expression evaluator, no `eval` of arbitrary code)
- "What's the weather in Tokyo" (real live weather, free API)
- "Who is Marie Curie" / "What is photosynthesis" (Wikipedia summary)
- "Open youtube" (opens a new tab)
- Falls back gracefully with a helpful message for anything it doesn't recognize

## Roadmap / Next Upgrades (still free)
- **V2 — Wake word:** keep `recognition` running continuously and trigger
  only after hearing "Hey Echo" (all client-side, free).
- **V3 — Memory:** remember the user's name/preferences across sessions
  using `localStorage` (when deployed outside Claude.ai artifacts).
- **V4 — Smarter replies:** swap the simple keyword matcher for a small
  free local intent-classification model (e.g. via `transformers.js`,
  which runs models directly in-browser — still free, still no backend).
- **V5 — More skills:** timers/alarms, unit conversion, currency
  conversion (Frankfurter API is free), news headlines (many free-tier
  news APIs available).

## Notes on browser support
- Best in **Chrome** and **Edge** (desktop and Android).
- Safari has partial/inconsistent support for `SpeechRecognition`.
- Firefox does not currently support the Speech Recognition API.
