import "./style.css";
import { AudioEngine } from "./audio.js";
import { playConfessionSequence } from "./confession.js";
import { renderSurvivalLog, getSeedHistory } from "./log.js";
import { getTodayKey, pickMessage, updateStreak } from "./messages.js";
import { burstParticles } from "./particles.js";
import { renderSlots } from "./slots.js";

const STORAGE_KEY = "survival-app-state-v1";

const createItem = (text) => ({
  id: crypto.randomUUID(),
  text,
  createdAt: Date.now(),
  completedAt: null,
  closeCall: false,
});

const normalizeState = (input) => {
  const fallback = {
    items: [null, null, null],
    history: [],
    streak: { count: 0, lastDate: null },
    settings: { soundEnabled: false, intensityEnabled: false },
  };

  if (!input || typeof input !== "object") return fallback;

  const items = Array.isArray(input.items) ? input.items.slice(0, 3) : [];
  while (items.length < 3) items.push(null);

  return {
    ...fallback,
    ...input,
    items,
    history: Array.isArray(input.history) ? input.history : [],
    streak: input.streak?.count ? input.streak : fallback.streak,
    settings: {
      soundEnabled: Boolean(input.settings?.soundEnabled),
      intensityEnabled: Boolean(input.settings?.intensityEnabled),
    },
  };
};

const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeState(null);
    return normalizeState(JSON.parse(raw));
  } catch {
    return normalizeState(null);
  }
};

const saveState = (state) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const app = document.querySelector("#app");
const state = loadState();
const ui = { draftIndex: null };
const audio = new AudioEngine();

const showToast = (message, variant = "normal") => {
  const stack = document.querySelector("#toast-stack");
  if (!stack) return;
  const toast = document.createElement("div");
  toast.className = `toast ${variant}`;
  toast.textContent = message;
  stack.append(toast);
  window.setTimeout(() => toast.classList.add("show"), 10);
  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => toast.remove(), 280);
  }, 2000);
};

const showMessagePop = (message) => {
  const pop = document.querySelector("#message-pop");
  if (!pop) return;
  pop.textContent = message;
  pop.classList.add("show");
  window.setTimeout(() => pop.classList.remove("show"), 2700);
};

const streakLabel = (count) => `🔥 ${count} day${count === 1 ? "" : "s"} surviving`;

const allSlotsCompleted = () =>
  state.items.every((item) => item && typeof item.completedAt === "number");

const allSlotsFilled = () => state.items.every(Boolean);

const appendHistory = (text, closeCall) => {
  state.history.unshift({
    text,
    type: closeCall ? "close_call" : "survived",
    at: Date.now(),
  });
  state.history = state.history.slice(0, 80);
};

const markComplete = (index, slotEl, closeCall = false) => {
  const item = state.items[index];
  if (!item || item.completedAt) return;

  item.completedAt = Date.now();
  item.closeCall = closeCall;
  appendHistory(item.text, closeCall);
  state.streak = updateStreak(state.streak, getTodayKey());

  if (closeCall) {
    audio.playConfession();
  } else {
    audio.playCompletion();
  }

  burstParticles(slotEl, closeCall ? "close_call" : "normal");
  showMessagePop(pickMessage(closeCall));

  if (allSlotsCompleted()) {
    const banner = document.querySelector("#survived-banner");
    banner?.classList.add("show");
  }

  saveState(state);
  render();
};

const beginConfession = (index, slotEl) => {
  const stage = document.querySelector("#effect-stage");
  if (!stage) return;
  playConfessionSequence({
    mountPoint: stage,
    intensityEnabled: state.settings.intensityEnabled,
    onDone: () => markComplete(index, slotEl, true),
  });
};

const resetSlots = () => {
  state.items = [null, null, null];
  ui.draftIndex = null;
  const banner = document.querySelector("#survived-banner");
  banner?.classList.remove("show");
  saveState(state);
  render();
};

const handleAddItem = (index, value) => {
  if (!value) {
    ui.draftIndex = index;
    render();
    return;
  }
  state.items[index] = createItem(value);
  ui.draftIndex = null;
  saveState(state);
  render();
};

const triggerAdd = () => {
  if (allSlotsFilled()) {
    document.body.classList.remove("rejection-shake");
    if (state.settings.intensityEnabled) {
      document.body.classList.add("rejection-shake");
      window.setTimeout(() => document.body.classList.remove("rejection-shake"), 360);
    }
    showToast("3 is enough. You're not a hero.", "warning");
    audio.playReject();
    return;
  }

  ui.draftIndex = state.items.findIndex((item) => item === null);
  render();
};

const buildShell = () => {
  if (!app) return;
  app.innerHTML = `
    <div id="effect-stage"></div>
    <div id="survival-log" aria-hidden="true"></div>
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Not-To-Do List</p>
          <h1>The Survival App</h1>
          <p class="sub">Celebrate what you heroically refused to do.</p>
        </div>
        <div class="controls">
          <button id="sound-toggle" type="button" class="control-button"></button>
          <button id="intensity-toggle" type="button" class="control-button"></button>
          <button id="add-trigger" type="button" class="add-button">+ add not-to-do</button>
          <p id="streak-badge" class="streak"></p>
        </div>
      </header>
      <section id="slots" class="slots-grid"></section>
      <div id="message-pop" class="message-pop" aria-live="polite"></div>
      <section id="survived-banner" class="survived-banner">
        <h2>YOU SURVIVED TODAY</h2>
        <button id="reset-day" type="button">start fresh</button>
      </section>
    </main>
    <div id="toast-stack" class="toast-stack"></div>
  `;

  document.querySelector("#add-trigger")?.addEventListener("click", triggerAdd);
  document.querySelector("#reset-day")?.addEventListener("click", resetSlots);

  document.querySelector("#sound-toggle")?.addEventListener("click", async () => {
    state.settings.soundEnabled = !state.settings.soundEnabled;
    await audio.setEnabled(state.settings.soundEnabled);
    saveState(state);
    render();
  });

  document.querySelector("#intensity-toggle")?.addEventListener("click", () => {
    state.settings.intensityEnabled = !state.settings.intensityEnabled;
    saveState(state);
    render();
  });
};

const render = () => {
  renderSurvivalLog(document.querySelector("#survival-log"), state.history);

  const streakBadge = document.querySelector("#streak-badge");
  if (streakBadge) streakBadge.textContent = streakLabel(state.streak.count);

  const soundToggle = document.querySelector("#sound-toggle");
  if (soundToggle) {
    soundToggle.textContent = state.settings.soundEnabled ? "🔊 sound on" : "🔇 sound off";
  }

  const intensityToggle = document.querySelector("#intensity-toggle");
  if (intensityToggle) {
    intensityToggle.textContent = state.settings.intensityEnabled ? "⚡ intense" : "🌿 calm";
  }

  const banner = document.querySelector("#survived-banner");
  if (banner) banner.classList.toggle("show", allSlotsCompleted());

  renderSlots({
    container: document.querySelector("#slots"),
    items: state.items,
    draftIndex: ui.draftIndex,
    onAdd: handleAddItem,
    onScratch: (index, slotEl) => markComplete(index, slotEl, false),
    onConfess: beginConfession,
    intensityEnabled: state.settings.intensityEnabled,
    audio,
  });
};

buildShell();
if (!state.history.length) {
  state.history = getSeedHistory();
}
audio.setEnabled(state.settings.soundEnabled);
render();
window.setInterval(render, 60_000);
