/* ==========================================================
   Echo — browser-only voice assistant
   Uses: Web Speech API (recognition + synthesis) — free, built into Chrome/Edge
   Free data APIs (no key required):
     - Open-Meteo geocoding + weather   https://open-meteo.com
     - Wikipedia REST summary           https://en.wikipedia.org
   ========================================================== */

const micBtn = document.getElementById("micBtn");
const status = document.getElementById("status");
const log = document.getElementById("log");
const canvas = document.getElementById("orbCanvas");
const ctx = canvas.getContext("2d");
const bgCanvas = document.getElementById("bgCanvas");
const bgCtx = bgCanvas.getContext("2d");

const COLORS = { idle: "#4E6663", listening: "#3FD9C7", speaking: "#E8A855" };
let state = "idle"; // idle | listening | speaking
let phase = 0;
let rafId;

/* ---------------- Ambient background field ---------------- */
let particles = [];

function initBackground() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  const count = Math.min(70, Math.floor((window.innerWidth * window.innerHeight) / 22000));
  particles = new Array(count).fill(0).map(() => ({
    x: Math.random() * bgCanvas.width,
    y: Math.random() * bgCanvas.height,
    r: 0.6 + Math.random() * 1.6,
    vx: (Math.random() - 0.5) * 0.08,
    vy: (Math.random() - 0.5) * 0.08,
    tw: Math.random() * Math.PI * 2,
  }));
}

function drawBackground() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  const [r, g, b] = hexToRgb(COLORS[state]);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.tw += 0.02;
    if (p.x < 0) p.x = bgCanvas.width;
    if (p.x > bgCanvas.width) p.x = 0;
    if (p.y < 0) p.y = bgCanvas.height;
    if (p.y > bgCanvas.height) p.y = 0;

    const alpha = 0.15 + 0.15 * Math.sin(p.tw);
    bgCtx.beginPath();
    bgCtx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.fill();
  }
  requestAnimationFrame(drawBackground);
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

window.addEventListener("resize", initBackground);
initBackground();
drawBackground();

/* ---------------- Orb visual: rotating HUD reactor rings ---------------- */
const CENTER = 160;
const RING_BARS = 72;
let rot1 = 0, rot2 = 0, rot3 = 0;

function drawTickRing(radius, count, lenBase, wobbleAmp, rgb, rotation, alphaBase) {
  const [r, g, b] = rgb;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rotation;
    const pulse = state === "idle"
      ? 0.5 + 0.15 * Math.sin(phase * 1.5 + i * 0.5)
      : 0.4 + 0.6 * Math.abs(Math.sin(phase * 2 + i * 0.9));
    const len = lenBase + wobbleAmp * pulse;
    const x1 = CENTER + Math.cos(angle) * radius;
    const y1 = CENTER + Math.sin(angle) * radius;
    const x2 = CENTER + Math.cos(angle) * (radius + len);
    const y2 = CENTER + Math.sin(angle) * (radius + len);
    ctx.strokeStyle = `rgba(${r},${g},${b},${alphaBase + pulse * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function drawOrb() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const [r, g, b] = hexToRgb(COLORS[state]);
  const speed = state === "idle" ? 1 : 3.2;
  phase += 0.02 * speed;
  rot1 += 0.006 * speed;
  rot2 -= 0.004 * speed;
  rot3 += 0.011 * speed;

  // outer glow
  const glow = ctx.createRadialGradient(CENTER, CENTER, 10, CENTER, CENTER, 150);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.14)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 150, 0, Math.PI * 2);
  ctx.fill();

  // static reference circles
  [64, 92, 120].forEach((rad) => {
    ctx.strokeStyle = `rgba(${r},${g},${b},0.12)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, rad, 0, Math.PI * 2);
    ctx.stroke();
  });

  // degree tick ring (radar-style)
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    const major = i % 6 === 0;
    const inner = 122;
    const outer = major ? 130 : 126;
    const x1 = CENTER + Math.cos(angle) * inner;
    const y1 = CENTER + Math.sin(angle) * inner;
    const x2 = CENTER + Math.cos(angle) * outer;
    const y2 = CENTER + Math.sin(angle) * outer;
    ctx.strokeStyle = `rgba(${r},${g},${b},${major ? 0.4 : 0.18})`;
    ctx.lineWidth = major ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // radar sweep
  ctx.save();
  ctx.translate(CENTER, CENTER);
  ctx.rotate(rot3 * 2);
  const sweep = ctx.createLinearGradient(0, 0, 128, 0);
  sweep.addColorStop(0, `rgba(${r},${g},${b},0.35)`);
  sweep.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.strokeStyle = sweep;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(128, 0);
  ctx.stroke();
  ctx.restore();

  // three concentric tick rings, rotating at different speeds
  drawTickRing(92, RING_BARS, 6, 10, [r, g, b], rot1, 0.25);
  drawTickRing(64, 40, 5, 8, [r, g, b], rot2, 0.3);

  // reactor core
  const coreGrad = ctx.createRadialGradient(CENTER, CENTER, 2, CENTER, CENTER, 46);
  coreGrad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  coreGrad.addColorStop(0.6, `rgba(${r},${g},${b},0.25)`);
  coreGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 46, 0, Math.PI * 2);
  ctx.stroke();

  rafId = requestAnimationFrame(drawOrb);
}
drawOrb();

/* ---------------- HUD readouts: clock + status ---------------- */
const clockEl = document.getElementById("clock");
const sysStatusEl = document.getElementById("sysStatus");

function tickClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour12: false });
  requestAnimationFrame(() => setTimeout(tickClock, 1000));
}
tickClock();

function setState(next) {
  state = next;
  micBtn.classList.toggle("active", next !== "idle");
  document.documentElement.style.setProperty("--state", COLORS[next]);
  if (sysStatusEl) {
    sysStatusEl.textContent = { idle: "STANDBY", listening: "LISTENING", speaking: "RESPONDING" }[next];
  }
}

/* ---------------- Conversation log ---------------- */
function addBubble(text, who) {
  const el = document.createElement("div");
  el.className = `bubble ${who}`;
  el.textContent = text;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
}

/* ---------------- Text-to-speech ---------------- */
let bestVoice = null;

function pickBestVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Preference order: high-quality neural/network voices first,
  // then any English voice, then whatever is available.
  const preferredNames = [
    "Google UK English Female",
    "Google US English",
    "Microsoft Aria Online (Natural)",
    "Microsoft Jenny Online (Natural)",
    "Microsoft Guy Online (Natural)",
    "Samantha",
    "Daniel",
  ];

  for (const name of preferredNames) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  const englishNeural = voices.find(
    (v) => /en-/i.test(v.lang) && /(Natural|Neural|Online)/i.test(v.name)
  );
  if (englishNeural) return englishNeural;

  const english = voices.find((v) => /^en/i.test(v.lang));
  return english || voices[0];
}

// voices load asynchronously in most browsers
if (window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = () => {
    bestVoice = pickBestVoice();
  };
  bestVoice = pickBestVoice();
}

function speak(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      addBubble(text, "echo");
      resolve();
      return;
    }
    addBubble(text, "echo");
    setState("speaking");
    const utter = new SpeechSynthesisUtterance(text);
    if (bestVoice) utter.voice = bestVoice;
    utter.rate = 1.0;
    utter.pitch = 1.02;
    utter.volume = 1;
    utter.onend = () => {
      setState("idle");
      resolve();
    };
    utter.onerror = () => {
      setState("idle");
      resolve();
    };
    speechSynthesis.speak(utter);
  });
}

/* ---------------- Speech recognition ---------------- */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (!SpeechRecognition) {
  status.textContent = "// voice module unsupported — use Chrome or Edge";
  micBtn.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    setState("listening");
    status.textContent = "// capturing audio input";
  };

  recognition.onerror = (e) => {
    setState("idle");
    status.textContent = e.error === "not-allowed" ? "// microphone access denied" : "// signal unclear, try again";
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    addBubble(transcript, "user");
    setState("idle");
    status.textContent = "// processing request";
    await handleCommand(transcript);
    status.textContent = "// awaiting input";
  };

  recognition.onend = () => {
    if (state === "listening") setState("idle");
  };
}

micBtn.addEventListener("click", () => {
  if (!recognition) return;
  if (state === "listening") {
    recognition.stop();
    return;
  }
  try {
    recognition.start();
  } catch (e) {
    // recognition already running — ignore
  }
});

/* ---------------- Command parsing ---------------- */
async function handleCommand(rawText) {
  const text = rawText.toLowerCase().trim();

  if (/\b(hi|hello|hey)\b/.test(text) && text.length < 20) {
    return speak("Good to hear from you. Systems are online — how can I assist?");
  }

  if (text.includes("what time") || text.includes("current time")) {
    const now = new Date();
    return speak(`The time is currently ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`);
  }

  if (text.includes("what") && text.includes("date")) {
    const now = new Date();
    return speak(`Today's date is ${now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`);
  }

  if (text.includes("joke")) {
    return speak(randomJoke());
  }

  const calcMatch = text.match(/calculate (.+)/) || text.match(/what('s| is) (.+ (plus|minus|times|divided by|\+|-|\*|\/) .+)/);
  if (calcMatch) {
    const result = tryCalculate(text);
    if (result !== null) return speak(`Calculation complete. The result is ${result}.`);
    return speak("That expression didn't resolve cleanly — try phrasing it like 'calculate 12 times 8'.");
  }

  const weatherMatch = text.match(/weather (?:in|for)?\s*(.+)/);
  if (weatherMatch) {
    return handleWeather(weatherMatch[1].trim());
  }

  const whoMatch = text.match(/who is (.+)/) || text.match(/what is (.+)/);
  if (whoMatch) {
    return handleWiki(whoMatch[1].trim());
  }

  const playMatch =
    text.match(/(?:open youtube and )?play (.+?)(?: on youtube)?$/) ||
    text.match(/search youtube for (.+)/);
  if (playMatch) {
    const query = playMatch[1].trim();
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(url, "_blank");
    return speak(`Pulling up YouTube results for ${query}. Pick a track and it'll start right up.`);
  }

  const openMatch = text.match(/open (.+)/);
  if (openMatch) {
    const site = openMatch[1].trim().replace(/\s+/g, "");
    const url = site.includes(".") ? `https://${site}` : `https://${site}.com`;
    window.open(url, "_blank");
    return speak(`Right away. Opening ${openMatch[1].trim()} now.`);
  }

  return speak("I don't have a protocol for that one yet. Take a look at the command reference below.");
}

function randomJoke() {
  const jokes = [
    "Here's one for you: I told my computer I needed a break, and it said no problem — it froze immediately.",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "I'd offer you a UDP joke, but there's no guarantee you'd receive it.",
    "Why did the developer go broke? They used up all their cache.",
    "A small piece of trivia: there are 10 types of people in the world — those who understand binary and those who don't.",
  ];
  return jokes[Math.floor(Math.random() * jokes.length)];
}

function tryCalculate(text) {
  let expr = text
    .replace(/calculate/g, "")
    .replace(/what('s| is)/g, "")
    .replace(/plus/g, "+")
    .replace(/minus/g, "-")
    .replace(/times/g, "*")
    .replace(/divided by/g, "/")
    .trim();

  // only allow digits, operators, spaces, parentheses, decimal points
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return null;

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expr})`)();
    if (typeof result === "number" && isFinite(result)) {
      return Math.round(result * 1000) / 1000;
    }
    return null;
  } catch {
    return null;
  }
}

/* ---------------- Free weather (Open-Meteo, no API key) ---------------- */
async function handleWeather(city) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
    );
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return speak(`I couldn't locate a place called ${city} in the database.`);
    }
    const { latitude, longitude, name, country } = geoData.results[0];

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
    );
    const weatherData = await weatherRes.json();
    const temp = weatherData.current.temperature_2m;
    const desc = weatherCodeToText(weatherData.current.weather_code);

    return speak(`Current conditions in ${name}, ${country}: ${temp}°C, ${desc}.`);
  } catch (err) {
    console.error(err);
    return speak("I'm unable to reach the weather service at the moment.");
  }
}

function weatherCodeToText(code) {
  const map = {
    0: "clear sky", 1: "mostly clear", 2: "partly cloudy", 3: "overcast",
    45: "foggy", 48: "foggy", 51: "light drizzle", 61: "light rain",
    63: "moderate rain", 65: "heavy rain", 71: "light snow", 80: "rain showers",
    95: "thunderstorms",
  };
  return map[code] || "unusual weather";
}

/* ---------------- Free knowledge lookup (Wikipedia REST, no key) ---------------- */
async function handleWiki(topic) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    );
    if (!res.ok) return speak(`I found no record matching ${topic}.`);
    const data = await res.json();
    const extract = data.extract || `A page exists for ${topic}, but no summary was available.`;
    const short = extract.length > 280 ? extract.slice(0, 280).trim() + "…" : extract;
    return speak(short);
  } catch (err) {
    console.error(err);
    return speak("I'm unable to access that information right now.");
  }
}
